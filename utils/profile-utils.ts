/**
 * Processes time attack high scores into sorted entries
 */
export const processTimeAttackScores = (timeAttackHighScores: Record<string, number>) => {
  return Object.entries(timeAttackHighScores)
    .map(([key, score]) => {
      const [gridSize, timeLimit] = key.split('-').map(Number);
      return { gridSize, timeLimit, score };
    })
    .sort((a, b) => b.score - a.score);
};
