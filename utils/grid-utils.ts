/**
 * Grid utilities for cell calculations and size configuration.
 * Combines grid cell operations and grid size configuration.
 */

/**
 * Grid size configuration interface
 */
export interface GridSizeConfig {
  maxCellsPerColor: number;
  minCellsPerColor: number;
}

/**
 * Determines if a grid matches specific dimensions (order-independent).
 */
const matchesSize = (width: number, height: number, ...sizes: Array<[number, number]>): boolean => {
  return sizes.some(([w, h]) => (width === w && height === h) || (width === h && height === w));
};

/**
 * Gets grid size configuration based on dimensions.
 * 
 * @param width - Grid width
 * @param height - Grid height
 * @returns Configuration object with cell/color ratios
 */
export const getGridSizeConfig = (width: number, height: number): GridSizeConfig => {
  const maxDim = Math.max(width, height);

  if (maxDim <= 9) {
    return { maxCellsPerColor: 10, minCellsPerColor: 6 };
  }

  if (
    matchesSize(width, height, [8, 11], [10, 10], [9, 12], [11, 11], [10, 13])
  ) {
    return { maxCellsPerColor: 9, minCellsPerColor: 6 };
  }

  if (
    matchesSize(width, height, [12, 12], [11, 14], [13, 13], [12, 15], [14, 14])
  ) {
    return { maxCellsPerColor: 8, minCellsPerColor: 6 };
  }

  if (
    matchesSize(width, height, [13, 16], [15, 15], [14, 17], [15, 18], [16, 19])
  ) {
    return { maxCellsPerColor: 7, minCellsPerColor: 6 };
  }

  return { maxCellsPerColor: 6, minCellsPerColor: 6 };
};

/**
 * Calculates the cell index from screen coordinates
 * @param x - Client X coordinate
 * @param y - Client Y coordinate
 * @param w - Grid width
 * @param h - Grid height
 * @param gridRect - Bounding rectangle of the grid element
 * @returns Cell index or -1 if out of bounds
 */
export const getCellIndex = (
  x: number,
  y: number,
  w: number,
  h: number,
  gridRect: DOMRect
): number => {
  const cellW = gridRect.width / w;
  const cellH = gridRect.height / h;
  const col = Math.floor((x - gridRect.left) / cellW);
  const row = Math.floor((y - gridRect.top) / cellH);
  if (col < 0 || col >= w || row < 0 || row >= h) return -1;
  return row * w + col;
};

/**
 * Gets row and column from cell index
 * @param cellIndex - Cell index
 * @param width - Grid width
 * @returns Object with row and col properties
 */
export const getCellPosition = (cellIndex: number, width: number): { row: number; col: number } => {
  return {
    row: Math.floor(cellIndex / width),
    col: cellIndex % width,
  };
};

/**
 * Validates if a move is adjacent (Manhattan distance = 1)
 */
export const isAdjacentMove = (fromIdx: number, toIdx: number, width: number): boolean => {
  const fromRow = Math.floor(fromIdx / width);
  const fromCol = fromIdx % width;
  const toRow = Math.floor(toIdx / width);
  const toCol = toIdx % width;
  return Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) === 1;
};

/**
 * Checks if a grid is considered "large" (needs scrollable view without labels)
 */
export const isLargeGrid = (width: number, height: number): boolean => {
  return width >= 20 || height >= 20;
};

/**
 * Gets neighboring cell indices for a given cell index in a grid.
 * Returns up to 4 neighbors (top, bottom, left, right).
 */
export const getNeighbors = (idx: number, width: number, height: number): number[] => {
  const n: number[] = [];
  const r = Math.floor(idx / width);
  const c = idx % width;
  if (r > 0) n.push(idx - width);
  if (r < height - 1) n.push(idx + width);
  if (c > 0) n.push(idx - 1);
  if (c < width - 1) n.push(idx + 1);
  return n;
};
