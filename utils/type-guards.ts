import { ViewMode } from '@/types';

/**
 * Type guard to check if a string is a valid ViewMode
 * @param value - String to check
 * @returns True if value is a valid ViewMode
 */
export const isValidViewMode = (value: string): value is ViewMode => {
  return [
    'PLAY',
    'DAILY',
    'TIME_ATTACK',
    'ZEN',
    'CREATE',
    'PROFILE',
    'ACHIEVEMENTS',
    'SETTINGS',
  ].includes(value);
};

