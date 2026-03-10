"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { audio, haptics } from "@/lib/audio";
import { getDailyDateString, getDailyGridSize, getDailySeed } from "@/lib/daily-seed";
import { useIncrementProgress, useUpdateProgress } from "@/stores/achievement-store";
import { useEarnDailyChallenge, useEarnLevelComplete, useEarnPerfectClear, useEarnStreakBonus } from "@/stores/currency-store";
import { getGameState, useIsComplete, useMoveCount, useStarRating, useTimerSeconds } from "@/stores/game-store";
import { makeRecordKey, useSubmitResult } from "@/stores/records-store";
import { useHaptics, useMuted } from "@/stores/settings-store";
import { useCurrentStreak, useLastCompletedDate, useLongestStreak, useRecordCompletion } from "@/stores/streak-store";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";
import { useTimerTick } from "@/hooks/use-timer-tick";

export function useDaily() {
  const muted = useMuted();
  const hapticsEnabled = useHaptics();

  const timerSeconds = useTimerSeconds();
  const isComplete = useIsComplete();
  const moveCount = useMoveCount();
  const starRating = useStarRating();

  useTimerTick();

  const submitResult = useSubmitResult();
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const lastCompletedDate = useLastCompletedDate();
  const recordCompletion = useRecordCompletion();

  const earnDailyChallenge = useEarnDailyChallenge();
  const earnLevelComplete = useEarnLevelComplete();
  const earnPerfectClear = useEarnPerfectClear();
  const earnStreakBonus = useEarnStreakBonus();

  const incrementAchievement = useIncrementProgress();
  const updateAchievement = useUpdateProgress();

  const { generate, puzzle, colors, isGenerating } = usePuzzleGenerator();

  const todayStr = getDailyDateString();
  const alreadyCompleted = lastCompletedDate === todayStr;
  const [dailyDone, setDailyDone] = useState(alreadyCompleted);
  const [genFailed, setGenFailed] = useState(false);

  const hasGenRef = useRef(false);
  useEffect(() => {
    if (hasGenRef.current || alreadyCompleted) return;
    hasGenRef.current = true;
    const gridSize = getDailyGridSize();
    const seed = getDailySeed();
    getGameState().reset();
    generate(gridSize, gridSize, "medium", seed).then((result) => {
      if (result) getGameState().initPuzzle(result);
      else setGenFailed(true);
    });
  }, [generate, alreadyCompleted]);

  useEffect(() => {
    if (!isComplete || !starRating || !puzzle || dailyDone) return;
    const key = makeRecordKey(puzzle.width, puzzle.height, "daily");
    submitResult(key, timerSeconds, moveCount, starRating);
    recordCompletion(todayStr);
    setTimeout(() => setDailyDone(true), 0);
    if (!muted) audio.puzzleComplete();
    if (hapticsEnabled) haptics.puzzleComplete();

    earnDailyChallenge();
    earnLevelComplete();
    if (starRating === 3) earnPerfectClear();

    const newStreak = currentStreak + 1;
    const multiplier = 1 + newStreak * 0.1;
    earnStreakBonus(multiplier);

    incrementAchievement("first_flow");
    incrementAchievement("ten_down");
    incrementAchievement("century");
    incrementAchievement("daily_10");
    if (starRating === 3) incrementAchievement("perfectionist");
    updateAchievement("streak_3", newStreak);
    updateAchievement("streak_7", newStreak);
    updateAchievement("streak_30", newStreak);

    if (newStreak >= 100) {
      updateAchievement("century_club", newStreak);
      toast.success("Century Club! 100-day streak!", { duration: 8000 });
    } else {
      toast.success(`Daily challenge complete! Streak: ${newStreak}`);
    }
  }, [
    isComplete,
    starRating,
    puzzle,
    dailyDone,
    timerSeconds,
    moveCount,
    submitResult,
    recordCompletion,
    todayStr,
    currentStreak,
    muted,
    hapticsEnabled,
    earnDailyChallenge,
    earnLevelComplete,
    earnPerfectClear,
    earnStreakBonus,
    incrementAchievement,
    updateAchievement,
  ]);

  const handleRetry = useCallback(() => {
    setGenFailed(false);
    hasGenRef.current = false;
  }, []);

  return {
    puzzle,
    colors,
    isGenerating,
    timerSeconds,
    isComplete,
    moveCount,
    starRating,
    dailyDone,
    alreadyCompleted,
    genFailed,
    currentStreak,
    longestStreak,
    todayStr,
    handleRetry,
  };
}
