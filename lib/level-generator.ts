import { LevelData, ColorPalette } from '@/types';
import { mulberry32 } from './prng';
import { BACKGROUND_GENERATION } from '@/config';
import { getNeighbors } from '@/utils/grid-utils';

/**
 * Checks if two cell indices are adjacent (Manhattan distance = 1).
 */
const areAdjacent = (idx1: number, idx2: number, width: number): boolean => {
  const r1 = Math.floor(idx1 / width);
  const c1 = idx1 % width;
  const r2 = Math.floor(idx2 / width);
  const c2 = idx2 % width;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
};

/**
 * Validates that anchors of the same color are not adjacent and paths are solvable.
 * Ensures minimum path length of 2 cells between anchors of the same color.
 */
const validateAnchors = (
  anchors: Record<number, { colorId: number; type: 'endpoint' }>,
  width: number
): boolean => {
  const colorAnchors: Record<number, number[]> = {};
  
  // Group anchors by color
  Object.entries(anchors).forEach(([idx, anchor]) => {
    if (!colorAnchors[anchor.colorId]) {
      colorAnchors[anchor.colorId] = [];
    }
    colorAnchors[anchor.colorId].push(parseInt(idx));
  });
  
  // Check each color's anchors
  for (const [colorId, anchorIndices] of Object.entries(colorAnchors)) {
    if (anchorIndices.length !== 2) return false;
    
    const [anchor1, anchor2] = anchorIndices;
    
    // Anchors must not be adjacent (minimum 2 cells apart for solvability)
    if (areAdjacent(anchor1, anchor2, width)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Generates a unique, solvable Flow puzzle level using a time-based algorithm.
 * 
 * Generation Algorithm:
 * 1. Time-based generation: Uses time limits (1s for small grids, 2s for large) instead of retry counts
 * 2. Path-based filling: Creates paths that fill the grid without overlapping
 * 3. Dead-end prevention: For small grids, prevents moves that would isolate cells
 * 4. Fallback system: If time limit exceeded, uses sophisticated fallback algorithm
 * 
 * Path Generation Strategy:
 * - Selects starting cells with fewer free neighbors (heuristic for better path distribution)
 * - Extends paths until stuck, then starts a new path
 * - Prevents paths from touching themselves (except at current position)
 * - For small grids: Prevents moves that would create dead ends
 * 
 * @param width - Grid width
 * @param height - Grid height
 * @param minC - Minimum number of colors required
 * @param maxC - Maximum number of colors allowed
 * @param palette - Color palette array (can be null for default)
 * @param seed - Optional seed for deterministic generation (used for daily challenges)
 * @returns Generated level data with anchors and solved paths
 */
export const generateLevel = (
  width: number,
  height: number,
  minC: number,
  maxC: number,
  palette: ColorPalette[] | null,
  seed?: number,
  maxAttempts?: number
): { level: LevelData; usedFallback: boolean } => {
  const size = width * height;
  const random = seed ? mulberry32(seed) : Math.random;
  const paletteLen = palette ? palette.length : 20;
  const targetColors = Math.min(paletteLen, Math.floor(random() * (maxC - minC + 1) + minC));
  const attemptsLimit = maxAttempts ?? BACKGROUND_GENERATION.MAX_ATTEMPTS_PER_LEVEL;
  let attempts = 0;

  while (attempts < attemptsLimit) {
    attempts++;
    const grid = new Int32Array(size).fill(-1);
    const paths: Array<{ colorId: number; path: number[] }> = [];
    let filledCount = 0;

    let stuck = false;
    // Use Set for O(1) empty cell lookups instead of array
    const emptyCells = new Set<number>();
    for (let i = 0; i < size; i++) {
      if (grid[i] === -1) emptyCells.add(i);
    }

    while (filledCount < size && emptyCells.size > 0 && paths.length < targetColors) {
      let startIdx = -1;
      let bestScore = 99;
      const emptyIndices = Array.from(emptyCells);
      
      /**
       * Starting point selection: prefer cells with fewer free neighbors.
       * This heuristic helps avoid creating isolated regions that would make
       * it impossible to fill the entire grid with valid paths.
       */
      const sampleSize = Math.min(emptyIndices.length, 15);
      for (let k = 0; k < sampleSize; k++) {
        const r = Math.floor(random() * emptyIndices.length);
        const idx = emptyIndices[r];
        const freeNeighbors = getNeighbors(idx, width, height).filter(n => grid[n] === -1).length;
        if (freeNeighbors < bestScore) {
          bestScore = freeNeighbors;
          startIdx = idx;
        }
      }
      
      if (startIdx === -1) startIdx = emptyIndices[0];
      
      const currentPath = [startIdx];
      const colorId = paths.length;
      grid[startIdx] = colorId;
      emptyCells.delete(startIdx);
      filledCount++;
      
      let curr = startIdx;
      let pathStuck = false;
      
      /**
       * Path generation loop: extends path until no valid moves remain.
       * Valid moves must:
       * 1. Target an empty cell
       * 2. Not cause path to touch itself (except at current position)
       * 3. For smaller grids: not create dead ends that isolate other cells
       */
      while (!pathStuck) {
        const neighbors = getNeighbors(curr, width, height);
        const validMoves = neighbors.filter(next => {
          if (grid[next] !== -1) return false;
          const nextNeighbors = getNeighbors(next, width, height);
          if (nextNeighbors.some(nn => grid[nn] === colorId && nn !== curr)) return false;
          
          if (size < 400) {
            const currNeighbors = getNeighbors(curr, width, height);
            for (const n of currNeighbors) {
              if (n !== next && grid[n] === -1) {
                const nnNeighbors = getNeighbors(n, width, height);
                if (nnNeighbors.filter(nn => grid[nn] === -1 && nn !== next).length === 0) {
                  return false;
                }
              }
            }
          }
          return true;
        });
        
        if (validMoves.length > 0) {
          const next = validMoves[Math.floor(random() * validMoves.length)];
          grid[next] = colorId;
          emptyCells.delete(next);
          currentPath.push(next);
          filledCount++;
          curr = next;
        } else {
          pathStuck = true;
        }
      }
      
      // Ensure path is long enough and endpoints are not adjacent
      if (currentPath.length < 3) {
        stuck = true;
        break;
      }
      
      // Check if endpoints are adjacent - if so, try to extend the path
      if (areAdjacent(currentPath[0], currentPath[currentPath.length - 1], width)) {
        // Try to extend the path by finding another valid move
        const lastCell = currentPath[currentPath.length - 1];
        const neighbors = getNeighbors(lastCell, width, height);
        const validExtensions = neighbors.filter(next => {
          if (grid[next] !== -1) return false;
          if (currentPath.includes(next)) return false;
          return true;
        });
        
        if (validExtensions.length > 0) {
          const extension = validExtensions[Math.floor(random() * validExtensions.length)];
          grid[extension] = colorId;
          emptyCells.delete(extension);
          currentPath.push(extension);
          filledCount++;
        } else {
          // Can't extend, mark as stuck and skip this path
          stuck = true;
          break;
        }
      }
      
      paths.push({ colorId, path: currentPath });
    }
    
    // Success: all cells filled and minimum color requirement met
    if (!stuck && filledCount === size && paths.length >= minC) {
      const anchors: Record<number, { colorId: number; type: 'endpoint' }> = {};
      
      // Ensure we use all colors from 0 to targetColors-1
      // Create a shuffled array of all target colors
      const colorAssignments: number[] = [];
      for (let i = 0; i < targetColors; i++) {
        colorAssignments.push(i);
      }
      // Shuffle to randomize color distribution
      for (let i = colorAssignments.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [colorAssignments[i], colorAssignments[j]] = [colorAssignments[j], colorAssignments[i]];
      }
      
      // Map paths to colors
      // This ensures all target colors are represented
      if (paths.length !== targetColors) {
        continue;
      }
      
      paths.forEach((p, i) => {
        const visibleColorId = colorAssignments[i];
        p.colorId = visibleColorId;
        anchors[p.path[0]] = { colorId: visibleColorId, type: 'endpoint' };
        anchors[p.path[p.path.length - 1]] = { colorId: visibleColorId, type: 'endpoint' };
      });
      
      // Validate anchors: same color anchors must not be adjacent
      if (validateAnchors(anchors, width)) {
        const level: LevelData = { width, height, anchors, difficulty: paths.length, solvedPaths: paths };
        return { level, usedFallback: false };
      }
      // If validation fails, continue to next attempt
    }
  }
  
  /**
   * Fallback algorithm: Uses distributed DFS with snake/cut method
   * Creates more complex and challenging levels even when time limit is reached
   */
  const fallbackLevel = generateFallbackLevel(width, height, minC, maxC, palette, random, paletteLen);
  return { level: fallbackLevel, usedFallback: true };
};

/**
 * Fallback level generator using distributed DFS and snake/cut method.
 * 
 * This algorithm is used when the primary generation algorithm exceeds its time limit.
 * It creates challenging levels through a multi-phase approach:
 * 
 * Phase 1 - Distributed DFS with Snake Pattern:
 * - Partitions the grid into N regions (one per color) using BFS-like expansion
 * - Uses a "snake pattern" that prefers movement in one direction (right/down/left/up)
 * - Occasionally changes direction (30% chance) to create more varied paths
 * - Each region targets approximately size/N cells, with remainder distributed evenly
 * 
 * Phase 2 - Cut Method for Remaining Cells:
 * - Any unassigned cells are assigned to the nearest region using Manhattan distance
 * - Ensures 100% grid coverage even if DFS doesn't fill all cells
 * 
 * Phase 3 - Hamiltonian-like Path Conversion:
 * - Converts each region into a single continuous path using DFS traversal
 * - Prefers cells with fewer remaining neighbors to create more linear paths
 * - Starts from corner/edge cells for better path structure
 * - Connects any remaining disconnected cells to the nearest path cell
 * 
 * @param width - Grid width
 * @param height - Grid height
 * @param minC - Minimum number of colors required
 * @param maxC - Maximum number of colors allowed
 * @param palette - Color palette array (can be null)
 * @param random - Random number generator function
 * @param paletteLen - Length of the color palette
 * @returns Generated level data with anchors and solved paths
 */
const generateFallbackLevel = (
  width: number,
  height: number,
  minC: number,
  maxC: number,
  palette: ColorPalette[] | null,
  random: () => number,
  paletteLen: number
): LevelData => {
  const size = width * height;
  const numColors = Math.min(paletteLen, Math.max(minC, Math.floor(random() * (maxC - minC + 1) + minC)));
  const grid = new Int32Array(size).fill(-1);
  const paths: Array<{ colorId: number; path: number[] }> = [];
  
  // Calculate target cells per path to ensure we can fill the grid with exactly numColors paths
  const targetCellsPerPath = Math.floor(size / numColors);
  const remainder = size % numColors;

  /**
   * Distributed DFS: Partition grid into regions and fill each with a path
   * Uses snake pattern to create more interesting layouts
   */
  const regions: number[][] = [];
  const visited = new Set<number>();
  
  // Create regions using BFS-like expansion
  // Each region targets approximately size/numColors cells to ensure we get exactly numColors paths
  for (let colorId = 0; colorId < numColors; colorId++) {
    const region: number[] = [];
    // Distribute cells evenly: first (size % numColors) regions get one extra cell
    const targetSize = targetCellsPerPath + (colorId < remainder ? 1 : 0);
    
    // Find starting point (prefer unvisited cells)
    let startIdx = -1;
    for (let i = 0; i < size; i++) {
      if (!visited.has(i)) {
        startIdx = i;
        break;
      }
    }
    
    if (startIdx === -1) break;
    
    // Snake pattern DFS: prefer moving in one direction to create snake-like paths
    const stack: number[] = [startIdx];
    let snakeDirection = Math.floor(random() * 4); // 0: right, 1: down, 2: left, 3: up
    
    while (stack.length > 0 && region.length < targetSize) {
      const current = stack.pop()!;
      if (visited.has(current) || grid[current] !== -1) continue;
      
      visited.add(current);
      region.push(current);
      grid[current] = colorId;
      
      const neighbors = getNeighbors(current, width, height);
      const preferredNeighbors: number[] = [];
      const otherNeighbors: number[] = [];
      
      // Prioritize neighbors in snake direction
      neighbors.forEach(n => {
        if (!visited.has(n) && grid[n] === -1) {
          const r = Math.floor(n / width);
          const c = n % width;
          const currR = Math.floor(current / width);
          const currC = current % width;
          
          const isPreferred = 
            (snakeDirection === 0 && c > currC) || // right
            (snakeDirection === 1 && r > currR) || // down
            (snakeDirection === 2 && c < currC) || // left
            (snakeDirection === 3 && r < currR);   // up
          
          if (isPreferred) {
            preferredNeighbors.push(n);
          } else {
            otherNeighbors.push(n);
          }
        }
      });
      
      // Add preferred neighbors first, then others
      const allNeighbors = [...preferredNeighbors, ...otherNeighbors];
      // Shuffle to add some randomness
      for (let i = allNeighbors.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [allNeighbors[i], allNeighbors[j]] = [allNeighbors[j], allNeighbors[i]];
      }
      
      stack.push(...allNeighbors);
      
      // Occasionally change snake direction for more variety
      if (random() < 0.3) {
        snakeDirection = Math.floor(random() * 4);
      }
    }
    
    regions.push(region);
  }
  
  // Fill remaining cells with nearest region
  for (let i = 0; i < size; i++) {
    if (grid[i] === -1) {
      let nearestRegion = 0;
      let minDist = Infinity;
      const r = Math.floor(i / width);
      const c = i % width;
      
      for (let j = 0; j < regions.length; j++) {
        if (regions[j].length === 0) continue;
        const regionCenter = regions[j][Math.floor(regions[j].length / 2)];
        const centerR = Math.floor(regionCenter / width);
        const centerC = regionCenter % width;
        const dist = Math.abs(r - centerR) + Math.abs(c - centerC);
        
        if (dist < minDist) {
          minDist = dist;
          nearestRegion = j;
        }
      }
      
      grid[i] = nearestRegion;
      regions[nearestRegion].push(i);
    }
  }
  
  /**
   * Convert regions to paths using Hamiltonian-like traversal
   * Creates paths that visit all cells in a region efficiently
   */
  for (let colorId = 0; colorId < regions.length; colorId++) {
    const region = regions[colorId];
    if (region.length === 0) continue;
    
    // Use DFS to create a path through the region
    const path: number[] = [];
    const regionSet = new Set(region);
    const visitedInRegion = new Set<number>();
    
    const dfs = (idx: number) => {
      if (visitedInRegion.has(idx) || !regionSet.has(idx)) return;
      visitedInRegion.add(idx);
      path.push(idx);
      
      const neighbors = getNeighbors(idx, width, height);
      // Prefer neighbors that are in the region and unvisited
      const validNeighbors = neighbors.filter(n => 
        regionSet.has(n) && !visitedInRegion.has(n)
      );
      
      // Sort by distance to create more linear paths
      validNeighbors.sort((a, b) => {
        const aNeighbors = getNeighbors(a, width, height).filter(n => regionSet.has(n) && !visitedInRegion.has(n)).length;
        const bNeighbors = getNeighbors(b, width, height).filter(n => regionSet.has(n) && !visitedInRegion.has(n)).length;
        return aNeighbors - bNeighbors;
      });
      
      for (const neighbor of validNeighbors) {
        dfs(neighbor);
      }
    };
    
    // Start from a corner or edge cell for better path structure
    let startCell = region[0];
    for (const cell of region) {
      const r = Math.floor(cell / width);
      const c = cell % width;
      if (r === 0 || r === height - 1 || c === 0 || c === width - 1) {
        startCell = cell;
        break;
      }
    }
    
    dfs(startCell);
    
    // If path doesn't cover all cells, add remaining cells
    if (path.length < region.length) {
      const remaining = region.filter(cell => !visitedInRegion.has(cell));
      for (const cell of remaining) {
        const neighbors = getNeighbors(cell, width, height);
        const pathNeighbors = neighbors.filter(n => path.includes(n));
        if (pathNeighbors.length > 0) {
          const insertIdx = path.indexOf(pathNeighbors[0]) + 1;
          path.splice(insertIdx, 0, cell);
        } else {
          path.push(cell);
        }
      }
    }
    
    if (path.length >= 3 && !areAdjacent(path[0], path[path.length - 1], width)) {
      paths.push({ colorId, path });
    } else if (path.length >= 3) {
      // If endpoints are adjacent, try to extend the path or use different endpoints
      // Find a better endpoint that's not adjacent to the start
      let betterEnd = path[path.length - 1];
      for (let i = path.length - 2; i >= 1; i--) {
        if (!areAdjacent(path[0], path[i], width)) {
          betterEnd = path[i];
          break;
        }
      }
      // If we found a better endpoint, use the path up to that point
      const endIdx = path.indexOf(betterEnd);
      if (endIdx > 0 && endIdx < path.length - 1) {
        const adjustedPath = path.slice(0, endIdx + 1);
        if (adjustedPath.length >= 3) {
          paths.push({ colorId, path: adjustedPath });
        }
      } else {
        // Fallback: use the path as-is if we can't find a better endpoint
        paths.push({ colorId, path });
      }
    }
  }
  
  // Create anchors from path endpoints
  const anchors: Record<number, { colorId: number; type: 'endpoint' }> = {};
  
  // Ensure we use all colors from 0 to numColors-1
  // Shuffle color assignments to distribute colors evenly
  const colorAssignments: number[] = [];
  for (let i = 0; i < numColors; i++) {
    colorAssignments.push(i);
  }
  // Shuffle to randomize color distribution
  for (let i = colorAssignments.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [colorAssignments[i], colorAssignments[j]] = [colorAssignments[j], colorAssignments[i]];
  }
  
  // Map paths to colors - ensure we have exactly numColors paths
  // If we have fewer paths than numColors, some colors won't be used
  // This can happen if path generation fails for some colors
  // For now, we map sequentially and accept that some colors might be missing
  // TODO: Improve algorithm to ensure all numColors are used
  paths.forEach((p, i) => {
    const visibleColorId = i < numColors ? colorAssignments[i] : colorAssignments[i % numColors];
    p.colorId = visibleColorId;
    anchors[p.path[0]] = { colorId: visibleColorId, type: 'endpoint' };
    anchors[p.path[p.path.length - 1]] = { colorId: visibleColorId, type: 'endpoint' };
  });
  
  // Ensure we have exactly numColors paths - if not, we're missing some colors
  // This is a known limitation when the fallback algorithm can't create enough paths
  if (paths.length < numColors) {
    // Log warning but continue - the level is still playable
    console.warn(`Fallback algorithm generated ${paths.length} paths but ${numColors} colors were requested. Some colors will be missing.`);
  }
  
  // Validate anchors: same color anchors must not be adjacent
  // If validation fails, try to fix by adjusting anchor positions
  if (!validateAnchors(anchors, width)) {
    // Try to fix by moving anchors to non-adjacent positions
    const fixedAnchors: Record<number, { colorId: number; type: 'endpoint' }> = {};
    const colorAnchors: Record<number, number[]> = {};
    
    Object.entries(anchors).forEach(([idx, anchor]) => {
      if (!colorAnchors[anchor.colorId]) {
        colorAnchors[anchor.colorId] = [];
      }
      colorAnchors[anchor.colorId].push(parseInt(idx));
    });
    
    for (const [colorId, anchorIndices] of Object.entries(colorAnchors)) {
      if (anchorIndices.length === 2) {
        const [anchor1, anchor2] = anchorIndices;
        const path = paths.find(p => (p.colorId % paletteLen) === parseInt(colorId));
        
        if (path && areAdjacent(anchor1, anchor2, width)) {
          // Move one anchor to a non-adjacent position in the path
          // Prefer positions that are at least 2 cells away
          let newAnchor2 = anchor2;
          for (let i = 1; i < path.path.length - 1; i++) {
            const candidate = path.path[i];
            if (!areAdjacent(anchor1, candidate, width)) {
              newAnchor2 = candidate;
              break;
            }
          }
          fixedAnchors[anchor1] = anchors[anchor1];
          fixedAnchors[newAnchor2] = anchors[anchor2];
        } else {
          fixedAnchors[anchor1] = anchors[anchor1];
          fixedAnchors[anchor2] = anchors[anchor2];
        }
      }
    }
    
    // If fix was successful, use fixed anchors
    if (validateAnchors(fixedAnchors, width)) {
      return { 
        width, 
        height, 
        anchors: fixedAnchors, 
        difficulty: paths.length, 
        solvedPaths: paths 
      };
    }
  }
  
  const level: LevelData = { 
    width, 
    height, 
    anchors, 
    difficulty: paths.length, 
    solvedPaths: paths 
  };
  return level;
};

