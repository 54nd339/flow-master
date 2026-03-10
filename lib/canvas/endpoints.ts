import { CB_SYMBOLS } from "@/lib/canvas/constants";
import { cellCenter } from "@/lib/canvas/layout";
import type { ThemeColors } from "@/lib/canvas/types";
import type { Endpoint, Point } from "@/lib/engine/types";

export function drawColorblindSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  symbolIndex: number,
  color: string,
): void {
  const sym = CB_SYMBOLS[symbolIndex % CB_SYMBOLS.length];
  const r = radius * 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.25);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  switch (sym) {
    case "circle":
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case "square":
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case "triangle":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.7);
      ctx.lineTo(cx - r, cy + r * 0.7);
      ctx.closePath();
      break;
    case "diamond":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      break;
    case "star": {
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      break;
    }
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      break;
    case "cross":
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
      break;
    case "heart":
      ctx.moveTo(cx, cy + r * 0.7);
      ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.2, cx - r * 0.5, cy - r, cx, cy - r * 0.4);
      ctx.bezierCurveTo(cx + r * 0.5, cy - r, cx + r * 1.2, cy - r * 0.2, cx, cy + r * 0.7);
      break;
    case "pentagon":
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      break;
    case "plus":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      break;
  }
  ctx.stroke();
}

export function drawEndpoints(
  ctx: CanvasRenderingContext2D,
  endpoints: Endpoint[],
  colors: Map<string, string>,
  cellSize: number,
  padding: number,
  themeColors: ThemeColors,
  connectedFlows: Set<string>,
  time: number,
  colorblindMode: boolean,
  reducedMotion: boolean,
  highContrast: boolean,
  hoveredCell: Point | null,
): void {
  const dotRadius = Math.max(cellSize * (highContrast ? 0.38 : 0.32), 4);
  const fontSize = Math.max(Math.floor(cellSize * (highContrast ? 0.45 : 0.4)), 8);

  const flowIds = [...new Set(endpoints.map((ep) => ep.flowId))];
  const flowSymbolMap = new Map<string, number>();
  flowIds.forEach((id, i) => flowSymbolMap.set(id, i));

  const hoveredEndpoint = hoveredCell ? endpoints.find(ep => ep.x === hoveredCell.x && ep.y === hoveredCell.y) : null;
  const highlightFlowId = hoveredEndpoint?.flowId ?? null;

  for (const ep of endpoints) {
    const { cx, cy } = cellCenter(ep, cellSize, padding);
    const color = colors.get(ep.flowId) ?? "#888";
    const isConnected = connectedFlows.has(ep.flowId);
    const isHovered = hoveredCell?.x === ep.x && hoveredCell?.y === ep.y;
    const isPartnerHovered = highlightFlowId === ep.flowId;

    const pulse = 0;
    const r = dotRadius + pulse;

    if (isPartnerHovered && !isConnected) {
      const highlightAlpha = 0.2 + Math.sin(time * 4) * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = highlightAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (highContrast) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = themeColors.gridBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (isHovered && !isConnected) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = themeColors.labelColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (colorblindMode) {
      const symIdx = flowSymbolMap.get(ep.flowId) ?? 0;
      drawColorblindSymbol(ctx, cx, cy, r, symIdx, themeColors.dotBg);
    }

    ctx.font = `${highContrast ? "900" : "bold"} ${fontSize}px var(--font-geist-sans), system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = themeColors.dotBg;
    ctx.fillText(ep.label, cx, cy + 1);
  }
}
