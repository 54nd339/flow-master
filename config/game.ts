import { Stage } from '@/types';

/**
 * Game level configuration
 */
export const STAGES: Stage[] = [
  { id: 1, w: 5, h: 5, minC: 4, maxC: 5 }, { id: 2, w: 6, h: 6, minC: 4, maxC: 6 },
  { id: 3, w: 7, h: 7, minC: 5, maxC: 7 }, { id: 4, w: 8, h: 8, minC: 5, maxC: 8 },
  { id: 5, w: 9, h: 9, minC: 6, maxC: 9 }, { id: 6, w: 8, h: 11, minC: 6, maxC: 9 },
  { id: 7, w: 10, h: 10, minC: 7, maxC: 10 }, { id: 8, w: 9, h: 12, minC: 7, maxC: 10 },
  { id: 9, w: 11, h: 11, minC: 8, maxC: 11 }, { id: 10, w: 10, h: 13, minC: 8, maxC: 11 },
  { id: 11, w: 12, h: 12, minC: 9, maxC: 12 }, { id: 12, w: 11, h: 14, minC: 9, maxC: 12 },
  { id: 13, w: 13, h: 13, minC: 10, maxC: 13 }, { id: 14, w: 12, h: 15, minC: 10, maxC: 13 },
  { id: 15, w: 14, h: 14, minC: 11, maxC: 14 }, { id: 16, w: 13, h: 16, minC: 11, maxC: 14 },
  { id: 17, w: 15, h: 15, minC: 12, maxC: 15 }, { id: 18, w: 14, h: 17, minC: 12, maxC: 15 },
  { id: 19, w: 15, h: 18, minC: 12, maxC: 15 }, { id: 20, w: 16, h: 19, minC: 13, maxC: 16 },
  { id: 21, w: 20, h: 20, minC: 17, maxC: 20 }, { id: 22, w: 25, h: 25, minC: 22, maxC: 25 },
  { id: 23, w: 30, h: 30, minC: 27, maxC: 30 }, { id: 24, w: 35, h: 35, minC: 32, maxC: 35 },
  { id: 25, w: 40, h: 40, minC: 37, maxC: 40 },
];

/**
 * Game progression rules
 */
export const LEVELS_PER_STAGE = 5;
export const HINTS_START = 3;
export const LEVELS_FOR_HINT = 1;

/**
 * Background level generation configuration
 */
export const BACKGROUND_GENERATION = {
  ROUNDS: 20, // Number of rounds to generate (ROUNDS * LEVELS_PER_STAGE = total levels per grid size)
  LEVELS_PER_ROUND: LEVELS_PER_STAGE,
  MAX_ATTEMPTS_PER_LEVEL: 2000, // Max attempts when generating a level
} as const;

/**
 * Theme unlock prices (in flows)
 */
export const THEME_PRICES: Record<string, number> = {
  WATER: 0,
  ELECTRIC: 500,
  NEURAL: 750,
  LIGHT: 1000,
  ZEN: 1500,
};

/**
 * Flow currency rewards for various actions
 */
export const FLOW_REWARDS = {
  LEVEL_COMPLETE: 10,
  PERFECT_CLEAR: 50,
  DAILY_CHALLENGE: 25,
  TIME_ATTACK_PUZZLE: 5,
  STREAK_BONUS: 10,
} as const;

/**
 * Zen Mode configuration
 */
export const ZEN_MODE = {
  MIN_GRID_SIZE: 5,
  MAX_GRID_SIZE: 12,
} as const;

/**
 * Time Attack Mode configuration
 */
export const TIME_ATTACK = {
  GRID_SIZES: [5, 6, 7, 8, 9] as const,
  TIME_LIMITS: [30, 60, 120, 240] as const, // seconds
} as const;

/**
 * Application-level configuration constants
 */
export const STORAGE_KEY = 'flowMaster_v1';

