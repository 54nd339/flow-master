"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { audio, haptics } from "@/lib/audio";
import type { Phase } from "@/lib/time-attack";
import { difficultyMultiplier, saveHighScore } from "@/lib/time-attack";
import { useUpdateProgress } from "@/stores/achievement-store";
import { useEarnTimeAttack } from "@/stores/currency-store";
import { getGameState, useIsComplete, useMoveCount, usePipePercent } from "@/stores/game-store";
import { useHaptics, useMuted } from "@/stores/settings-store";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";

export function useTimeAttack() {
  const [phase, setPhase] = useState<Phase>("config");
  const [gridSize, setGridSize] = useState(5);
  const [timeLimit, setTimeLimit] = useState(60);
  const [countdown, setCountdown] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [score, setScore] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null);

  const muted = useMuted();
  const hapticsEnabled = useHaptics();

  const isComplete = useIsComplete();
  const pipePercent = usePipePercent();
  const moveCount = useMoveCount();

  const earnTimeAttack = useEarnTimeAttack();
  const updateAchievement = useUpdateProgress();

  const { generate, puzzle, colors } = usePuzzleGenerator();

  const generatePuzzle = useCallback(async () => {
    getGameState().reset();
    const result = await generate(gridSize, gridSize, "medium");
    if (result) {
      getGameState().initPuzzle(result);
      getGameState().stopTimer();
    }
  }, [generate, gridSize]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setTimeout(() => {
        setPhase("results");

        earnTimeAttack(puzzlesSolved);
        updateAchievement("time_attack_5", puzzlesSolved);
        updateAchievement("time_attack_10", puzzlesSolved);

        const finalScore = Math.round(puzzlesSolved * difficultyMultiplier(gridSize) * 100);
        setScore(finalScore);
        saveHighScore({ puzzlesSolved, score: finalScore, gridSize, timeLimit });

        if (!muted) audio.puzzleComplete();
      }, 0);
    }
  }, [countdown, phase, puzzlesSolved, gridSize, timeLimit, earnTimeAttack, updateAchievement, muted]);

  const prevComplete = useRef(false);
  useEffect(() => {
    if (phase !== "playing") return;
    if (isComplete && !prevComplete.current) {
      prevComplete.current = true;
      if (!muted) audio.flowComplete();
      if (hapticsEnabled) haptics.flowComplete();

      setTimeout(() => {
        setPuzzlesSolved((c) => c + 1);
        prevComplete.current = false;
        generatePuzzle();
      }, 500);
    }
  }, [isComplete, phase, muted, hapticsEnabled, generatePuzzle]);

  const handleStart = useCallback(() => {
    setPuzzlesSolved(0);
    setScore(0);
    setCountdown(timeLimit);
    setPhase("playing");
    prevComplete.current = false;

    generatePuzzle();

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
  }, [timeLimit, generatePuzzle]);

  const handlePlayAgain = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPhase("config");
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  return {
    phase, gridSize, setGridSize, timeLimit, setTimeLimit,
    countdown, puzzlesSolved, score,
    puzzle, colors, pipePercent, moveCount,
    handleStart, handlePlayAgain,
  };
}
