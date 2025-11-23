import { useCallback } from 'react';
import { LevelData, ColorPalette, GameProgress } from '@/types';
import { generateLevel, generateLevelHash, isLevelHashGenerated, addLevelHash } from '@/lib';
import { TIMING } from '@/config';

interface UseUniqueLevelGeneratorOptions {
  progress: GameProgress;
  setProgress: (updates: Partial<GameProgress>) => void;
  setLevelData: (data: LevelData | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsLevelComplete: (complete: boolean) => void;
  setUserPaths: (paths: Record<number, number[]>) => void;
  resetMoveCount: () => void;
  clearMoveHistory: () => void;
  resetGameState: (params: {
    setIsGenerating: (generating: boolean) => void;
    setIsLevelComplete: (complete: boolean) => void;
    setUserPaths: (paths: Record<number, number[]>) => void;
    resetMoveCount: () => void;
    clearMoveHistory: () => void;
  }) => void;
}

/**
 * Shared hook for generating unique levels with global hash tracking.
 * Used by Zen Mode and Time Attack Mode to avoid code duplication.
 * 
 * @param options - Configuration object with all required functions
 * @returns Function to generate a unique level
 */
export const useUniqueLevelGenerator = (options: UseUniqueLevelGeneratorOptions) => {
  const {
    progress,
    setProgress,
    setLevelData,
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
    resetMoveCount,
    clearMoveHistory,
    resetGameState,
  } = options;

  return useCallback((
    width: number,
    height: number,
    minColors: number,
    maxColors: number,
    palette: ColorPalette[] | null,
    seed?: number
  ) => {
    resetGameState({
      setIsGenerating,
      setIsLevelComplete,
      setUserPaths,
      resetMoveCount,
      clearMoveHistory,
    });

    setTimeout(() => {
      const globalHashes = new Set(progress.generatedLevelHashes || []);
      let newLevel: LevelData | null = null;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 30;

      // Use requestIdleCallback with setTimeout fallback to yield control between attempts
      const scheduleNextAttempt = (callback: () => void) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(callback, { timeout: 50 });
        } else {
          setTimeout(callback, 0);
        }
      };

      const tryGenerate = () => {
        if (isUnique || attempts >= maxAttempts) {
          if (newLevel) {
            setLevelData(newLevel);
          } else {
            // Fallback: use the last generated level even if not unique
            const fallbackSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
            const result = generateLevel(width, height, minColors, maxColors, palette, fallbackSeed);
            setLevelData(result.level);
          }
          setIsGenerating(false);
          return;
        }

        // Generate one attempt
        const levelSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
        const result = generateLevel(width, height, minColors, maxColors, palette, levelSeed);
        newLevel = result.level;
        const hash = generateLevelHash(newLevel);

        if (!isLevelHashGenerated(hash, progress.generatedLevelHashes || [])) {
          isUnique = true;
          const updatedHashes = addLevelHash(hash, progress.generatedLevelHashes || []);
          setProgress({ generatedLevelHashes: updatedHashes });
          setLevelData(newLevel);
          setIsGenerating(false);
        } else {
          attempts++;
          scheduleNextAttempt(tryGenerate);
        }
      };

      // Start the async generation loop
      tryGenerate();
    }, TIMING.GENERATION_DELAY);
  }, [
    progress.generatedLevelHashes,
    setProgress,
    setLevelData,
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
    resetMoveCount,
    clearMoveHistory,
    resetGameState,
  ]);
};

