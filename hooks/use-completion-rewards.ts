"use client";

import { type MutableRefObject, useEffect, useRef } from "react";
import { toast } from "sonner";

import { audio, haptics } from "@/lib/audio";
import { getWeeklyFeaturedSize } from "@/lib/daily-seed";
import type { Difficulty } from "@/lib/engine/level-config";
import type { PuzzleData, StarRating } from "@/lib/engine/types";
import { calculateXP } from "@/lib/ranks";
import type { ReplayRecorder } from "@/lib/replay";
import { savePBGhost } from "@/lib/replay";
import { getCurrencyState } from "@/stores/currency-store";
import type { HistoryEntry } from "@/stores/history-store";
import { getHistoryState } from "@/stores/history-store";
import { makeRecordKey } from "@/stores/records-store";
import { getSettingsState } from "@/stores/settings-store";

interface CompletionRewardsParams {
  enabled?: boolean;
  isComplete: boolean;
  starRating: StarRating | null;
  puzzle: PuzzleData | null;
  difficulty: Difficulty;
  timerSeconds: number;
  moveCount: number;
  muted: boolean;
  hapticsEnabled: boolean;
  autoScale: boolean;
  submitResult: (key: string, time: number, moves: number, stars: StarRating) => boolean;
  addHistoryEntry: (entry: HistoryEntry) => void;
  earnLevelComplete: () => void;
  earnPerfectClear: () => void;
  incrementAchievement: (id: string) => void;
  updateAchievement: (id: string, value: number) => boolean;
  addXP: (xp: number) => void;
  replayRecorderRef: MutableRefObject<ReplayRecorder>;
}

export function useCompletionRewards({
  enabled = true,
  isComplete,
  starRating,
  puzzle,
  difficulty,
  timerSeconds,
  moveCount,
  muted,
  hapticsEnabled,
  autoScale,
  submitResult,
  addHistoryEntry,
  earnLevelComplete,
  earnPerfectClear,
  incrementAchievement,
  updateAchievement,
  addXP,
  replayRecorderRef,
}: CompletionRewardsParams) {
  const handledRef = useRef(false);

  useEffect(() => {
    if (!isComplete) {
      handledRef.current = false;
      return;
    }
    if (!enabled || handledRef.current || !starRating || !puzzle) return;
    handledRef.current = true;

    const key = makeRecordKey(puzzle.width, puzzle.height, difficulty);
    const isNewPB = submitResult(key, timerSeconds, moveCount, starRating);
    if (isNewPB) toast.success("New personal best!", { duration: 3000 });
    if (!muted) audio.puzzleComplete();
    if (hapticsEnabled) haptics.puzzleComplete();

    addHistoryEntry({
      seed: puzzle.seed,
      gridWidth: puzzle.width,
      gridHeight: puzzle.height,
      difficulty,
      time: timerSeconds,
      moves: moveCount,
      stars: starRating,
      date: Date.now(),
    });

    earnLevelComplete();
    if (starRating === 3) earnPerfectClear();

    const featuredSize = getWeeklyFeaturedSize();
    if (puzzle.width === featuredSize && puzzle.height === featuredSize) {
      getCurrencyState().earn(15);
      toast.info("Featured size bonus! +15 flows", { duration: 2000 });
    }

    const xp = calculateXP(starRating, puzzle.width * puzzle.height, timerSeconds, difficulty);
    addXP(xp);

    const frames = replayRecorderRef.current.stop();
    if (frames.length > 0) {
      savePBGhost(puzzle.width, puzzle.height, difficulty, {
        puzzleSeed: puzzle.seed,
        gridWidth: puzzle.width,
        gridHeight: puzzle.height,
        totalTimeMs: timerSeconds * 1000,
        frames,
        recordedAt: Date.now(),
      }).catch(() => {});
    }

    incrementAchievement("first_flow");
    incrementAchievement("ten_down");
    incrementAchievement("century");
    if (starRating === 3) incrementAchievement("perfectionist");
    if (puzzle.width >= 20 || puzzle.height >= 20) updateAchievement("big_grid", 1);
    if (puzzle.width >= 40 || puzzle.height >= 40) updateAchievement("huge_grid", 1);
    if (puzzle.width === 5 && puzzle.height === 5 && timerSeconds < 10) updateAchievement("speed_demon", 1);
    if (puzzle.width === 5 && puzzle.height === 5 && timerSeconds < 3) {
      const justUnlocked = updateAchievement("speed_3s", 1);
      if (justUnlocked) toast("Are you even human?", { duration: 5000 });
    }

    if (autoScale) {
      const entries = getHistoryState().entries.slice(0, 5);
      if (entries.length >= 3) {
        const avgStars = entries.reduce((s, e) => s + e.stars, 0) / entries.length;
        const difficulties: Difficulty[] = ["easy", "medium", "hard"];
        const idx = difficulties.indexOf(difficulty);
        if (avgStars >= 2.8 && idx < 2) {
          getSettingsState().setDifficulty(difficulties[idx + 1]);
          toast.info(`Difficulty increased to ${difficulties[idx + 1]}!`);
        } else if (avgStars <= 1.3 && idx > 0) {
          getSettingsState().setDifficulty(difficulties[idx - 1]);
          toast.info(`Difficulty eased to ${difficulties[idx - 1]}`);
        }
      }
    }
  }, [enabled, isComplete, starRating, puzzle, difficulty, timerSeconds, moveCount, submitResult, muted, hapticsEnabled, addHistoryEntry, autoScale, earnLevelComplete, earnPerfectClear, incrementAchievement, updateAchievement, addXP, replayRecorderRef]);
}
