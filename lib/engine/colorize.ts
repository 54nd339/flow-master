import { Grid } from "./grid";
import type { Endpoint, SolutionPath } from "./types";

const LABELS = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FLOW_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  "#84cc16", "#f43f5e", "#0ea5e9", "#d946ef", "#10b981",
  "#fbbf24", "#8b5cf6", "#fb923c", "#2dd4bf", "#818cf8",
  "#a3e635", "#e11d48", "#38bdf8", "#c026d3", "#059669",
  "#facc15", "#7c3aed", "#f59e0b", "#0d9488", "#4f46e5",
];

export interface ColorizeResult {
  endpoints: Endpoint[];
  colors: Map<string, string>;
}

export function colorTubes(grid: Grid): ColorizeResult {
  const [tubeGrid, uf] = grid.makeTubes();

  const flowIdMap = new Map<number, string>();
  const colorMap = new Map<string, string>();
  let labelIdx = 0;

  const endpoints: Endpoint[] = [];

  for (let y = 0; y < tubeGrid.h; y++) {
    for (let x = 0; x < tubeGrid.w; x++) {
      if (tubeGrid.get(x, y) === "x") {
        const root = uf.find(y * tubeGrid.w + x);
        if (!flowIdMap.has(root)) {
          const label = LABELS[labelIdx % LABELS.length];
          flowIdMap.set(root, label);
          colorMap.set(label, FLOW_COLORS[labelIdx % FLOW_COLORS.length]);
          labelIdx++;
        }
        const label = flowIdMap.get(root)!;
        endpoints.push({ x, y, label, flowId: label });
      }
    }
  }

  return { endpoints, colors: colorMap };
}

export function solutionLines(grid: Grid): SolutionPath[] {
  const [tg, uf] = grid.makeTubes();
  const done = new Map<number, SolutionPath>();

  const flowIdMap = new Map<number, string>();
  let labelIdx = 0;

  for (let y = 0; y < tg.h; y++) {
    for (let x = 0; x < tg.w; x++) {
      if (tg.get(x, y) !== "x") continue;
      const root = uf.find(y * tg.w + x);
      if (done.has(root)) continue;

      if (!flowIdMap.has(root)) {
        flowIdMap.set(root, LABELS[labelIdx % LABELS.length]);
        labelIdx++;
      }
      const flowId = flowIdMap.get(root)!;

      const line: [number, number][] = [[x, y]];
      while (true) {
        const [lx, ly] = line[line.length - 1];
        if (line.length >= 2 && tg.get(lx, ly) === "x") {
          break;
        }
        let found = false;
        for (const [ddx, ddy] of [[-1, 0], [1, 0], [0, 1], [0, -1]] as const) {
          const nx = lx + ddx;
          const ny = ly + ddy;
          if (
            nx >= 0 && nx < tg.w && ny >= 0 && ny < tg.h &&
            uf.find(ny * tg.w + nx) === root &&
            (line.length === 1 || nx !== line[line.length - 2][0] || ny !== line[line.length - 2][1])
          ) {
            line.push([nx, ny]);
            found = true;
            break;
          }
        }
        if (!found) break;
      }

      done.set(root, {
        flowId,
        points: line.map(([px, py]) => ({ x: px, y: py })),
      });
    }
  }

  return Array.from(done.values());
}
