import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';
import { TIMING } from '@/config';

export const useZenAutoGeneration = (
  generateRandomPuzzle: () => void
) => {
  const { isLevelComplete } = useGameStore();
  const prevIsLevelComplete = useRef(isLevelComplete);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLevelComplete && !prevIsLevelComplete.current) {
      autoTimerRef.current = setTimeout(() => {
        generateRandomPuzzle();
      }, TIMING.PUZZLE_AUTO_NEXT_DELAY);
    }

    if (!isLevelComplete && prevIsLevelComplete.current) {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      generateRandomPuzzle();
    }

    prevIsLevelComplete.current = isLevelComplete;

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
      }
    };
  }, [isLevelComplete, generateRandomPuzzle]);
};

