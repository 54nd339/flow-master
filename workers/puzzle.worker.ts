import { expose } from "comlink";

import { colorTubes, solutionLines } from "@/lib/engine/colorize";
import { make } from "@/lib/engine/gen";
import { Mitm } from "@/lib/engine/mitm";
import { createPRNG } from "@/lib/engine/prng";
import type { Endpoint, SolutionPath } from "@/lib/engine/types";

const mitmCache = new Map<number, Mitm>();

export interface GenerateResult {
  width: number;
  height: number;
  endpoints: Endpoint[];
  solution: SolutionPath[];
  colors: [string, string][];
}

/** Mandated worker API contract per copilot-instructions.md */
export interface GenerateOpts {
  min?: number;
  max?: number;
  seed?: number;
  maxAttempts?: number;
  onProgress?: (attempts: number) => void;
}

export interface GeneratorAPI {
  generate(
    w: number,
    h: number,
    opts: GenerateOpts,
  ): GenerateResult | null;
}

const api: GeneratorAPI = {
  generate(w, h, opts) {
    const random = createPRNG(opts.seed);
    const h2 = Math.min(20, Math.max(h, 6));

    let mitm = mitmCache.get(h2);
    if (!mitm) {
      mitm = new Mitm(2, 1);
      mitm.prepare(h2);
      mitmCache.set(h2, mitm);
    }

    const maxAttempts = opts.maxAttempts ?? 500;
    let attempts = 0;

    // Retry loop with progress callbacks
    for (let i = 0; i < maxAttempts; i++) {
      attempts++;
      if (opts.onProgress && attempts % 10 === 0) {
        opts.onProgress(attempts);
      }

      const grid = make(w, h, mitm, {
        min: opts.min ?? 3,
        max: opts.max ?? 8,
        random,
        maxAttempts: 1,
      });

      if (grid) {
        const { endpoints, colors } = colorTubes(grid);
        const solution = solutionLines(grid);
        if (opts.onProgress) opts.onProgress(attempts);
        return {
          width: w,
          height: h,
          endpoints,
          solution,
          colors: [...colors.entries()],
        };
      }
    }

    return null;
  },
};

expose(api);
