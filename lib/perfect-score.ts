import { LevelData } from '@/types';

/**
 * Calculates the minimum number of moves required to solve a level.
 * 
 * The minimum moves is the sum of (path.length - 1) for each solution path,
 * since the first cell in each path doesn't count as a move.
 * 
 * @param levelData - Level data containing solved paths
 * @returns Minimum number of moves required (0 if no solved paths)
 */
export const calculateMinMoves = (levelData: LevelData): number => {
  if (!levelData.solvedPaths) return 0;

  let minMoves = 0;
  levelData.solvedPaths.forEach((path) => {
    minMoves += Math.max(0, path.path.length - 1);
  });

  return minMoves;
};

/**
 * Calculates perfect score (stars and perfect flag) based on move efficiency.
 * 
 * Perfect Score Requirements:
 * - No backtracking (player didn't undo path segments)
 * - No line breaks (path exactly matches solution)
 * - Within 20% of optimal moves (moves <= minMoves * 1.2)
 * 
 * Star Rating Thresholds:
 * - 3 stars: Perfect OR within 50% of optimal (moves <= minMoves * 1.5)
 * - 2 stars: Within 100% of optimal (moves <= minMoves * 2.0)
 * - 1 star: Within 200% of optimal (moves <= minMoves * 3.0)
 * - 0 stars: More than 3x optimal moves
 * 
 * @param moves - Number of moves taken by the player
 * @param minMoves - Minimum moves required (optimal solution)
 * @param hasBacktracking - Whether the player backtracked during solving
 * @param hasLineBreaks - Whether the path deviates from the solution
 * @returns Object with stars (0-3) and perfect (boolean) flag
 */
export const calculatePerfectScore = (
  moves: number,
  minMoves: number,
  hasBacktracking: boolean,
  hasLineBreaks: boolean
): { stars: number; perfect: boolean } => {
  const perfect = !hasBacktracking && !hasLineBreaks && moves <= minMoves * 1.2;
  let stars = 0;
  if (perfect || moves <= minMoves * 1.5) {
    stars = 3;
  } else if (moves <= minMoves * 2.0) {
    stars = 2;
  } else if (moves <= minMoves * 3.0) {
    stars = 1;
  }

  return { stars, perfect };
};

/**
 * Checks if a path has been backtracked (shortened or modified).
 * 
 * Backtracking is detected if:
 * - Current path is shorter than previous path, OR
 * - Any cell in the previous path (except the last) differs from current path
 * 
 * @param currentPath - Current state of the path
 * @param previousPath - Previous state of the path
 * @returns True if backtracking occurred
 */
export const hasBacktracked = (
  currentPath: number[],
  previousPath: number[]
): boolean => {
  if (previousPath.length === 0) return false;
  if (currentPath.length < previousPath.length) return true;

  for (let i = 0; i < previousPath.length - 1; i++) {
    if (currentPath[i] !== previousPath[i]) {
      return true;
    }
  }

  return false;
};
