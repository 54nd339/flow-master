import { TimeAttackConfig } from '@/types';
import { GameProgress } from '@/types';

/**
 * Generates a score key for time attack high scores
 * Format: "gridSize-timeLimit"
 */
export const getTimeAttackScoreKey = (gridSize: number, timeLimit: number): string => {
  return `${gridSize}-${timeLimit}`;
};

/**
 * Gets the high score for a specific time attack configuration
 */
export const getTimeAttackHighScore = (
  progress: GameProgress,
  gridSize: number,
  timeLimit: number
): number => {
  const scoreKey = getTimeAttackScoreKey(gridSize, timeLimit);
  const highScores = progress.timeAttackHighScores || {};
  return highScores[scoreKey] || 0;
};

/**
 * Checks if a score is a new high score
 */
export const isNewHighScore = (
  progress: GameProgress,
  gridSize: number,
  timeLimit: number,
  currentScore: number
): boolean => {
  const highScore = getTimeAttackHighScore(progress, gridSize, timeLimit);
  return currentScore > highScore;
};

