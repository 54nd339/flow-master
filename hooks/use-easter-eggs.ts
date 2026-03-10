"use client";

import { useRef } from "react";

import { runMatrixRain, runSpeedSolve } from "@/lib/easter-eggs";
import type { PuzzleData } from "@/lib/engine/types";

export function useEasterEggs(puzzle: PuzzleData | null) {
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const matrixRafRef = useRef<number>(0);
  const speedSolveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMatrixEasterEgg = () => {
    if (matrixCanvasRef.current) {
      runMatrixRain(matrixCanvasRef.current, matrixRafRef);
    }
  };

  const handleSpeedEasterEgg = () => {
    if (puzzle) {
      if (speedSolveIntervalRef.current) {
        clearInterval(speedSolveIntervalRef.current);
      }
      runSpeedSolve(puzzle, speedSolveIntervalRef);
    }
  };

  return {
    matrixCanvasRef,
    handleMatrixEasterEgg,
    handleSpeedEasterEgg,
  };
}
