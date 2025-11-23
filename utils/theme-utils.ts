import { THEME_PRESETS } from '@/constants';
import { GameProgress } from '@/types';

/**
 * Gets the active theme for a given progress state
 */
export const getActiveTheme = (progress: GameProgress) => {
  return THEME_PRESETS[progress.themeId] || THEME_PRESETS.WATER;
};

/**
 * Gets the current palette for a given progress state
 */
export const getCurrentPalette = (progress: GameProgress) => {
  const theme = getActiveTheme(progress);
  return theme.palette || THEME_PRESETS.WATER.palette;
};

