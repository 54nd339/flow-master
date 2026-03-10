"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import { fireAction } from "@/lib/keyboard-actions";
import { exportSaveData, importSaveData } from "@/lib/save-data";
import { getAchievementState } from "@/stores/achievement-store";
import { getCurrencyState } from "@/stores/currency-store";
import { getGameState } from "@/stores/game-store";
import { getPuzzleState } from "@/stores/puzzle-store";
import { getSettingsState } from "@/stores/settings-store";

const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const GRID_PRESETS: Record<string, number> = {
  "1": 5, "2": 7, "3": 9, "4": 12, "5": 15,
  "6": 20, "7": 25, "8": 30, "9": 45,
};

interface KeyboardShortcutsProps {
  onOpenCommandPalette: () => void;
  onWatchSolve?: () => void;
  children: ReactNode;
}

export function KeyboardShortcuts({
  onOpenCommandPalette,
  onWatchSolve,
  children,
}: KeyboardShortcutsProps) {
  const konamiIndex = useRef(0);

  const handleKonamiCode = useCallback(() => {
    const unlocked = localStorage.getItem("flow-master-retro-unlocked") === "true";
    if (!unlocked) {
      localStorage.setItem("flow-master-retro-unlocked", "true");
      const wasNew = getAchievementState().unlockDirectly("old_school");
      if (wasNew) getCurrencyState().earn(100);
      toast.success("Retro theme unlocked! Check the themes menu.", { duration: 5000 });
    } else {
      toast.info("Retro theme already unlocked!");
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const expected = KONAMI_SEQUENCE[konamiIndex.current];
      if (e.key === expected) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI_SEQUENCE.length) {
          konamiIndex.current = 0;
          handleKonamiCode();
        }
      } else {
        konamiIndex.current = e.key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKonamiCode]);

  useHotkeys("mod+k", (e) => { e.preventDefault(); onOpenCommandPalette(); });

  useHotkeys("s", () => getPuzzleState().toggleSolution(), { preventDefault: true });

  useHotkeys("mod+z", (e) => { e.preventDefault(); getGameState().undo(); });
  useHotkeys("mod+shift+z", (e) => { e.preventDefault(); getGameState().redo(); });
  useHotkeys("d", () => {
    const s = getGameState();
    if (s.activeFlowId) s.clearFlow(s.activeFlowId);
  }, { preventDefault: true });

  useHotkeys("space", (e) => {
    e.preventDefault();
    const s = getGameState();
    if (s.timerRunning) s.pauseTimer(); else s.resumeTimer();
  });

  useHotkeys("m", () => getSettingsState().toggleMuted(), { preventDefault: true });
  useHotkeys("h", () => getSettingsState().toggleHighContrast(), { preventDefault: true });
  useHotkeys("l", () => getSettingsState().toggleLeftHanded(), { preventDefault: true });
  useHotkeys("mod+shift+k", (e) => { e.preventDefault(); getSettingsState().toggleMinimalHud(); });

  useHotkeys("mod+e", (e) => {
    e.preventDefault();
    exportSaveData().then((json) =>
      navigator.clipboard.writeText(json).then(() => toast.success("Save data copied to clipboard!")),
    ).catch(() => toast.error("Failed to export save data"));
  });

  useHotkeys("mod+shift+i", (e) => {
    e.preventDefault();
    navigator.clipboard.readText().then((json) =>
      importSaveData(json).then((ok) => {
        if (ok) { toast.success("Save data imported! Refreshing..."); setTimeout(() => window.location.reload(), 1000); }
        else toast.error("Invalid save data format");
      }),
    ).catch(() => toast.error("Failed to read clipboard — paste manually"));
  });

  useHotkeys("n", () => fireAction("generate"), { preventDefault: true });
  useHotkeys("r", () => fireAction("reset"), { preventDefault: true });
  useHotkeys("p", () => fireAction("playAgain"), { preventDefault: true });
  useHotkeys("enter", () => fireAction("nextPuzzle"), { preventDefault: true });
  useHotkeys("shift+/", () => fireAction("hint"), { preventDefault: true });
  useHotkeys("0", () => fireAction("resetZoom"));
  useHotkeys("=", () => fireAction("gridSizeIncrement", 1));
  useHotkeys("-", () => fireAction("gridSizeIncrement", -1));

  useHotkeys("1,2,3,4,5,6,7,8,9", (e) => {
    const size = GRID_PRESETS[e.key];
    if (size) fireAction("setGridSize", size);
  });

  useHotkeys("mod+shift+s", (e) => { e.preventDefault(); fireAction("sharePuzzle"); });
  useHotkeys("mod+shift+c", (e) => { e.preventDefault(); fireAction("copySeed"); });

  useHotkeys("w", () => onWatchSolve?.(), { preventDefault: true });

  return <>{children}</>;
}
