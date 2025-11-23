import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { TIMING } from '@/config';
import { generateLevel } from '@/lib';
import { getTimeAttackScoreKey, getTimeAttackHighScore } from '@/utils';

export const useTimeAttackTimer = (
  isPaused: boolean,
  generateNextPuzzle: (size: number) => void
) => {
  const {
    timeAttack,
    setTimeAttack,
    progress,
    setProgress: updateProgress,
    setLevelData,
    setUserPaths,
    setIsLevelComplete,
    resetMoveCount,
    clearMoveHistory,
  } = useGameStore();

  useEffect(() => {
    if (!timeAttack?.isActive) return;
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeAttack((prev) => {
        if (!prev) return null;
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          const finalScore = prev.puzzlesCompleted;
          const scoreKey = getTimeAttackScoreKey(prev.gridSize, prev.timeLimit);
          const currentHighScores = progress.timeAttackHighScores || {};
          const currentHighScore = getTimeAttackHighScore(progress, prev.gridSize, prev.timeLimit);

          if (finalScore > currentHighScore) {
            updateProgress({
              timeAttackHighScores: {
                ...currentHighScores,
                [scoreKey]: finalScore,
              },
            });
          }

          setTimeout(() => {
            setTimeAttack((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                isActive: false,
                timeRemaining: 0,
              };
            });
            setLevelData(null);
            setUserPaths({});
            setIsLevelComplete(false);
            resetMoveCount();
            clearMoveHistory();
          }, TIMING.TIME_ATTACK_END_DELAY);

          return {
            ...prev,
            isActive: false,
            timeRemaining: 0,
          };
        }
        return {
          ...prev,
          timeRemaining: newTime,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeAttack?.isActive, isPaused, setTimeAttack, progress.timeAttackHighScores, updateProgress, setLevelData, setUserPaths, setIsLevelComplete, resetMoveCount, clearMoveHistory]);
};

