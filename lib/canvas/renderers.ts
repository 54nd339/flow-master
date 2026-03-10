import { cellCenter } from "@/lib/canvas/layout";
import type { ThemeColors } from "@/lib/canvas/types";
import type { Point, SolutionPath } from "@/lib/engine/types";

export { drawColorblindSymbol, drawEndpoints } from "@/lib/canvas/endpoints";

export function getReducedMotion(settingOverride: boolean): boolean {
  if (settingOverride) return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getThemeColors(
  isDark: boolean,
  highContrast: boolean,
  gameTheme?: { colors: { bg: string; grid: string; gridBorder: string; endpoint: string; endpointStroke: string; text: string } },
): ThemeColors {
  if (highContrast) {
    return {
      bg: isDark ? "#000000" : "#ffffff",
      gridLine: isDark ? "#888888" : "#444444",
      gridBorder: isDark ? "#ffffff" : "#000000",
      dotBg: isDark ? "#000000" : "#ffffff",
      labelColor: isDark ? "#ffffff" : "#000000",
      solutionAlpha: 0.5,
      fillAlpha: 0.2,
      activeLineExtra: 4,
      gridLineWidth: 2,
      gridBorderWidth: 3,
    };
  }

  if (gameTheme) {
    return {
      bg: gameTheme.colors.bg,
      gridLine: gameTheme.colors.grid,
      gridBorder: gameTheme.colors.gridBorder,
      dotBg: gameTheme.colors.endpoint,
      labelColor: gameTheme.colors.text,
      solutionAlpha: 0.35,
      fillAlpha: 0.12,
      activeLineExtra: 2,
      gridLineWidth: 1,
      gridBorderWidth: 2,
    };
  }

  return {
    bg: isDark ? "#18181b" : "#fafafa",
    gridLine: isDark ? "#3f3f46" : "#d4d4d8",
    gridBorder: isDark ? "#a1a1aa" : "#3f3f46",
    dotBg: isDark ? "#27272a" : "#ffffff",
    labelColor: isDark ? "#fafafa" : "#09090b",
    solutionAlpha: 0.35,
    fillAlpha: 0.12,
    activeLineExtra: 2,
    gridLineWidth: 1,
    gridBorderWidth: 2,
  };
}

export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  padding: number,
  themeColors: ThemeColors,
): void {
  ctx.strokeStyle = themeColors.gridLine;
  ctx.lineWidth = themeColors.gridLineWidth;
  ctx.setLineDash(themeColors.gridLineWidth > 1 ? [] : [4, 4]);

  for (let y = 1; y < height; y++) {
    ctx.beginPath();
    ctx.moveTo(padding, padding + y * cellSize);
    ctx.lineTo(padding + width * cellSize, padding + y * cellSize);
    ctx.stroke();
  }
  for (let x = 1; x < width; x++) {
    ctx.beginPath();
    ctx.moveTo(padding + x * cellSize, padding);
    ctx.lineTo(padding + x * cellSize, padding + height * cellSize);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.strokeStyle = themeColors.gridBorder;
  ctx.lineWidth = themeColors.gridBorderWidth;
  ctx.strokeRect(padding, padding, width * cellSize, height * cellSize);
}

export function drawCellFills(
  ctx: CanvasRenderingContext2D,
  flows: Map<string, Point[]>,
  colors: Map<string, string>,
  cellSize: number,
  padding: number,
  alpha: number,
): void {
  ctx.globalAlpha = alpha;
  for (const [flowId, path] of flows) {
    const color = colors.get(flowId) ?? "#888";
    ctx.fillStyle = color;
    for (const pt of path) {
      ctx.fillRect(
        padding + pt.x * cellSize + 1,
        padding + pt.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2,
      );
    }
  }
  ctx.globalAlpha = 1;
}

export function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  cellSize: number,
  padding: number,
  lineWidth: number,
  alpha: number,
): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const centers = points.map((pt) => cellCenter(pt, cellSize, padding));
  ctx.moveTo(centers[0].cx, centers[0].cy);

  if (centers.length === 2) {
    ctx.lineTo(centers[1].cx, centers[1].cy);
  } else {
    for (let i = 0; i < centers.length - 1; i++) {
      const p0 = centers[Math.max(i - 1, 0)];
      const p1 = centers[i];
      const p2 = centers[i + 1];
      const p3 = centers[Math.min(i + 2, centers.length - 1)];

      const cp1x = p1.cx + (p2.cx - p0.cx) / 6;
      const cp1y = p1.cy + (p2.cy - p0.cy) / 6;
      const cp2x = p2.cx - (p3.cx - p1.cx) / 6;
      const cp2y = p2.cy - (p3.cy - p1.cy) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.cx, p2.cy);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawBlockedCells(
  ctx: CanvasRenderingContext2D,
  blockedCells: Point[],
  cellSize: number,
  padding: number,
  isDark: boolean,
): void {
  for (const pt of blockedCells) {
    const x = padding + pt.x * cellSize;
    const y = padding + pt.y * cellSize;
    ctx.fillStyle = isDark ? "#2a2a2e" : "#d4d4d8";
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

    ctx.strokeStyle = isDark ? "#555" : "#999";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const inset = cellSize * 0.25;
    ctx.beginPath();
    ctx.moveTo(x + inset, y + inset);
    ctx.lineTo(x + cellSize - inset, y + cellSize - inset);
    ctx.moveTo(x + cellSize - inset, y + inset);
    ctx.lineTo(x + inset, y + cellSize - inset);
    ctx.stroke();
  }
}

export function drawGhostFlows(
  ctx: CanvasRenderingContext2D,
  ghostFlows: Map<string, Point[]>,
  colors: Map<string, string>,
  cellSize: number,
  padding: number,
): void {
  const lineWidth = Math.max(cellSize * 0.25, 2);
  ctx.setLineDash([6, 4]);
  for (const [flowId, path] of ghostFlows) {
    const color = colors.get(flowId) ?? "#888";
    drawSmoothPath(ctx, path, color, cellSize, padding, lineWidth, 0.25);
  }
  ctx.setLineDash([]);
}

export function drawSolution(
  ctx: CanvasRenderingContext2D,
  solution: SolutionPath[],
  colors: Map<string, string>,
  cellSize: number,
  padding: number,
  alpha: number,
): void {
  const lineWidth = Math.max(cellSize * 0.35, 3);
  for (const path of solution) {
    const color = colors.get(path.flowId) ?? "#888";
    drawSmoothPath(ctx, path.points, color, cellSize, padding, lineWidth, alpha);
  }
}

export function drawAlmostThereGlow(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  time: number,
): void {
  const intensity = 0.15 + Math.sin(time * 2) * 0.08;
  const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
  gradient.addColorStop(0, `rgba(59, 130, 246, ${intensity})`);
  gradient.addColorStop(0.5, `rgba(147, 51, 234, ${intensity * 0.7})`);
  gradient.addColorStop(1, `rgba(59, 130, 246, ${intensity})`);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 6;
  ctx.strokeRect(2, 2, canvasW - 4, canvasH - 4);
  ctx.restore();
}

export function drawCompleteWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  padding: number,
  progress: number,
  reducedMotion: boolean,
): void {
  if (reducedMotion || (width >= 40 && height >= 40)) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const normalizedDist = dist / maxDist;
      const waveFront = progress * 1.5;
      const cellProgress = Math.max(
        0,
        Math.min(1, (waveFront - normalizedDist) * 4),
      );
      if (cellProgress <= 0 || cellProgress >= 1) continue;

      const scale = 1 + Math.sin(cellProgress * Math.PI) * 0.08;
      const alpha = Math.sin(cellProgress * Math.PI) * 0.25;

      ctx.save();
      const cx = padding + x * cellSize + cellSize / 2;
      const cy = padding + y * cellSize + cellSize / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(
        padding + x * cellSize,
        padding + y * cellSize,
        cellSize,
        cellSize,
      );
      ctx.restore();
    }
  }
}
