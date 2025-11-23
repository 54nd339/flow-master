import { LevelData } from '@/types';
import { generateLevel } from './level-generator';
import { getCurrentPalette, calculateColorCounts } from '@/utils';

/**
 * Gets today's date as a string in YYYY-MM-DD format.
 * Used for daily challenge identification and streak tracking.
 * 
 * @returns Date string in format "YYYY-MM-DD" (e.g., "2024-01-15")
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * Convert date string (YYYY-MM-DD) to numeric seed.
 * Format: YYYYMMDD as integer for consistent seeding.
 */
export const dateToSeed = (dateString: string): number => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
};

/**
 * Generate daily challenge level using today's date as seed.
 * Same date = same level for all players (deterministic).
 */
export const generateDailyChallenge = (): LevelData => {
  const today = getTodayDateString();
  const seed = dateToSeed(today);
  const palette = getCurrentPalette({ themeId: 'WATER' } as any);
  const { minC, maxC } = calculateColorCounts(8, 8, palette.length);
  const result = generateLevel(8, 8, minC, maxC, palette, seed);
  return result.level;
};

/**
 * Checks if the daily challenge for today has been solved.
 * 
 * @param dailySolved - The date string of the last solved daily challenge (or null)
 * @returns True if dailySolved matches today's date string, false otherwise
 */
export const isDailyChallengeSolved = (dailySolved: string | null): boolean => {
  const today = getTodayDateString();
  return dailySolved === today;
};

