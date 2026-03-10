"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import panzoom, { type PanZoom } from "panzoom";

import { computeLayout, pointerToCell } from "@/lib/canvas/layout";
import {
  drawAlmostThereGlow,
  drawBlockedCells,
  drawCellFills,
  drawCompleteWave,
  drawEndpoints,
  drawGhostFlows,
  drawGridLines,
  drawSmoothPath,
  drawSolution,
  getReducedMotion,
  getThemeColors,
} from "@/lib/canvas/renderers";
import type { GridCanvasProps, LayoutInfo } from "@/lib/canvas/types";
import { getThemeById } from "@/lib/themes";
import { useActiveFlowId, useCompletedAt, useCurrentFlows, useIsComplete, usePipePercent } from "@/stores/game-store";
import { useColorblindMode, useGameThemeId, useHighContrast, useMuted, useReducedMotion } from "@/stores/settings-store";
import { useConnectedFlows } from "@/hooks/use-connected-flows";
import { useGameSoundEffects } from "@/hooks/use-game-sound-effects";
import { useGridInteraction } from "@/hooks/use-grid-interaction";

export function GridCanvas({
  puzzle,
  colors,
  showSolution,
  className,
  resetZoomCounter,
  ghostFlows,
  watchSolveFlows,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panzoomWrapRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<PanZoom | null>(null);
  const layoutRef = useRef<LayoutInfo>({ cellSize: 0, padding: 16, canvasW: 0, canvasH: 0 });
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const dirtyRef = useRef(true);
  const completeAnimRef = useRef<{ startTime: number; active: boolean }>({ startTime: 0, active: false });

  const [hoveredCell, setHoveredCell] = useState<import("@/lib/engine/types").Point | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const currentFlows = useCurrentFlows();
  const activeFlowId = useActiveFlowId();
  const isComplete = useIsComplete();
  const completedAt = useCompletedAt();
  const pipePercent = usePipePercent();
  const muted = useMuted();
  const colorblindMode = useColorblindMode();
  const highContrast = useHighContrast();
  const reducedMotionSetting = useReducedMotion();
  const reducedMotion = getReducedMotion(reducedMotionSetting);
  const gameThemeId = useGameThemeId();
  const activeGameTheme = getThemeById(gameThemeId);

  const { bind, handleDoubleClick, drawingRef } = useGridInteraction({
    puzzle,
    canvasRef,
    layoutRef,
    dirtyRef,
  });

  const connectedFlows = useConnectedFlows(puzzle, currentFlows);
  useGameSoundEffects(connectedFlows, muted);

  useEffect(() => {
    const wrap = panzoomWrapRef.current;
    if (!wrap) return;
    const instance = panzoom(wrap, {
      maxZoom: 4,
      minZoom: 0.5,
      smoothScroll: false,
      onTouch: (e: TouchEvent) => e.touches.length >= 2,
      beforeMouseDown: (e: MouseEvent) => {
        // Only allow panning with middle mouse button or if space/ctrl is held
        // Otherwise return true to skip panning so drawing works
        const isDrawingButton = e.button === 0 && !e.ctrlKey && !e.shiftKey;
        return isDrawingButton;
      },
      beforeWheel: (e: WheelEvent) => {
        // Trackpad pinch zoom often sends wheel events with ctrlKey: true.
        if (e.ctrlKey) return false;

        // Perform manual panning on standard scroll
        const pz = panzoomRef.current;
        if (pz) {
          pz.moveBy(-e.deltaX, -e.deltaY, true);
        }
        return true; // Block panzoom from zooming on standard scroll
      },
    });
    panzoomRef.current = instance;
    return () => {
      instance.dispose();
      panzoomRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = panzoomRef.current;
    if (!instance) return;
    instance.moveTo(0, 0);
    instance.zoomAbs(0, 0, 1);
  }, [puzzle, resetZoomCounter]);

  useEffect(() => {
    if (isComplete && completedAt) {
      completeAnimRef.current = { startTime: performance.now(), active: true };
      dirtyRef.current = true;
    }
  }, [isComplete, completedAt]);


  useEffect(() => {
    dirtyRef.current = true;
  }, [currentFlows, activeFlowId, showSolution, isDark, connectedFlows, puzzle, colorblindMode, highContrast, pipePercent, ghostFlows, watchSolveFlows, gameThemeId]);

  const render = useCallback(function renderLoop() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const hasAnimation = drawingRef.current.active || !isComplete || completeAnimRef.current.active;
    if (!dirtyRef.current && !hasAnimation) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    dirtyRef.current = false;

    const layout = computeLayout(container.clientWidth, container.clientHeight, puzzle.width, puzzle.height);
    layoutRef.current = layout;
    const { cellSize, padding, canvasW, canvasH } = layout;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== canvasW * dpr || canvas.height !== canvasH * dpr) {
      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(render);
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const themeColors = getThemeColors(isDark, highContrast, activeGameTheme);
    const time = (performance.now() - startTimeRef.current) / 1000;

    ctx.fillStyle = themeColors.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    drawGridLines(ctx, puzzle.width, puzzle.height, cellSize, padding, themeColors);

    if (puzzle.blockedCells && puzzle.blockedCells.length > 0) {
      drawBlockedCells(ctx, puzzle.blockedCells, cellSize, padding, isDark);
    }

    drawCellFills(ctx, currentFlows, colors, cellSize, padding, themeColors.fillAlpha);

    if (showSolution) {
      drawSolution(ctx, puzzle.solution, colors, cellSize, padding, themeColors.solutionAlpha);
    }

    if (ghostFlows && ghostFlows.size > 0) {
      drawGhostFlows(ctx, ghostFlows, colors, cellSize, padding);
    }

    if (watchSolveFlows && watchSolveFlows.size > 0) {
      drawCellFills(ctx, watchSolveFlows, colors, cellSize, padding, themeColors.fillAlpha * 0.6);
      const wsLineWidth = Math.max(cellSize * 0.3, 2);
      for (const [flowId, path] of watchSolveFlows) {
        const color = colors.get(flowId) ?? "#888";
        drawSmoothPath(ctx, path, color, cellSize, padding, wsLineWidth, 0.7);
      }
    }

    const lineWidth = Math.max(cellSize * (highContrast ? 0.42 : 0.35), highContrast ? 4 : 3);
    for (const [flowId, path] of currentFlows) {
      const color = colors.get(flowId) ?? "#888";
      const isActive = flowId === activeFlowId;
      drawSmoothPath(ctx, path, color, cellSize, padding, isActive ? lineWidth + themeColors.activeLineExtra : lineWidth, 1);
    }

    const drawing = drawingRef.current;
    if (drawing.active && drawing.flowId && drawing.path.length > 0) {
      const color = colors.get(drawing.flowId) ?? "#888";
      drawSmoothPath(ctx, drawing.path, color, cellSize, padding, lineWidth + themeColors.activeLineExtra, 0.8);
      dirtyRef.current = true;
    }

    drawEndpoints(
      ctx,
      puzzle.endpoints,
      colors,
      cellSize,
      padding,
      themeColors,
      connectedFlows,
      time,
      colorblindMode,
      reducedMotion,
      highContrast,
      hoveredCell,
    );

    if (!reducedMotion && !isComplete) {
      dirtyRef.current = true;
    }

    if (!isComplete && !reducedMotion && pipePercent >= 90) {
      drawAlmostThereGlow(ctx, canvasW, canvasH, time);
      dirtyRef.current = true;
    }

    if (completeAnimRef.current.active) {
      const elapsed = (performance.now() - completeAnimRef.current.startTime) / 1000;
      const duration = 0.6;
      if (elapsed < duration) {
        drawCompleteWave(ctx, puzzle.width, puzzle.height, cellSize, padding, elapsed / duration, reducedMotion);
        dirtyRef.current = true;
      } else {
        completeAnimRef.current.active = false;
      }
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }, [
    puzzle, colors, showSolution, isDark, currentFlows, activeFlowId,
    connectedFlows, isComplete, colorblindMode, highContrast, reducedMotion,
    pipePercent, ghostFlows, watchSolveFlows, drawingRef, hoveredCell, activeGameTheme,
  ]);

  useEffect(() => {
    startTimeRef.current = performance.now();
    dirtyRef.current = true;
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    const onResize = () => { dirtyRef.current = true; };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div ref={panzoomWrapRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${puzzle.width} by ${puzzle.height} flow puzzle grid, ${puzzle.endpoints.length / 2} color pairs${isComplete ? ", solved" : ""}`}
          tabIndex={0}
          className="mx-auto block touch-none"
          onDoubleClick={handleDoubleClick}
          onMouseMove={(e) => {
            if (!canvasRef.current) return;
            const cell = pointerToCell(
              e.clientX,
              e.clientY,
              canvasRef.current,
              layoutRef.current,
              puzzle.width,
              puzzle.height,
            );
            if (cell?.x !== hoveredCell?.x || cell?.y !== hoveredCell?.y) {
              setHoveredCell(cell);
              dirtyRef.current = true;
            }
          }}
          onMouseLeave={() => {
            setHoveredCell(null);
            dirtyRef.current = true;
          }}
          {...bind()}
        />
      </div>
    </div>
  );
}
