import { LevelData, GameProgress } from '@/types';
import { useGameStore } from '@/stores/game-store';
import { getCurrentPalette } from '@/utils';

/**
 * Triggers a hint by automatically completing the first incomplete path.
 * 
 * Hint Selection Algorithm:
 * - Iterates through colors in order (0 to difficulty-1), cycling through palette
 * - Selects the first color whose path is:
 *   - Missing (not started)
 *   - Empty (started but no cells)
 *   - Incomplete (doesn't exactly match the solution path)
 * 
 * This prioritizes earlier colors for consistent hint behavior, making hints
 * predictable and helpful rather than random.
 * 
 * When a hint is triggered:
 * - The complete solution path for the selected color is applied
 * - Hint count is decremented
 * - Hint used flag is set to true
 * 
 * @param levelData - Current level data with solution paths
 * @param userPaths - Current user-drawn paths
 * @param progress - Game progress state
 * @param setProgress - Function to update progress
 * @param setHintUsed - Function to mark hint as used
 */
export const triggerHint = (
  levelData: LevelData | null,
  userPaths: Record<number, number[]>,
  progress: GameProgress,
  setProgress: (updates: Partial<GameProgress>) => void,
  setHintUsed: (used: boolean) => void
) => {
  if (!levelData || !levelData.solvedPaths?.length) return;

  const solutionMap = new Map<number, number[]>();
  levelData.solvedPaths.forEach((p) => solutionMap.set(p.colorId, p.path));

  const currentPalette = getCurrentPalette(progress);

  // Find first incomplete path: prioritize earlier colors for consistent hint behavior
  let targetColor = -1;
  for (let i = 0; i < levelData.difficulty; i++) {
    const colorId = i % currentPalette.length;
    const correctPath = solutionMap.get(colorId);
    const currentPath = userPaths[colorId];
    if (!correctPath) continue;
    // Hint triggers if path is missing, empty, or doesn't exactly match solution
    if (
      !currentPath ||
      currentPath.length === 0 ||
      !(
        currentPath.length === correctPath.length &&
        currentPath.every((v, k) => v === correctPath[k])
      )
    ) {
      targetColor = colorId;
      break;
    }
  }

  if (targetColor !== -1) {
    const solutionPath = solutionMap.get(targetColor);
    if (solutionPath) {
      const { updateUserPath } = useGameStore.getState();
      updateUserPath(targetColor, [...solutionPath]);
      setHintUsed(true);
      setProgress({ hints: progress.hints - 1 });
    }
  }
};

