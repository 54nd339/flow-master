export type Difficulty = "easy" | "medium" | "hard"

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export interface PairRange {
  min: number
  max: number
}

interface GridConfig {
  grid: [number, number]
  pairs: Record<Difficulty, PairRange>
  maxAttempts: number
  workerConcurrency: "auto" | number
}

/**
 * Benchmark-informed pair ranges tuned for puzzle quality.
 *
 * Design principles:
 *   - Lower pair counts = longer paths that snake and interweave (harder routing)
 *   - Higher pair counts = shorter paths, more endpoints, tighter constraints
 *   - Sweet spot is 50-80% of sqrt(area) for medium difficulty
 *   - Easy uses the lower end, hard uses the upper end
 *   - For large grids (20+), use wider ranges so the generator has room
 */
const GRID_CONFIGS: GridConfig[] = [
  { grid: [5, 5],   pairs: { easy: { min: 3, max: 4 }, medium: { min: 4, max: 5 }, hard: { min: 5, max: 6 } },     maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [6, 6],   pairs: { easy: { min: 4, max: 5 }, medium: { min: 5, max: 6 }, hard: { min: 6, max: 7 } },     maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [7, 7],   pairs: { easy: { min: 4, max: 5 }, medium: { min: 5, max: 7 }, hard: { min: 7, max: 8 } },     maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [8, 8],   pairs: { easy: { min: 5, max: 6 }, medium: { min: 6, max: 8 }, hard: { min: 8, max: 9 } },     maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [9, 9],   pairs: { easy: { min: 5, max: 7 }, medium: { min: 7, max: 9 }, hard: { min: 9, max: 10 } },    maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [8, 11],  pairs: { easy: { min: 5, max: 7 }, medium: { min: 7, max: 9 }, hard: { min: 9, max: 10 } },    maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [10, 10], pairs: { easy: { min: 6, max: 7 }, medium: { min: 7, max: 9 }, hard: { min: 9, max: 11 } },    maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [9, 12],  pairs: { easy: { min: 6, max: 8 }, medium: { min: 8, max: 10 }, hard: { min: 10, max: 11 } },  maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [11, 11], pairs: { easy: { min: 6, max: 8 }, medium: { min: 8, max: 10 }, hard: { min: 10, max: 11 } },  maxAttempts: 500,  workerConcurrency: 1 },
  { grid: [10, 13], pairs: { easy: { min: 6, max: 8 }, medium: { min: 8, max: 10 }, hard: { min: 10, max: 11 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [12, 12], pairs: { easy: { min: 7, max: 9 }, medium: { min: 9, max: 11 }, hard: { min: 11, max: 12 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [11, 14], pairs: { easy: { min: 7, max: 9 }, medium: { min: 8, max: 10 }, hard: { min: 10, max: 12 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [13, 13], pairs: { easy: { min: 7, max: 9 }, medium: { min: 9, max: 11 }, hard: { min: 11, max: 13 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [12, 15], pairs: { easy: { min: 7, max: 9 }, medium: { min: 8, max: 10 }, hard: { min: 10, max: 12 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [14, 14], pairs: { easy: { min: 7, max: 9 }, medium: { min: 9, max: 11 }, hard: { min: 11, max: 13 } },  maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [13, 16], pairs: { easy: { min: 8, max: 10 }, medium: { min: 10, max: 12 }, hard: { min: 12, max: 13 } }, maxAttempts: 400,  workerConcurrency: 1 },
  { grid: [15, 15], pairs: { easy: { min: 7, max: 9 }, medium: { min: 9, max: 11 }, hard: { min: 11, max: 13 } },  maxAttempts: 400,  workerConcurrency: "auto" },
  { grid: [14, 17], pairs: { easy: { min: 8, max: 10 }, medium: { min: 10, max: 12 }, hard: { min: 12, max: 14 } }, maxAttempts: 400,  workerConcurrency: "auto" },
  { grid: [15, 18], pairs: { easy: { min: 8, max: 10 }, medium: { min: 10, max: 12 }, hard: { min: 12, max: 14 } }, maxAttempts: 300,  workerConcurrency: "auto" },
  { grid: [16, 19], pairs: { easy: { min: 9, max: 11 }, medium: { min: 11, max: 13 }, hard: { min: 13, max: 15 } }, maxAttempts: 300,  workerConcurrency: "auto" },
  { grid: [20, 20], pairs: { easy: { min: 10, max: 13 }, medium: { min: 13, max: 16 }, hard: { min: 16, max: 18 } }, maxAttempts: 2000, workerConcurrency: "auto" },
  { grid: [25, 25], pairs: { easy: { min: 12, max: 16 }, medium: { min: 15, max: 19 }, hard: { min: 18, max: 22 } }, maxAttempts: 2000, workerConcurrency: "auto" },
  { grid: [30, 30], pairs: { easy: { min: 14, max: 18 }, medium: { min: 18, max: 24 }, hard: { min: 22, max: 28 } }, maxAttempts: 2000, workerConcurrency: "auto" },
  { grid: [40, 40], pairs: { easy: { min: 16, max: 22 }, medium: { min: 22, max: 32 }, hard: { min: 30, max: 40 } }, maxAttempts: 2000, workerConcurrency: "auto" },
  { grid: [50, 50], pairs: { easy: { min: 20, max: 28 }, medium: { min: 28, max: 38 }, hard: { min: 35, max: 45 } }, maxAttempts: 2000, workerConcurrency: "auto" },
];

const configIndex = new Map<string, GridConfig>();
for (const cfg of GRID_CONFIGS) {
  configIndex.set(`${cfg.grid[0]}x${cfg.grid[1]}`, cfg);
}

function interpolatePairRange(w: number, h: number, difficulty: Difficulty): PairRange {
  const area = w * h;
  const n = Math.sqrt(area);

  const scale: Record<Difficulty, [number, number]> = {
    easy:   [0.50, 0.70],
    medium: [0.65, 0.90],
    hard:   [0.80, 1.10],
  };

  const [lo, hi] = scale[difficulty];
  return {
    min: Math.max(3, Math.floor(n * lo)),
    max: Math.max(4, Math.ceil(n * hi)),
  };
}

function interpolateMaxAttempts(w: number, h: number): number {
  const area = w * h;
  if (area <= 100) return 500;
  if (area <= 225) return 400;
  if (area <= 400) return 300;
  return 2000;
}

export function getLevelConfig(w: number, h: number, difficulty: Difficulty = "medium"): {
  pairs: PairRange
  maxAttempts: number
  workerConcurrency: "auto" | number
} {
  const exact = configIndex.get(`${w}x${h}`);
  if (exact) {
    return {
      pairs: exact.pairs[difficulty],
      maxAttempts: exact.maxAttempts,
      workerConcurrency: exact.workerConcurrency,
    };
  }

  return {
    pairs: interpolatePairRange(w, h, difficulty),
    maxAttempts: interpolateMaxAttempts(w, h),
    workerConcurrency: w * h >= 225 ? "auto" : 1,
  };
}

export function getLevelConfigDirect(w: number, h: number, min: number, max: number) {
  return {
    pairs: { min, max } as PairRange,
    maxAttempts: interpolateMaxAttempts(w, h),
    workerConcurrency: (w * h >= 225 ? "auto" : 1) as "auto" | number,
  };
}

export function resolveWorkerConcurrency(config: "auto" | number): number {
  if (typeof config === "number") return config;
  if (typeof navigator === "undefined") return 2;
  return Math.min(navigator.hardwareConcurrency ?? 4, 8);
}
