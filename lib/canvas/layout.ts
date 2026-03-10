import { MIN_TOUCH_TARGET } from "@/lib/canvas/constants";
import type { LayoutInfo } from "@/lib/canvas/types";
import type { Endpoint, Point } from "@/lib/engine/types";

export function computeLayout(
  containerW: number,
  containerH: number,
  gridW: number,
  gridH: number,
): LayoutInfo {
  const padding = 16;
  const maxSize = Math.min(containerW, containerH, 800);
  const available = maxSize - padding * 2;
  let cellSize = Math.floor(available / Math.max(gridW, gridH));

  const isTouchDevice =
    typeof window !== "undefined" && "ontouchstart" in window;
  if (isTouchDevice && cellSize < MIN_TOUCH_TARGET) {
    cellSize = MIN_TOUCH_TARGET;
  }

  return {
    cellSize,
    padding,
    canvasW: cellSize * gridW + padding * 2,
    canvasH: cellSize * gridH + padding * 2,
  };
}

export function pointerToCell(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  layout: LayoutInfo,
  gridW: number,
  gridH: number,
): Point | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = layout.canvasW / rect.width;
  const scaleY = layout.canvasH / rect.height;
  const x = (clientX - rect.left) * scaleX - layout.padding;
  const y = (clientY - rect.top) * scaleY - layout.padding;
  const cellX = Math.floor(x / layout.cellSize);
  const cellY = Math.floor(y / layout.cellSize);
  if (cellX < 0 || cellX >= gridW || cellY < 0 || cellY >= gridH) return null;
  return { x: cellX, y: cellY };
}

export function cellCenter(
  pt: Point,
  cellSize: number,
  padding: number,
): { cx: number; cy: number } {
  return {
    cx: padding + pt.x * cellSize + cellSize / 2,
    cy: padding + pt.y * cellSize + cellSize / 2,
  };
}

export function isAdjacent(a: Point, b: Point): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export function findEndpointAt(
  cell: Point,
  endpoints: Endpoint[],
): Endpoint | undefined {
  return endpoints.find((ep) => ep.x === cell.x && ep.y === cell.y);
}

export function findFlowAt(
  cell: Point,
  flows: Map<string, Point[]>,
): string | null {
  for (const [flowId, path] of flows) {
    if (path.some((pt) => pt.x === cell.x && pt.y === cell.y)) return flowId;
  }
  return null;
}
