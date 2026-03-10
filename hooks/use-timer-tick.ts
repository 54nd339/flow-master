"use client";

import { useEffect } from "react";

import { getGameState } from "@/stores/game-store";

let activeInterval: ReturnType<typeof setInterval> | null = null;
let refCount = 0;

/**
 * Ref-counted singleton timer tick. Multiple consumers share a single
 * setInterval so the game clock advances exactly once per real second.
 */
export function useTimerTick() {
  useEffect(() => {
    refCount++;
    if (refCount === 1) {
      activeInterval = setInterval(() => {
        const state = getGameState();
        if (state.timerRunning) state.tick();
      }, 1000);
    }
    return () => {
      refCount--;
      if (refCount <= 0 && activeInterval) {
        clearInterval(activeInterval);
        activeInterval = null;
        refCount = 0;
      }
    };
  }, []);
}
