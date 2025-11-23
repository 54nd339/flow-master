import { getGridSizeConfig } from './grid-utils';

/**
 * Calculates dynamic color counts for level generation based on grid size.
 * 
 * Uses different cell/color ratios based on grid size for optimal gameplay:
 * - 9×9 & below: 6-10 cells/color
 * - 8×11, 10×10, 9×12, 11×11, 10×13: 6-9 cells/color
 * - 12×12, 11×14, 13×13, 12×15, 14×14: 6-8 cells/color
 * - 13×16, 15×15, 14×17, 15×18, 16×19: 6-7 cells/color
 * - 20×20 & above: 6 cells/color
 * 
 * @param width - Grid width
 * @param height - Grid height
 * @param maxPaletteSize - Maximum available colors in palette (default: 20)
 * @returns Object with minC, maxC color counts, and shouldShowNumbers flag
 */
export const calculateColorCounts = (
  width: number,
  height: number,
  maxPaletteSize: number = 20
): { minC: number; maxC: number; shouldShowNumbers?: boolean } => {
  const totalCells = width * height;
  const { maxCellsPerColor, minCellsPerColor } = getGridSizeConfig(width, height);
  
  // Calculate ideal color counts based on cell density
  const idealMinC = Math.ceil(totalCells / maxCellsPerColor);
  const idealMaxC = Math.ceil(totalCells / minCellsPerColor);
  
  // Ensure minimum of 4 colors for very small grids
  const calculatedMinC = Math.max(4, idealMinC);
  const calculatedMaxC = idealMaxC;
  
  // Check if ideal range exceeds palette capacity
  const exceedsPalette = calculatedMaxC > maxPaletteSize;
  
  if (exceedsPalette) {
    // When palette limit is hit, use all available colors
    const minC = Math.max(4, Math.floor(maxPaletteSize * 0.75));
    const maxC = maxPaletteSize;
    return { minC, maxC, shouldShowNumbers: true };
  }
  
  // Normal case: ensure minC <= maxC and cap at palette
  const minC = calculatedMinC;
  const maxC = Math.min(maxPaletteSize, Math.max(minC, calculatedMaxC));
  
  // Show numbers only if we're using the full palette (even if not mega grid)
  const shouldShowNumbers = maxC >= maxPaletteSize;
  
  return { minC, maxC, shouldShowNumbers };
};
