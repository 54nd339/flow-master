"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { audio, haptics } from "@/lib/audio";
import { getDailyDateString, getDailySeed } from "@/lib/daily-seed";
import type { Difficulty } from "@/lib/engine/level-config";
import { formatTime } from "@/lib/utils";
import { useUpdateProgress } from "@/stores/achievement-store";
import { useEarnLevelComplete, useEarnPerfectClear } from "@/stores/currency-store";
import { getGameState, useIsComplete, useMoveCount, useStarRating, useTimerSeconds } from "@/stores/game-store";
import { makeRecordKey, useSubmitResult } from "@/stores/records-store";
import { useHaptics, useMuted } from "@/stores/settings-store";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";
import { useTimerTick } from "@/hooks/use-timer-tick";

export const GAUNTLET_STAGES: { size: number; difficulty: Difficulty }[] = [
  { size: 5, difficulty: "easy" },
  { size: 7, difficulty: "easy" },
  { size: 9, difficulty: "medium" },
  { size: 12, difficulty: "medium" },
  { size: 15, difficulty: "hard" },
];

const LS_GAUNTLET_KEY = "flow-master-gauntlet-";

export function useGauntlet() {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageTimes, setStageTimes] = useState<number[]>([]);
  const [gauntletComplete, setGauntletComplete] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [genFailed, setGenFailed] = useState(false);

  const muted = useMuted();
  const hapticsEnabled = useHaptics();
  const timerSeconds = useTimerSeconds();
  const isComplete = useIsComplete();
  const moveCount = useMoveCount();
  const starRating = useStarRating();

  useTimerTick();

  const submitResult = useSubmitResult();
  const earnLevelComplete = useEarnLevelComplete();
  const earnPerfectClear = useEarnPerfectClear();
  const updateAchievement = useUpdateProgress();

  const { generate, puzzle, colors, isGenerating } = usePuzzleGenerator();

  const todayStr = getDailyDateString();
  const baseSeed = getDailySeed() + 99999;

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    try {
      const attempted = localStorage.getItem(`${LS_GAUNTLET_KEY}${todayStr}`);
      if (attempted) {
        setTimeout(() => setAlreadyAttempted(true), 0);
        return;
      }
    } catch (err) {
      console.warn("Failed to read gauntlet state:", err);
    }

    const stage = GAUNTLET_STAGES[0];
    getGameState().reset();
    generate(stage.size, stage.size, stage.difficulty, baseSeed).then((result) => {
      if (result) getGameState().initPuzzle(result);
      else setGenFailed(true);
    });
  }, [generate, todayStr, baseSeed]);

  const handleNextStage = useCallback(async () => {
    const nextIdx = stageIndex + 1;
    if (nextIdx >= GAUNTLET_STAGES.length) return;

    setStageIndex(nextIdx);
    const stage = GAUNTLET_STAGES[nextIdx];
    getGameState().reset();
    const seed = baseSeed + nextIdx * 1000;
    const result = await generate(stage.size, stage.size, stage.difficulty, seed);
    if (result) getGameState().initPuzzle(result);
  }, [stageIndex, generate, baseSeed]);

  const completionHandled = useRef(false);
  useEffect(() => {
    if (!isComplete || !starRating || gauntletComplete || completionHandled.current) return;
    completionHandled.current = true;

    getGameState().stopTimer();

    const stage = GAUNTLET_STAGES[stageIndex];
    if (!muted) audio.puzzleComplete();
    if (hapticsEnabled) haptics.puzzleComplete();

    const key = makeRecordKey(stage.size, stage.size, "gauntlet");
    submitResult(key, timerSeconds, moveCount, starRating);

    const newTimes = [...stageTimes, timerSeconds];
    setTimeout(() => setStageTimes(newTimes), 0);

    if (stageIndex === GAUNTLET_STAGES.length - 1) {
      const totalTime = newTimes.reduce((a, b) => a + b, 0);
      const totalKey = makeRecordKey(0, 0, "gauntlet-total");
      submitResult(totalKey, totalTime, 0, starRating);

      earnLevelComplete();
      if (starRating === 3) earnPerfectClear();
      updateAchievement("gauntlet_clear", 1);

      try {
        localStorage.setItem(
          `${LS_GAUNTLET_KEY}${todayStr}`,
          JSON.stringify({
            times: newTimes,
            totalTime,
            completedAt: Date.now(),
          }),
        );
      } catch (err) {
        console.warn("Failed to save gauntlet state:", err);
      }

      toast.success(`Gauntlet complete! Total: ${formatTime(totalTime)}`, {
        duration: 5000,
      });

      setTimeout(() => setGauntletComplete(true), 0);
    } else {
      setTimeout(() => {
        completionHandled.current = false;
        handleNextStage();
      }, 1500);
    }
  }, [
    isComplete,
    starRating,
    stageIndex,
    timerSeconds,
    moveCount,
    stageTimes,
    gauntletComplete,
    muted,
    hapticsEnabled,
    submitResult,
    todayStr,
    earnLevelComplete,
    earnPerfectClear,
    updateAchievement,
    handleNextStage,
  ]);

  const handleRetry = useCallback(() => {
    setGenFailed(false);
    hasInitRef.current = false;
  }, []);

  return {
    stageIndex,
    stageTimes,
    gauntletComplete,
    alreadyAttempted,
    genFailed,
    puzzle,
    colors,
    isGenerating,
    timerSeconds,
    isComplete,
    moveCount,
    starRating,
    handleNextStage,
    handleRetry,
    todayStr,
  };
}
