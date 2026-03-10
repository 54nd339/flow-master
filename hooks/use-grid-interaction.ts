"use client";

import { useCallback, useRef } from "react";
import { useDrag } from "@use-gesture/react";

import { audio } from "@/lib/audio";
import { findEndpointAt, findFlowAt, isAdjacent, pointerToCell } from "@/lib/canvas/layout";
import type { DrawingState, LayoutInfo } from "@/lib/canvas/types";
import type { Endpoint, Point, PuzzleData } from "@/lib/engine/types";
import { useClearFlow, useCurrentFlows, useIsComplete, usePushAction, useSetActiveFlow } from "@/stores/game-store";
import { useMuted } from "@/stores/settings-store";

function isFlowConnected(flowId: string, path: Point[], endpoints: Endpoint[]): boolean {
  if (path.length < 2) return false;
  const eps = endpoints.filter((e) => e.flowId === flowId);
  if (eps.length !== 2) return false;
  const first = path[0];
  const last = path[path.length - 1];
  const matchFwd = first.x === eps[0].x && first.y === eps[0].y && last.x === eps[1].x && last.y === eps[1].y;
  const matchRev = first.x === eps[1].x && first.y === eps[1].y && last.x === eps[0].x && last.y === eps[0].y;
  return matchFwd || matchRev;
}

interface UseGridInteractionOptions {
  puzzle: PuzzleData;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layoutRef: React.RefObject<LayoutInfo>;
  dirtyRef: React.MutableRefObject<boolean>;
}

interface UseGridInteractionReturn {
  drawingRef: React.RefObject<DrawingState>;
  bind: ReturnType<typeof useDrag>;
  handleDoubleClick: (e: React.MouseEvent) => void;
}

export function useGridInteraction({
  puzzle,
  canvasRef,
  layoutRef,
  dirtyRef,
}: UseGridInteractionOptions): UseGridInteractionReturn {
  const currentFlows = useCurrentFlows();
  const isComplete = useIsComplete();
  const pushAction = usePushAction();
  const clearFlow = useClearFlow();
  const setActiveFlow = useSetActiveFlow();
  const muted = useMuted();

  const drawingRef = useRef<DrawingState>({
    active: false,
    flowId: null,
    path: [],
  });

  const handlePointerDown = useCallback(
    (cell: Point) => {
      if (isComplete) return;

      const ep = findEndpointAt(cell, puzzle.endpoints);
      if (ep) {
        const existing = currentFlows.get(ep.flowId);
        const connected = existing ? isFlowConnected(ep.flowId, existing, puzzle.endpoints) : false;

        if (existing && existing.length > 1 && !connected) {
          const first = existing[0];
          const last = existing[existing.length - 1];

          if (cell.x === last.x && cell.y === last.y) {
            drawingRef.current = {
              active: true,
              flowId: ep.flowId,
              path: [...existing],
            };
            setActiveFlow(ep.flowId);
            dirtyRef.current = true;
            if (!muted) audio.flowStart();
            return;
          }

          if (cell.x === first.x && cell.y === first.y) {
            drawingRef.current = {
              active: true,
              flowId: ep.flowId,
              path: [...existing].reverse(),
            };
            setActiveFlow(ep.flowId);
            dirtyRef.current = true;
            if (!muted) audio.flowStart();
            return;
          }

          clearFlow(ep.flowId);
        } else if (existing && existing.length > 0) {
          clearFlow(ep.flowId);
        }
        drawingRef.current = {
          active: true,
          flowId: ep.flowId,
          path: [cell],
        };
        setActiveFlow(ep.flowId);
        dirtyRef.current = true;
        if (!muted) audio.flowStart();
        return;
      }

      const occupying = findFlowAt(cell, currentFlows);
      if (occupying) {
        const path = currentFlows.get(occupying);
        const occupyingConnected = path ? isFlowConnected(occupying, path, puzzle.endpoints) : false;

        if (path && path.length > 0 && !occupyingConnected) {
          const last = path[path.length - 1];
          const first = path[0];

          if (cell.x === last.x && cell.y === last.y) {
            drawingRef.current = {
              active: true,
              flowId: occupying,
              path: [...path],
            };
            setActiveFlow(occupying);
            dirtyRef.current = true;
            if (!muted) audio.flowStart();
            return;
          }

          if (cell.x === first.x && cell.y === first.y) {
            drawingRef.current = {
              active: true,
              flowId: occupying,
              path: [...path].reverse(),
            };
            setActiveFlow(occupying);
            dirtyRef.current = true;
            if (!muted) audio.flowStart();
            return;
          }
        }
        clearFlow(occupying);
        dirtyRef.current = true;
      }
    },
    [puzzle.endpoints, currentFlows, isComplete, clearFlow, setActiveFlow, muted, dirtyRef],
  );

  const handlePointerMove = useCallback(
    (cell: Point) => {
      const drawing = drawingRef.current;
      if (!drawing.active || !drawing.flowId) return;

      const lastPoint = drawing.path[drawing.path.length - 1];
      if (!lastPoint) return;
      if (cell.x === lastPoint.x && cell.y === lastPoint.y) return;
      if (!isAdjacent(lastPoint, cell)) return;

      const backtrackIdx = drawing.path.findIndex(
        (pt) => pt.x === cell.x && pt.y === cell.y,
      );
      if (backtrackIdx >= 0) {
        drawing.path = drawing.path.slice(0, backtrackIdx + 1);
        dirtyRef.current = true;
        return;
      }

      if (puzzle.blockedCells?.some((bc) => bc.x === cell.x && bc.y === cell.y)) {
        return;
      }

      const otherEndpoint = findEndpointAt(cell, puzzle.endpoints);
      if (otherEndpoint && otherEndpoint.flowId !== drawing.flowId) {
        return;
      }

      const occupying = findFlowAt(cell, currentFlows);
      if (occupying && occupying !== drawing.flowId) {
        clearFlow(occupying);
      }

      drawing.path.push(cell);
      dirtyRef.current = true;
      if (!muted) audio.cellSnap();

      const matchingEp = findEndpointAt(cell, puzzle.endpoints);
      if (
        matchingEp &&
        matchingEp.flowId === drawing.flowId &&
        drawing.path.length > 1
      ) {
        const action = {
          type: "draw" as const,
          flowId: drawing.flowId,
          path: [...drawing.path],
        };
        pushAction(action, puzzle);
        drawing.active = false;
        drawing.flowId = null;
        drawing.path = [];
      }
    },
    [puzzle, currentFlows, pushAction, clearFlow, muted, dirtyRef],
  );

  const handlePointerUp = useCallback(() => {
    const drawing = drawingRef.current;
    if (!drawing.active || !drawing.flowId) return;

    if (drawing.path.length > 1) {
      const action = {
        type: "draw" as const,
        flowId: drawing.flowId,
        path: [...drawing.path],
      };
      pushAction(action, puzzle);
    }

    drawing.active = false;
    drawing.flowId = null;
    drawing.path = [];
    dirtyRef.current = true;
  }, [pushAction, puzzle, dirtyRef]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || isComplete) return;
      const cell = pointerToCell(
        e.clientX,
        e.clientY,
        canvas,
        layoutRef.current,
        puzzle.width,
        puzzle.height,
      );
      if (!cell) return;
      const occupying = findFlowAt(cell, currentFlows);
      if (occupying) clearFlow(occupying);
    },
    [puzzle, currentFlows, isComplete, clearFlow, canvasRef, layoutRef],
  );

  const bind = useDrag(
    ({ event, first, last, xy: [clientX, clientY] }) => {
      event?.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const cell = pointerToCell(
        clientX,
        clientY,
        canvas,
        layoutRef.current,
        puzzle.width,
        puzzle.height,
      );
      if (!cell) {
        if (last) handlePointerUp();
        return;
      }

      if (first) handlePointerDown(cell);
      else if (last) handlePointerUp();
      else handlePointerMove(cell);
    },
    { pointer: { touch: true }, filterTaps: true },
  );

  return { drawingRef, bind, handleDoubleClick };
}
