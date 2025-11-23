import { LevelData } from '@/types';
import { getNeighbors } from '@/utils/grid-utils';

/**
 * Validates a level against Numberlink puzzle rules.
 * 
 * Numberlink Rules:
 * 1. Match Each Pair: Every pair of identical numbers must be connected by a single continuous non-branching line
 * 2. No Crossings: Paths must not intersect, overlap, or pass through other dots
 * 3. Endpoints Only: Each dot must appear only at the endpoints of its corresponding path (never in the middle)
 * 4. Uniqueness: A valid puzzle should have exactly one unique solution and ideally fill the entire grid
 * 5. Optional: Paths must not contain U-turns (can be shortened)
 * 
 * @param levelData - Level data to validate
 * @returns Object with isValid flag and optional error message
 */
export const validateNumberlinkRules = (
  levelData: LevelData
): { isValid: boolean; error?: string } => {
  const { width, height, anchors, solvedPaths } = levelData;
  const size = width * height;
  
  if (!solvedPaths || solvedPaths.length === 0) {
    return { isValid: false, error: 'No solved paths found' };
  }
  
  // Rule 1 & 3: Match Each Pair & Endpoints Only
  // Check that each color has exactly 2 anchors and they are at path endpoints
  const colorAnchors: Record<number, number[]> = {};
  Object.entries(anchors).forEach(([idx, anchor]) => {
    if (!colorAnchors[anchor.colorId]) {
      colorAnchors[anchor.colorId] = [];
    }
    colorAnchors[anchor.colorId].push(parseInt(idx));
  });
  
  for (const [colorId, anchorIndices] of Object.entries(colorAnchors)) {
    if (anchorIndices.length !== 2) {
      return { isValid: false, error: `Color ${colorId} must have exactly 2 anchors` };
    }
    
    const path = solvedPaths.find(p => p.colorId === parseInt(colorId));
    if (!path || path.path.length < 2) {
      return { isValid: false, error: `Color ${colorId} has no valid path` };
    }
    
    const pathStart = path.path[0];
    const pathEnd = path.path[path.path.length - 1];
    
    // Anchors must be at path endpoints
    if (!anchorIndices.includes(pathStart) || !anchorIndices.includes(pathEnd)) {
      return { isValid: false, error: `Color ${colorId} anchors not at path endpoints` };
    }
    
    // Anchors must be different
    if (pathStart === pathEnd) {
      return { isValid: false, error: `Color ${colorId} has same start and end anchor` };
    }
    
    // Check that anchors don't appear in the middle of the path
    for (let i = 1; i < path.path.length - 1; i++) {
      if (anchorIndices.includes(path.path[i])) {
        return { isValid: false, error: `Color ${colorId} anchor appears in middle of path` };
      }
    }
  }
  
  // Rule 2: No Crossings - paths must not overlap
  const cellToColor = new Map<number, number>();
  for (const path of solvedPaths) {
    for (const cell of path.path) {
      if (cellToColor.has(cell)) {
        return { isValid: false, error: `Paths overlap at cell ${cell}` };
      }
      cellToColor.set(cell, path.colorId);
    }
  }
  
  // Rule 4: Uniqueness - grid should be filled
  const filledCells = new Set<number>();
  solvedPaths.forEach(path => {
    path.path.forEach(cell => filledCells.add(cell));
  });
  
  if (filledCells.size !== size) {
    return { isValid: false, error: `Grid not fully filled: ${filledCells.size}/${size} cells` };
  }
  
  // Rule 1: Non-branching lines - each path cell should have at most 2 neighbors in the path
  for (const path of solvedPaths) {
    for (let i = 0; i < path.path.length; i++) {
      const cell = path.path[i];
      const neighbors = getNeighbors(cell, width, height);
      const pathNeighbors = neighbors.filter(n => path.path.includes(n));
      
      // Endpoints should have 1 neighbor, middle cells should have 2
      if (i === 0 || i === path.path.length - 1) {
        if (pathNeighbors.length !== 1) {
          return { isValid: false, error: `Path for color ${path.colorId} has branching at endpoint` };
        }
      } else {
        if (pathNeighbors.length !== 2) {
          return { isValid: false, error: `Path for color ${path.colorId} has branching at cell ${cell}` };
        }
      }
    }
  }
  
  // Rule 5 (Optional): Check for U-turns - paths should not have immediate reversals
  for (const path of solvedPaths) {
    for (let i = 1; i < path.path.length - 1; i++) {
      const prev = path.path[i - 1];
      const curr = path.path[i];
      const next = path.path[i + 1];
      
      // Check if we're going back to the previous cell (U-turn)
      if (prev === next) {
        return { isValid: false, error: `Path for color ${path.colorId} contains U-turn at cell ${curr}` };
      }
    }
  }
  
  return { isValid: true };
};

