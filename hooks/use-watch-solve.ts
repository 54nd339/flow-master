"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Point, PuzzleData, SolutionPath } from "@/lib/engine/types";
import { getGameState } from "@/stores/game-store";
import { getSettingsState } from "@/stores/settings-store";

interface UseWatchSolveReturn {
  watchSolveFlows: Map<string, Point[]> | null;
  watchSolveActive: boolean;
  isSolving: boolean;
  startWatchSolve: () => void;
}

export function useWatchSolve(puzzle: PuzzleData | null): UseWatchSolveReturn {
  const [watchSolveFlows, setWatchSolveFlows] = useState<Map<string, Point[]> | null>(null);
  const [watchSolveActive, setWatchSolveActive] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const innerIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  useEffect(() => {
    const outerRef = intervalRef;
    const innerRef = innerIntervalsRef;
    return () => {
      if (outerRef.current) clearInterval(outerRef.current);
      for (const id of innerRef.current) clearInterval(id);
      innerRef.current.clear();
    };
  }, []);

  const startWatchSolve = useCallback(async () => {
    if (!puzzle || watchSolveActive) return;

    const solution: SolutionPath[] | null = puzzle.solution;

    if (!solution || solution.length === 0) {
      console.warn("No pre-calculated solution available for this puzzle.");
      return;
    }

    setWatchSolveActive(true);
    getGameState().initPuzzle(puzzle);

    const prefersReduced =
      getSettingsState().reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      for (const sol of solution) {
        getGameState().pushAction(
          { type: "draw", flowId: sol.flowId, path: [...sol.points] },
          puzzle,
        );
      }
      setWatchSolveFlows(null);
      setWatchSolveActive(false);
      return;
    }

    const flows = new Map<string, Point[]>();
    setWatchSolveFlows(flows);

    let idx = 0;
    const speed = 800;
    const interval = setInterval(() => {
      if (!solution || idx >= solution.length) {
        clearInterval(interval);
        intervalRef.current = null;
        setWatchSolveActive(false);
        return;
      }
      const sol = solution[idx];
      const animatedPath: Point[] = [];
      const newFlows = new Map(flows);
      let ptIdx = 0;
      const ptInterval = setInterval(() => {
        if (ptIdx >= sol.points.length) {
          clearInterval(ptInterval);
          innerIntervalsRef.current.delete(ptInterval);
          getGameState().pushAction(
            { type: "draw", flowId: sol.flowId, path: [...sol.points] },
            puzzle,
          );
          idx++;
          return;
        }
        animatedPath.push(sol.points[ptIdx]);
        newFlows.set(sol.flowId, [...animatedPath]);
        setWatchSolveFlows(new Map(newFlows));
        ptIdx++;
      }, Math.max(30, speed / sol.points.length));
      innerIntervalsRef.current.add(ptInterval);
    }, speed);

    intervalRef.current = interval;
  }, [puzzle, watchSolveActive]);

  return { watchSolveFlows, watchSolveActive, isSolving: false, startWatchSolve };
}
