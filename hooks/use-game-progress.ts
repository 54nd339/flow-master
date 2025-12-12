import { useMemo } from 'react';
import { useGameStore } from '@/stores/game-store';
import { THEME_PRESETS } from '@/constants';

/**
 * Hook to access game progress state
 * @returns Current game progress
 */
export const useGameProgress = () => {
  return useGameStore((state) => state.progress);
};

/**
 * Hook to access current theme
 * @returns Current theme preset
 */
export const useTheme = () => {
  const themeId = useGameStore((state) => state.progress.themeId);
  return useMemo(
    () => THEME_PRESETS[themeId] || THEME_PRESETS.WATER,
    [themeId]
  );
};

/**
 * Hook to access current rank based on stage
 * @returns Current rank information
 */
export const useCurrentRank = () => {
  const progress = useGameProgress();
  const theme = useTheme();
  const currentGroupIdx = Math.ceil(progress.stage / 5) - 1;
  return useMemo(
    () => theme.ranks[Math.min(currentGroupIdx, 4)] || theme.ranks[0],
    [theme, currentGroupIdx]
  );
};

/**
 * Hook to access sound settings
 * @returns Object with sound and music enabled states
 */
export const useSoundSettings = () => {
  const sound = useGameStore((state) => state.progress.sound);
  const music = useGameStore((state) => state.progress.music);
  return { sound, music };
};
