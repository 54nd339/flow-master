"use client";

import { useEffect, useRef } from "react";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { toast } from "sonner";

import type { PuzzleData } from "@/lib/engine/types";
import { decodePuzzle, parseQueryParams } from "@/lib/serialization";
import { getGameState } from "@/stores/game-store";
import { useLoad } from "@/stores/history-store";
import { getPuzzleState } from "@/stores/puzzle-store";
import { useSetDifficulty, useSetGridSize } from "@/stores/settings-store";

const IDB_GAME_STATE_KEY = "flow-master-game-state";

interface SavedGameState {
  puzzle: PuzzleData;
  colors: [string, string][];
  timerSeconds: number;
}

/**
 * Side-effect hook: handles IDB save/restore, URL import, visibility changes,
 * and history loading for the play page.
 */
export function useGamePersistence(
  puzzle: PuzzleData | null,
  colors: Map<string, string>,
): void {
  const setGridSize = useSetGridSize();
  const setDifficulty = useSetDifficulty();
  const loadHistory = useLoad();

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const hash = window.location.hash;
    if (hash.startsWith("#puzzle=")) {
      const encoded = hash.slice(8);
      const imported = decodePuzzle(encoded);
      if (imported) {
        getGameState().reset();
        getGameState().initPuzzle(imported);
        toast.success("Imported shared puzzle!");
        return;
      }
    }

    const qp = parseQueryParams(window.location.search);
    if (qp?.width && qp.height) {
      setGridSize(qp.width, qp.height);
      if (qp.difficulty) setDifficulty(qp.difficulty as "easy" | "medium" | "hard");
    }

    idbGet<SavedGameState>(IDB_GAME_STATE_KEY).then((saved) => {
      if (saved?.puzzle && !puzzle) {
        const restoredColors = new Map(saved.colors);
        getPuzzleState().setPuzzle(saved.puzzle, restoredColors);
        getGameState().initPuzzle(saved.puzzle);
        toast.info("Resuming previous puzzle", { duration: 2000 });
      }
    idbDel(IDB_GAME_STATE_KEY).catch((err) => console.warn("Failed to clear saved state:", err));
    }).catch((err) => console.warn("Failed to load saved state:", err));
  }, [puzzle, setGridSize, setDifficulty]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        const gs = getGameState();
        if (gs.timerRunning) gs.pauseTimer();
        if (puzzle && colors.size > 0) {
          const save: SavedGameState = {
            puzzle,
            colors: Array.from(colors.entries()),
            timerSeconds: gs.timerSeconds,
          };
          idbSet(IDB_GAME_STATE_KEY, save).catch((err) => console.warn("Failed to save game state:", err));
        }
      } else if (document.visibilityState === "visible") {
        const gs = getGameState();
        if (!gs.isComplete && gs.totalCells > 0) gs.resumeTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [puzzle, colors]);
}
