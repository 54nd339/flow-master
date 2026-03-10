import { MutableRefObject } from "react";

import type { PuzzleData } from "@/lib/engine/types";
import { getGameState } from "@/stores/game-store";

const MATRIX_DURATION_MS = 3000;
const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";

export function runMatrixRain(
  canvas: HTMLCanvasElement,
  rafRef: MutableRefObject<number>,
): void {
  canvas.classList.remove("hidden");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const columns = Math.floor(canvas.width / 14);
  const drops = new Array(columns).fill(1);
  const startTime = performance.now();

  function draw() {
    const elapsed = performance.now() - startTime;
    if (elapsed > MATRIX_DURATION_MS) {
      cancelAnimationFrame(rafRef.current);
      canvas.classList.add("hidden");
      return;
    }
    ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.fillStyle = "#0F0";
    ctx!.font = "14px monospace";
    for (let i = 0; i < drops.length; i++) {
      const text = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      ctx!.fillText(text, i * 14, drops[i] * 14);
      if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    rafRef.current = requestAnimationFrame(draw);
  }
  draw();
}

export function runSpeedSolve(
  puzzle: PuzzleData,
  intervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
): void {
  getGameState().initPuzzle(puzzle);
  let idx = 0;
  intervalRef.current = setInterval(() => {
    if (idx >= puzzle.solution.length) {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      return;
    }
    const sol = puzzle.solution[idx];
    getGameState().pushAction(
      { type: "draw", flowId: sol.flowId, path: [...sol.points] },
      puzzle,
    );
    idx++;
  }, 100);
}
