/**
 * Common game reset logic used across multiple game modes
 */
export interface ResetGameStateParams {
  setIsGenerating: (value: boolean) => void;
  setIsLevelComplete: (value: boolean) => void;
  setUserPaths: (paths: Record<number, number[]>) => void;
  resetMoveCount: () => void;
  clearMoveHistory: () => void;
}

/**
 * Resets game state before generating a new level
 */
export const resetGameState = (params: ResetGameStateParams) => {
  const {
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
    resetMoveCount,
    clearMoveHistory,
  } = params;

  setIsGenerating(true);
  setIsLevelComplete(false);
  setUserPaths({});
  resetMoveCount();
  clearMoveHistory();
};
