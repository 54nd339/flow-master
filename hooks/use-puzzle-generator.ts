"use client";

import { useCallback, useRef } from "react";
import { type Remote, wrap } from "comlink";

import { type Difficulty, getLevelConfig, getLevelConfigDirect, resolveWorkerConcurrency } from "@/lib/engine/level-config";
import { PuzzleData } from "@/lib/engine/types";
import { getPuzzleState, useColors, useGenerationTimeMs, useIsGenerating, usePuzzle } from "@/stores/puzzle-store";

import type { GenerateResult, GeneratorAPI } from "@/workers/puzzle.worker";

function resultToPuzzleData(result: GenerateResult): PuzzleData {
  return new PuzzleData(
    result.width,
    result.height,
    result.endpoints,
    result.solution,
    Date.now(),
    undefined,
  );
}

function spawnWorker(): { worker: Worker; proxy: Remote<GeneratorAPI> } {
  const worker = new Worker(
    new URL("../workers/puzzle.worker.ts", import.meta.url),
    { type: "module" },
  );
  const proxy = wrap<GeneratorAPI>(worker);
  return { worker, proxy };
}

const MAX_RETRIES = 3;

export interface PairOverride {
  min: number
  max: number
}

export interface PuzzleGeneratorState {
  generate: (
    w: number,
    h: number,
    difficulty?: Difficulty,
    seed?: number,
    pairOverride?: PairOverride,
  ) => Promise<PuzzleData | null>;
  cancel: () => void;
  preGenerate: (
    w: number,
    h: number,
    difficulty?: Difficulty,
  ) => void;
  consumePreGenerated: () => {
    puzzle: PuzzleData;
    colors: Map<string, string>;
  } | null;
  isGenerating: boolean;
  generationTimeMs: number;
  puzzle: PuzzleData | null;
  colors: Map<string, string>;
}

export function usePuzzleGenerator(): PuzzleGeneratorState {
  const puzzle = usePuzzle();
  const colors = useColors();
  const isGenerating = useIsGenerating();
  const generationTimeMs = useGenerationTimeMs();

  const activeWorkers = useRef<Worker[]>([]);
  const cancelledRef = useRef(false);
  const preGenWorkers = useRef<Worker[]>([]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    for (const w of activeWorkers.current) w.terminate();
    activeWorkers.current = [];
    for (const w of preGenWorkers.current) w.terminate();
    preGenWorkers.current = [];
    getPuzzleState().setGenerating(false);
  }, []);

  const runGeneration = useCallback(
    async (
      w: number,
      h: number,
      difficulty: Difficulty,
      seed?: number,
      pairOverride?: PairOverride,
    ): Promise<{ puzzleData: PuzzleData; colorMap: Map<string, string> } | null> => {
      const config = pairOverride
        ? getLevelConfigDirect(w, h, pairOverride.min, pairOverride.max)
        : getLevelConfig(w, h, difficulty);
      const concurrency = resolveWorkerConcurrency(config.workerConcurrency);

      const entries: { worker: Worker; proxy: Remote<GeneratorAPI> }[] = [];
      for (let i = 0; i < concurrency; i++) {
        entries.push(spawnWorker());
      }

      const workers = entries.map((e) => e.worker);

      try {
        const racePromises = entries.map((entry, i) =>
          entry.proxy
            .generate(w, h, {
              min: config.pairs.min,
              max: config.pairs.max,
              maxAttempts: config.maxAttempts,
              seed: seed != null ? seed + i : undefined,
            })
            .then((result) => ({ result, index: i })),
        );

        const { result } = await Promise.race(racePromises);

        for (const entry of entries) entry.worker.terminate();

        if (!result) return null;

        return {
          puzzleData: resultToPuzzleData(result),
          colorMap: new Map(result.colors),
        };
      } catch {
        for (const entry of workers) {
          try { entry.terminate(); } catch { /* already dead */ }
        }
        return null;
      }
    },
    [],
  );

  const generate = useCallback(
    async (
      w: number,
      h: number,
      difficulty: Difficulty = "medium",
      seed?: number,
      pairOverride?: PairOverride,
    ): Promise<PuzzleData | null> => {
      for (const prev of activeWorkers.current) prev.terminate();
      activeWorkers.current = [];
      cancelledRef.current = false;
      getPuzzleState().setGenerating(true);

      const start = performance.now();
      let lastError: unknown = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (cancelledRef.current) return null;

        try {
          const result = await runGeneration(w, h, difficulty, seed, pairOverride);

          if (cancelledRef.current) return null;

          if (result) {
            getPuzzleState().setPuzzle(result.puzzleData, result.colorMap);
            getPuzzleState().setGenerationTime(Math.round(performance.now() - start));
            return result.puzzleData;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (!cancelledRef.current && difficulty !== "easy" && !pairOverride) {
        try {
          const fallback = await runGeneration(w, h, "easy", seed);
          if (fallback && !cancelledRef.current) {
            getPuzzleState().setPuzzle(fallback.puzzleData, fallback.colorMap);
            getPuzzleState().setGenerationTime(Math.round(performance.now() - start));
            return fallback.puzzleData;
          }
        } catch {
          /* exhausted all options */
        }
      }

      if (!cancelledRef.current) {
        getPuzzleState().setGenerating(false);
        if (lastError && process.env.NODE_ENV === "development") console.warn("Generation failed after retries:", lastError);
      }
      return null;
    },
    [runGeneration],
  );

  const preGenerate = useCallback(
    (w: number, h: number, difficulty: Difficulty = "medium") => {
      for (const prev of preGenWorkers.current) prev.terminate();
      preGenWorkers.current = [];

      const config = getLevelConfig(w, h, difficulty);
      const entry = spawnWorker();
      preGenWorkers.current = [entry.worker];

      entry.proxy
        .generate(w, h, {
          min: config.pairs.min,
          max: config.pairs.max,
          maxAttempts: config.maxAttempts,
        })
        .then((result) => {
          preGenWorkers.current = [];
          if (result) {
            const pd = resultToPuzzleData(result);
            const cm = new Map(result.colors);
            getPuzzleState().setPreGenerated(pd, cm);
          }
        })
        .catch(() => {
          preGenWorkers.current = [];
        });
    },
    [],
  );

  const consumePreGenerated = useCallback(() => {
    return getPuzzleState().consumePreGenerated();
  }, []);

  return {
    generate,
    cancel,
    preGenerate,
    consumePreGenerated,
    isGenerating,
    generationTimeMs,
    puzzle,
    colors,
  };
}
