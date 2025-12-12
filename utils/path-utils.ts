import { LevelData } from '@/types';
import { isAdjacentMove } from './grid-utils';
import { audioEngine, hapticFeedback } from '@/lib';

/**
 * Validates if a move is valid (adjacent and not the same cell)
 * 
 * @param fromIdx - Source cell index
 * @param toIdx - Target cell index
 * @param width - Grid width
 * @param lastTouchedIdx - Last touched cell index (prevents duplicate touches)
 * @returns True if the move is valid
 */
export const isValidMove = (
  fromIdx: number,
  toIdx: number,
  width: number,
  lastTouchedIdx: number | null
): boolean => {
  if (toIdx === lastTouchedIdx) return false;
  return isAdjacentMove(fromIdx, toIdx, width);
};

/**
 * Creates a reverse lookup map from cell indices to color IDs for O(1) path lookups.
 * 
 * @param userPaths - All user-drawn paths
 * @param excludeColor - Optional color ID to exclude from the map
 * @returns Map from cell index to color ID
 */
export const createPathLookupMap = (
  userPaths: Record<number, number[]>,
  excludeColor?: number
): Map<number, number> => {
  const lookup = new Map<number, number>();
  for (const [cId, path] of Object.entries(userPaths)) {
    const colorId = parseInt(cId);
    if (excludeColor !== undefined && colorId === excludeColor) continue;
    for (const cellIdx of path) {
      lookup.set(cellIdx, colorId);
    }
  }
  return lookup;
};

/**
 * Checks if a cell is part of an existing path using optimized lookup.
 * 
 * @param cellIdx - Cell index to search for
 * @param pathLookup - Pre-computed lookup map from createPathLookupMap
 * @param userPaths - All user-drawn paths (for returning full path)
 * @returns Path containing the cell, or null if not found
 */
export const findPathContainingCell = (
  cellIdx: number,
  pathLookup: Map<number, number>,
  userPaths: Record<number, number[]>
): { colorId: number; path: number[] } | null => {
  const colorId = pathLookup.get(cellIdx);
  if (colorId === undefined) return null;
  const path = userPaths[colorId];
  return path ? { colorId, path } : null;
};


/**
 * Checks if backtracking occurred (clicking previous cell)
 * 
 * Backtracking is detected when the target cell is the second-to-last cell
 * in the current path, indicating the player is moving backwards.
 * 
 * @param currentPath - Current path array
 * @param targetIdx - Target cell index
 * @returns True if backtracking occurred
 */
export const isBacktracking = (currentPath: number[], targetIdx: number): boolean => {
  return currentPath.length > 1 && currentPath[currentPath.length - 2] === targetIdx;
};

/**
 * Checks if a loop would be created (clicking cell already in path)
 * 
 * A loop occurs when trying to move to a cell that's already in the current path,
 * which would create a closed loop (invalid in Flow puzzles).
 * 
 * @param currentPath - Current path array
 * @param targetIdx - Target cell index
 * @returns True if a loop would be created
 */
export const isLoop = (currentPath: number[], targetIdx: number): boolean => {
  return currentPath.includes(targetIdx);
};

/**
 * Checks if a path for a given color is complete (both anchors connected).
 * 
 * A path is considered complete if:
 * - The path has at least one cell
 * - There are exactly 2 anchors for this color
 * - The path starts at one anchor and ends at the other (different anchors)
 * 
 * @param levelData - Level data containing anchors
 * @param userPath - Current user-drawn path for the color
 * @param colorId - Color ID to check
 * @returns True if the path is complete (both anchors connected)
 */
export const isPathComplete = (
  levelData: LevelData,
  userPath: number[],
  colorId: number
): boolean => {
  if (userPath.length === 0) return false;

  const colorAnchors = Object.entries(levelData.anchors)
    .filter(([_, anchor]) => anchor.colorId === colorId)
    .map(([idx]) => parseInt(idx));

  if (colorAnchors.length !== 2) return false;

  const start = userPath[0];
  const end = userPath[userPath.length - 1];

  return colorAnchors.includes(start) && colorAnchors.includes(end) && start !== end;
};

export interface PathMovementResult {
  handled: boolean;
  shouldUpdateLastTouched?: boolean;
  shouldAddHistory?: boolean;
  shouldIncrementMove?: boolean;
}

/**
 * Handles path movement logic for both mouse/touch and keyboard input.
 * Centralized logic to prevent duplication between game-board and keyboard-navigation.
 * 
 * Processing Order (checked in sequence):
 * 1. Anchor Validation: Prevents moving over anchors of different colors
 * 2. Backtracking Detection: If moving to a cell already in the path, truncates path
 * 3. Loop Prevention: Blocks moves that would create a closed loop
 * 4. Completion Check: If reaching matching anchor, completes path and clears active color
 * 5. Intersection Handling: If moving over another color's path, truncates that path
 * 6. Normal Move: Adds cell to current path
 * 
 * @param targetIdx - Target cell index to move to
 * @param activeColor - Currently active color ID
 * @param currentPath - Current path for the active color
 * @param levelData - Level data including anchors
 * @param userPaths - All user-drawn paths
 * @param setActiveColor - Function to set/clear active color
 * @param updateUserPath - Function to update a color's path
 * @param soundEnabled - Whether to play sound effects
 * @returns Result object indicating what happened and what UI should update
 */
export const handlePathMovement = (
  targetIdx: number,
  activeColor: number,
  currentPath: number[],
  levelData: LevelData,
  userPaths: Record<number, number[]>,
  setActiveColor: (color: number | null) => void,
  updateUserPath: (colorId: number, path: number[]) => void,
  soundEnabled: boolean
): PathMovementResult => {
  // Prevent moving over anchors of different colors
  const anchorAtIdx = levelData.anchors[targetIdx];
  if (anchorAtIdx && anchorAtIdx.colorId !== activeColor) {
    return { handled: false };
  }

  // Check for backtracking
  if (isBacktracking(currentPath, targetIdx)) {
    updateUserPath(activeColor, currentPath.slice(0, -1));
    return {
      handled: true,
      shouldUpdateLastTouched: true,
      shouldAddHistory: true,
    };
  }

  // Prevent creating loops
  if (isLoop(currentPath, targetIdx)) {
    return { handled: false };
  }

  // Check if reached matching anchor
  if (anchorAtIdx?.colorId === activeColor) {
    updateUserPath(activeColor, [...currentPath, targetIdx]);
    setActiveColor(null);
    if (soundEnabled) {
      audioEngine.playPopSound(activeColor);
    }
    hapticFeedback.playCompletion();
    return {
      handled: true,
      shouldAddHistory: true,
      shouldIncrementMove: true,
    };
  }

  // Handle intersection with other paths
  const pathLookup = createPathLookupMap(userPaths, activeColor);
  const intersectingPath = findPathContainingCell(targetIdx, pathLookup, userPaths);
  if (intersectingPath) {
    updateUserPath(intersectingPath.colorId, intersectingPath.path.slice(0, intersectingPath.path.indexOf(targetIdx)));
    updateUserPath(activeColor, [...currentPath, targetIdx]);
    return {
      handled: true,
      shouldUpdateLastTouched: true,
      shouldAddHistory: true,
      shouldIncrementMove: true,
    };
  }

  updateUserPath(activeColor, [...currentPath, targetIdx]);
  if (soundEnabled) {
    audioEngine.playPopSound(activeColor);
  }
  hapticFeedback.playPop();
  return {
    handled: true,
    shouldUpdateLastTouched: true,
    shouldAddHistory: true,
    shouldIncrementMove: true,
  };
};
