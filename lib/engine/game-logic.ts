import type { PRNG } from "@/lib/engine/prng";
import type { GameAction, Point, PuzzleData } from "@/lib/engine/types";

export function rebuildFlows(history: GameAction[]): Map<string, Point[]> {
  const flows = new Map<string, Point[]>();
  for (const action of history) {
    if (action.type === "draw") {
      flows.set(action.flowId, action.path);
    } else if (action.type === "erase") {
      flows.delete(action.flowId);
    }
  }
  return flows;
}

export function countFilledCells(flows: Map<string, Point[]>): number {
  const filled = new Set<string>();
  for (const path of flows.values()) {
    for (const pt of path) filled.add(`${pt.x},${pt.y}`);
  }
  return filled.size;
}

export function checkAllConnected(
  flows: Map<string, Point[]>,
  puzzle: PuzzleData,
): boolean {
  const endpointsByFlow = new Map<string, Point[]>();
  for (const ep of puzzle.endpoints) {
    const list = endpointsByFlow.get(ep.flowId) ?? [];
    list.push({ x: ep.x, y: ep.y });
    endpointsByFlow.set(ep.flowId, list);
  }

  for (const [flowId, endpoints] of endpointsByFlow) {
    if (endpoints.length !== 2) return false;
    const path = flows.get(flowId);
    if (!path || path.length < 2) return false;

    const first = path[0];
    const last = path[path.length - 1];
    const [epA, epB] = endpoints;

    const matchesForward =
      first.x === epA.x && first.y === epA.y && last.x === epB.x && last.y === epB.y;
    const matchesReverse =
      first.x === epB.x && first.y === epB.y && last.x === epA.x && last.y === epA.y;

    if (!matchesForward && !matchesReverse) return false;
  }

  return true;
}

export type StarRating = 1 | 2 | 3;

export function calculateStars(
  moveCount: number,
  optimalMoves: number,
): StarRating {
  if (moveCount <= Math.ceil(optimalMoves * 1.1)) return 3;
  if (moveCount <= Math.ceil(optimalMoves * 1.5)) return 2;
  return 1;
}

export function computePipePercent(filled: number, totalCells: number): number {
  return totalCells > 0 ? Math.round((filled / totalCells) * 100) : 0;
}

/**
 * Get a random unsolved flow's solution path.
 * Excludes flows that are already in solvedFlowIds.
 */
export function getHintFlow(
  puzzle: PuzzleData,
  solvedFlowIds: Set<string>,
  random: PRNG,
): { flowId: string; path: Point[] } | null {
  const unsolved = puzzle.solution.filter((s) => !solvedFlowIds.has(s.flowId));
  if (unsolved.length === 0) return null;
  const chosen = unsolved[Math.floor(random() * unsolved.length)];
  return { flowId: chosen.flowId, path: [...chosen.points] };
}

