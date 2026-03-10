"use client";

import { useMemo } from "react";

import type { Point, PuzzleData } from "@/lib/engine/types";

export function useConnectedFlows(puzzle: PuzzleData, currentFlows: Map<string, Point[]>) {
  return useMemo(() => {
    const connected = new Set<string>();
    const endpointsByFlow = new Map<string, Point[]>();

    for (const ep of puzzle.endpoints) {
      const list = endpointsByFlow.get(ep.flowId) ?? [];
      list.push({ x: ep.x, y: ep.y });
      endpointsByFlow.set(ep.flowId, list);
    }

    for (const [flowId, endpoints] of endpointsByFlow) {
      if (endpoints.length !== 2) continue;
      const path = currentFlows.get(flowId);
      if (!path || path.length < 2) continue;

      const first = path[0];
      const last = path[path.length - 1];
      const [epA, epB] = endpoints;

      const fwd =
        first.x === epA.x && first.y === epA.y &&
        last.x === epB.x && last.y === epB.y;
      const rev =
        first.x === epB.x && first.y === epB.y &&
        last.x === epA.x && last.y === epA.y;

      if (fwd || rev) connected.add(flowId);
    }

    return connected;
  }, [currentFlows, puzzle.endpoints]);
}
