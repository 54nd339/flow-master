"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { getHintFlow } from "@/lib/engine/game-logic";
import { createPRNG } from "@/lib/engine/prng";
import { useCanAfford, useSpendHint } from "@/stores/currency-store";
import { getGameState, useCurrentFlows, useIsComplete } from "@/stores/game-store";
import { usePuzzle } from "@/stores/puzzle-store";

export function useHint() {
  const puzzle = usePuzzle();
  const isComplete = useIsComplete();
  const currentFlows = useCurrentFlows();
  const canAfford = useCanAfford();
  const spendHint = useSpendHint();

  return useCallback(() => {
    if (!puzzle) { toast.error("No puzzle loaded"); return; }
    if (isComplete) return;
    if (!canAfford(25)) { toast.error("Not enough flows! Need 25 for a hint."); return; }

    const solvedFlowIds = new Set<string>();
    for (const [flowId, path] of currentFlows) {
      const eps = puzzle.endpoints.filter((ep) => ep.flowId === flowId);
      if (eps.length === 2 && path.length >= 2) {
        const first = path[0];
        const last = path[path.length - 1];
        const matchA = (first.x === eps[0].x && first.y === eps[0].y && last.x === eps[1].x && last.y === eps[1].y);
        const matchB = (first.x === eps[1].x && first.y === eps[1].y && last.x === eps[0].x && last.y === eps[0].y);
        if (matchA || matchB) solvedFlowIds.add(flowId);
      }
    }

    const hint = getHintFlow(puzzle, solvedFlowIds, createPRNG());
    if (!hint) { toast.info("All flows already solved!"); return; }
    if (spendHint()) {
      getGameState().pushAction({ type: "draw", flowId: hint.flowId, path: hint.path }, puzzle);
      toast.success("Hint applied! One flow revealed.", { duration: 3000 });
    }
  }, [puzzle, isComplete, canAfford, currentFlows, spendHint]);
}
