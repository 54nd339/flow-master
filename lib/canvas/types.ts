import type { Point } from "@/lib/engine/types";

export interface LayoutInfo {
  cellSize: number;
  padding: number;
  canvasW: number;
  canvasH: number;
}

export interface DrawingState {
  active: boolean;
  flowId: string | null;
  path: Point[];
}

export interface ThemeColors {
  bg: string;
  gridLine: string;
  gridBorder: string;
  dotBg: string;
  labelColor: string;
  solutionAlpha: number;
  fillAlpha: number;
  activeLineExtra: number;
  gridLineWidth: number;
  gridBorderWidth: number;
}

export interface GridCanvasProps {
  puzzle: import("@/lib/engine/types").PuzzleData;
  colors: Map<string, string>;
  showSolution: boolean;
  className?: string;
  resetZoomCounter?: number;
  ghostFlows?: Map<string, Point[]> | null;
  watchSolveFlows?: Map<string, Point[]> | null;
}
