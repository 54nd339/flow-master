"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { audio, haptics } from "@/lib/audio";
import type { CampaignArea } from "@/lib/campaign";
import { areaSeed, getArea, LEVELS_PER_AREA } from "@/lib/campaign";
import { useIncrementProgress } from "@/stores/achievement-store";
import {
  useAddXP,
  useCompleteLevel,
  useCurrentArea,
  useCurrentLevel,
  useGetAreaHistory,
  useIsAreaUnlocked,
  useMaxArea,
  useSetCurrentPosition,
  useSkipArea,
} from "@/stores/campaign-store";
import { useBalance, useCanAfford, useEarnLevelComplete, useEarnPerfectClear, useSpendSkip } from "@/stores/currency-store";
import { getGameState, useIsComplete, useMoveCount, usePipePercent, useStarRating, useTimerSeconds } from "@/stores/game-store";
import { useHaptics, useMuted } from "@/stores/settings-store";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";
import { useTimerTick } from "@/hooks/use-timer-tick";

type View = "select" | "play";

export function useCampaignGame() {
  const [view, setView] = useState<View>("select");
  const [activeArea, setActiveArea] = useState<CampaignArea | null>(null);
  const [activeLevel, setActiveLevel] = useState(0);
  const [genFailed, setGenFailed] = useState(false);

  const muted = useMuted();
  const hapticsEnabled = useHaptics();

  const timerSeconds = useTimerSeconds();
  const isComplete = useIsComplete();

  useTimerTick();
  const moveCount = useMoveCount();
  const pipePercent = usePipePercent();
  const starRating = useStarRating();

  const currentArea = useCurrentArea();
  const currentLevel = useCurrentLevel();
  const maxArea = useMaxArea();
  const isAreaUnlocked = useIsAreaUnlocked();
  const getAreaHistory = useGetAreaHistory();
  const completeLevelAction = useCompleteLevel();
  const skipAreaAction = useSkipArea();
  const setCurrentPosition = useSetCurrentPosition();
  const addXP = useAddXP();

  const earnLevelComplete = useEarnLevelComplete();
  const earnPerfectClear = useEarnPerfectClear();
  const balance = useBalance();
  const spendSkip = useSpendSkip();
  const canAfford = useCanAfford();

  const incrementAchievement = useIncrementProgress();

  const { generate, puzzle, colors, isGenerating } = usePuzzleGenerator();

  const completionHandled = useRef(false);
  useEffect(() => {
    if (!isComplete || !starRating || !puzzle || completionHandled.current) return;
    if (!activeArea) return;
    completionHandled.current = true;

    const hash = `${activeArea.id}-${activeLevel}-${Date.now()}`;
    completeLevelAction(activeArea.id, activeLevel, hash);

    const xp = starRating * 10 + (activeArea.w * activeArea.h);
    addXP(xp);

    earnLevelComplete();
    if (starRating === 3) earnPerfectClear();

    incrementAchievement("campaign_5", 1);
    incrementAchievement("campaign_15", 1);
    incrementAchievement("campaign_25", 1);

    if (!muted) audio.puzzleComplete();
    if (hapticsEnabled) haptics.puzzleComplete();
    toast.success(`Area ${activeArea.id} – Level ${activeLevel + 1} complete!`);
  }, [isComplete, starRating, puzzle, activeArea, activeLevel, moveCount, timerSeconds, completeLevelAction, addXP, earnLevelComplete, earnPerfectClear, incrementAchievement, muted, hapticsEnabled]);

  const handlePlayLevel = useCallback(
    async (areaId: number, levelIdx: number) => {
      const area = getArea(areaId);
      if (!area) return;

      setActiveArea(area);
      setActiveLevel(levelIdx);
      setCurrentPosition(areaId, levelIdx);
      setView("play");
      completionHandled.current = false;
      getGameState().reset();

      const seed = areaSeed(areaId, levelIdx);
      const result = await generate(
        area.w,
        area.h,
        "medium",
        seed,
        { min: area.minColors, max: area.maxColors },
      );
      if (result) {
        getGameState().initPuzzle(result);
        setGenFailed(false);
      } else {
        setGenFailed(true);
      }
    },
    [generate, setCurrentPosition],
  );

  const handleNextLevel = useCallback(async () => {
    if (!activeArea) return;
    const nextLevel = activeLevel + 1;
    if (nextLevel >= LEVELS_PER_AREA) {
      const nextAreaId = activeArea.id + 1;
      if (nextAreaId > 25) {
        toast.success("You've completed all campaign areas!");
        setView("select");
        return;
      }
      await handlePlayLevel(nextAreaId, 0);
    } else {
      await handlePlayLevel(activeArea.id, nextLevel);
    }
  }, [activeArea, activeLevel, handlePlayLevel]);

  const handlePlayAgain = useCallback(async () => {
    if (!activeArea) return;
    await handlePlayLevel(activeArea.id, activeLevel);
  }, [activeArea, activeLevel, handlePlayLevel]);

  const handleSkipArea = useCallback(() => {
    if (!activeArea) return;
    if (!canAfford(50)) {
      toast.error("Not enough flows! Need 50 to skip.");
      return;
    }
    if (spendSkip()) {
      skipAreaAction(activeArea.id);
      toast.info(`Area ${activeArea.id} skipped`);
      const nextId = activeArea.id + 1;
      if (nextId <= 25) handlePlayLevel(nextId, 0);
      else setView("select");
    }
  }, [activeArea, canAfford, spendSkip, skipAreaAction, handlePlayLevel]);

  const handleBackToSelect = useCallback(() => {
    getGameState().reset();
    setView("select");
  }, []);

  return {
    view,
    activeArea,
    activeLevel,
    genFailed,
    timerSeconds,
    isComplete,
    moveCount,
    pipePercent,
    starRating,
    currentArea,
    currentLevel,
    maxArea,
    isAreaUnlocked,
    getAreaHistory,
    balance,
    isGenerating,
    puzzle,
    colors,
    handlePlayLevel,
    handleNextLevel,
    handlePlayAgain,
    handleSkipArea,
    handleBackToSelect,
  };
}
