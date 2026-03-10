"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GridCanvas } from "@/components/game/grid-canvas";
import { LoadingSpinner } from "@/components/game/loading-spinner";
import { audio, haptics } from "@/lib/audio";
import type { Difficulty } from "@/lib/engine/level-config";
import { registerAction } from "@/lib/keyboard-actions";
import { useIncrementProgress } from "@/stores/achievement-store";
import { useEarnLevelComplete, useEarnPerfectClear } from "@/stores/currency-store";
import { getGameState, useIsComplete, usePipePercent, useStarRating } from "@/stores/game-store";
import { getPuzzleState, useShowSolution } from "@/stores/puzzle-store";
import { useHaptics, useMuted } from "@/stores/settings-store";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";

const ZEN_SIZES = [5, 6, 7, 8, 9, 10, 11, 12] as const;
const ZEN_OSCILLATION: Difficulty[] = ["easy", "medium", "hard", "medium"];

export default function ZenPage() {
  const muted = useMuted();
  const hapticsEnabled = useHaptics();

  const isComplete = useIsComplete();
  const pipePercent = usePipePercent();
  const starRating = useStarRating();

  const earnLevelComplete = useEarnLevelComplete();
  const earnPerfectClear = useEarnPerfectClear();
  const incrementAchievement = useIncrementProgress();

  const { generate, puzzle, colors, isGenerating } = usePuzzleGenerator();
  const showSolution = useShowSolution();

  const [sessionCount, setSessionCount] = useState(0);
  const puzzleIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const getZenConfig = useCallback(() => {
    const idx = puzzleIndexRef.current;
    const size = ZEN_SIZES[idx % ZEN_SIZES.length];
    const diff = ZEN_OSCILLATION[idx % ZEN_OSCILLATION.length];
    return { size, diff };
  }, []);

  const generateNext = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    const { size, diff } = getZenConfig();
    getGameState().reset();
    const result = await generate(size, size, diff);
    if (result) {
      getGameState().initPuzzle(result);
      getGameState().stopTimer();
    }
    isTransitioningRef.current = false;
  }, [generate, getZenConfig]);

  const hasGenRef = useRef(false);
  useEffect(() => {
    if (hasGenRef.current) return;
    hasGenRef.current = true;
    generateNext();
  }, [generateNext]);

  useEffect(() => {
    const cleanups = [
      registerAction("reset", generateNext),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
    ];
    return () => cleanups.forEach((c) => c());
  }, [generateNext]);

  useEffect(() => {
    if (!isComplete) return;
    if (!muted) audio.puzzleComplete();
    if (hapticsEnabled) haptics.puzzleComplete();
    setTimeout(() => setSessionCount((c) => c + 1), 0);
    puzzleIndexRef.current++;

    earnLevelComplete();
    if (starRating === 3) earnPerfectClear();
    incrementAchievement("first_flow");
    incrementAchievement("ten_down");
    incrementAchievement("century");
    if (starRating === 3) incrementAchievement("perfectionist");

    const timer = setTimeout(() => {
      generateNext();
    }, 800);
    return () => clearTimeout(timer);
  }, [isComplete, muted, hapticsEnabled, generateNext, earnLevelComplete, earnPerfectClear, starRating, incrementAchievement]);

  return (
    <GameShell
      activePuzzle={puzzle}
      title={
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <span className="text-sm font-bold text-accent">Z</span>
            </div>
            <span className="hidden sm:inline font-bold">Zen Mode</span>
          </Link>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              Relaxing Flow
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Solved: {sessionCount} &middot; Infinite
            </p>
          </div>
        </div>
      }
      stats={
        puzzle ? (
          <GameStats
            pipePercent={pipePercent}
          />
        ) : null
      }
      actions={
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Home
        </Link>
      }
    >
      {isGenerating && !puzzle && (
        <LoadingSpinner message="Generating next flow..." />
      )}

      {puzzle && (
        <GridCanvas
          puzzle={puzzle}
          colors={colors}
          showSolution={showSolution}
          className="w-full h-full"
        />
      )}

      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] pointer-events-none transition-all duration-500">
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-foreground bg-background/80 px-3 py-1 rounded-full border border-border shadow-sm">
              Preparing next puzzle...
            </span>
          </div>
        </div>
      )}
    </GameShell>
  );
}
