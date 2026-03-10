"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { audio } from "@/lib/audio";
import { getHintFlow } from "@/lib/engine/game-logic";
import { createPRNG } from "@/lib/engine/prng";
import type { Point } from "@/lib/engine/types";
import { loadPBGhost, ReplayRecorder } from "@/lib/replay";
import { exportSaveData, importSaveData } from "@/lib/save-data";
import { encodePuzzle, puzzleToQueryParams } from "@/lib/serialization";
import { useIncrementProgress, useUnlockDirectly, useUpdateProgress } from "@/stores/achievement-store";
import { useAddXP, useCanPrestige, usePrestige, useTotalXP } from "@/stores/campaign-store";
import { getCurrencyState, useBalance, useCanAfford, useEarnLevelComplete, useEarnPerfectClear, useSpendHint, useSpendSkip } from "@/stores/currency-store";
import { getGameState, subscribeToGameStore, useActiveFlowId, useCurrentFlows, useIsComplete, useMoveCount, usePipePercent, useStarRating, useTimerRunning, useTimerSeconds } from "@/stores/game-store";
import { useAddEntry } from "@/stores/history-store";
import { getPuzzleState, useResetZoomCounter, useShowSolution, useToggleSolution } from "@/stores/puzzle-store";
import { useSubmitResult } from "@/stores/records-store";
import { useAutoScale, useColorblindMode, useDifficulty, useGridHeight, useGridWidth, useHaptics, useHighContrast, useLeftHanded, useMinimalHud, useMuted, useReducedMotion, useSetDifficulty, useSetGridSize, useToggleColorblind, useToggleHighContrast, useToggleLeftHanded, useToggleMinimalHud, useToggleMuted, useToggleReducedMotion } from "@/stores/settings-store";
import { useCompletionRewards } from "@/hooks/use-completion-rewards";
import { usePuzzleGenerator } from "@/hooks/use-puzzle-generator";
import { useTimerTick } from "@/hooks/use-timer-tick";

export function usePlayGame(options?: { effectsEnabled?: boolean }) {
  const effectsEnabled = options?.effectsEnabled ?? true;
  const router = useMemo(() => ({ push: (path: string) => window.location.assign(path) }), []);

  const gridWidth = useGridWidth();
  const gridHeight = useGridHeight();
  const difficulty = useDifficulty();
  const setGridSize = useSetGridSize();
  const setDifficulty = useSetDifficulty();
  const muted = useMuted();
  const toggleMuted = useToggleMuted();
  const minimalHud = useMinimalHud();
  const toggleMinimalHud = useToggleMinimalHud();
  const hapticsEnabled = useHaptics();
  const autoScale = useAutoScale();
  const highContrast = useHighContrast();
  const toggleHighContrast = useToggleHighContrast();
  const leftHanded = useLeftHanded();
  const toggleLeftHanded = useToggleLeftHanded();
  const colorblindMode = useColorblindMode();
  const toggleColorblind = useToggleColorblind();
  const reducedMotion = useReducedMotion();
  const toggleReducedMotion = useToggleReducedMotion();

  const timerSeconds = useTimerSeconds();
  const timerRunning = useTimerRunning();
  const isComplete = useIsComplete();
  const moveCount = useMoveCount();
  const pipePercent = usePipePercent();
  const starRating = useStarRating();
  const activeFlowId = useActiveFlowId();
  const currentFlows = useCurrentFlows();
  const resetZoomCounter = useResetZoomCounter();

  const addHistoryEntry = useAddEntry();
  const showSolution = useShowSolution();
  const toggleSolution = useToggleSolution();
  const submitResult = useSubmitResult();
  const currencyBalance = useBalance();
  const earnLevelComplete = useEarnLevelComplete();
  const earnPerfectClear = useEarnPerfectClear();
  const spendHint = useSpendHint();
  const spendSkip = useSpendSkip();
  const canAfford = useCanAfford();
  const incrementAchievement = useIncrementProgress();
  const updateAchievement = useUpdateProgress();
  const unlockAchievement = useUnlockDirectly();
  const addXP = useAddXP();
  const totalXP = useTotalXP();
  const canPrestige = useCanPrestige();
  const prestige = usePrestige();

  const { generate, cancel, preGenerate, consumePreGenerated, isGenerating, generationTimeMs, puzzle, colors } =
    usePuzzleGenerator();

  const [retroUnlocked, setRetroUnlocked] = useState(false);
  const [ghostFlows, setGhostFlows] = useState<Map<string, Point[]> | null>(null);

  const replayRecorderRef = useRef(new ReplayRecorder());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useTimerTick();

  useEffect(() => {
    if (!effectsEnabled) return;
    return subscribeToGameStore((state, prev) => {
      if (state.moveHistory.length > prev.moveHistory.length) {
        const newest = state.moveHistory[state.moveHistory.length - 1];
        replayRecorderRef.current.record(newest);
      }
    });
  }, [effectsEnabled]);

  useEffect(() => {
    if (!effectsEnabled) return;
    if (timerRunning && !isComplete) {
      navigator.wakeLock?.request("screen").then((wl) => {
        wakeLockRef.current = wl;
      }).catch((err) => console.warn("Wake lock request failed:", err));
    } else {
      wakeLockRef.current?.release().catch(() => { });
      wakeLockRef.current = null;
    }
    return () => { wakeLockRef.current?.release().catch(() => { }); };
  }, [effectsEnabled, timerRunning, isComplete]);

  useCompletionRewards({
    enabled: effectsEnabled,
    isComplete, starRating, puzzle, difficulty,
    timerSeconds, moveCount, muted, hapticsEnabled, autoScale,
    submitResult, addHistoryEntry, earnLevelComplete, earnPerfectClear,
    incrementAchievement, updateAchievement, addXP, replayRecorderRef,
  });

  useEffect(() => {
    if (!effectsEnabled) return;
    if (puzzle && !isGenerating) {
      const timer = setTimeout(() => preGenerate(gridWidth, gridHeight, difficulty), 1000);
      return () => clearTimeout(timer);
    }
  }, [effectsEnabled, puzzle, isGenerating, preGenerate, gridWidth, gridHeight, difficulty]);

  useEffect(() => {
    if (!effectsEnabled) return;
    if (puzzle) {
      const qs = puzzleToQueryParams(puzzle, difficulty);
      window.history.replaceState(null, "", `/play?${qs}`);
    }
  }, [effectsEnabled, puzzle, difficulty]);

  useEffect(() => {
    if (!effectsEnabled) return;
    try {
      const unlocked = localStorage.getItem("flow-master-retro-unlocked");
      if (unlocked === "true") setTimeout(() => setRetroUnlocked(true), 0);
    } catch (err) { console.warn("Failed to read retro unlock state:", err); }
  }, [effectsEnabled]);

  const handleGenerate = useCallback(async () => {
    getGameState().reset();
    setGhostFlows(null);
    const result = await generate(gridWidth, gridHeight, difficulty);
    if (result) {
      getGameState().initPuzzle(result);
      replayRecorderRef.current.start();
      toast.success(`${result.width}×${result.height} ${difficulty} puzzle — ${result.endpoints.length / 2} pairs`);
      loadPBGhost(gridWidth, gridHeight, difficulty).then((ghost) => {
        if (ghost) { /* ghostStartTimeRef would be set here */ }
      });
    }
  }, [generate, gridWidth, gridHeight, difficulty]);

  const handleNextPuzzle = useCallback(async () => {
    getGameState().reset();
    const pre = consumePreGenerated();
    if (pre) {
      getGameState().initPuzzle(pre.puzzle);
      toast.success(`${pre.puzzle.width}×${pre.puzzle.height} ${difficulty} puzzle — ${pre.puzzle.endpoints.length / 2} pairs`);
      return;
    }
    const result = await generate(gridWidth, gridHeight, difficulty);
    if (result) getGameState().initPuzzle(result);
  }, [generate, consumePreGenerated, gridWidth, gridHeight, difficulty]);

  const handlePlayAgain = useCallback(() => {
    if (puzzle) getGameState().initPuzzle(puzzle);
  }, [puzzle]);

  const handleGridSizeChange = useCallback(
    (w: number, h: number) => setGridSize(Math.max(5, Math.min(50, w)), Math.max(5, Math.min(50, h))),
    [setGridSize],
  );
  const handleSetGridSize = useCallback(
    (size: number) => handleGridSizeChange(size, size),
    [handleGridSizeChange],
  );
  const handleGridSizeIncrement = useCallback(
    (delta: number) => handleGridSizeChange(gridWidth + delta, gridHeight + delta),
    [gridWidth, gridHeight, handleGridSizeChange],
  );

  const handleReset = useCallback(() => {
    if (puzzle) getGameState().initPuzzle(puzzle);
    else {
      cancel();
      getPuzzleState().clearPuzzle();
      getGameState().reset();
    }
  }, [cancel, puzzle]);

  const handleUndo = useCallback(() => {
    const state = getGameState();
    if (state.moveHistory.length > 0) {
      const undone = state.moveHistory[state.moveHistory.length - 1];
      replayRecorderRef.current.record({ type: "erase", flowId: undone.flowId, path: [] });
    }
    state.undo();
    if (!muted) audio.undo();
  }, [muted]);

  const handleRedo = useCallback(() => {
    if (puzzle) getGameState().redo();
  }, [puzzle]);

  const handleClearFlow = useCallback(() => {
    if (activeFlowId) {
      replayRecorderRef.current.record({ type: "erase", flowId: activeFlowId, path: [] });
      getGameState().clearFlow(activeFlowId);
    }
  }, [activeFlowId]);

  const handleToggleTimer = useCallback(() => {
    const s = getGameState();
    if (s.timerRunning) s.pauseTimer();
    else s.resumeTimer();
  }, []);

  const handleShowSeed = useCallback(() => {
    if (puzzle) {
      toast.info(`Seed: ${puzzle.seed ?? "random"} — Generated at ${new Date(puzzle.generatedAt).toLocaleTimeString()}`, { duration: 5000 });
    }
  }, [puzzle]);

  const handleSharePuzzle = useCallback(() => {
    if (!puzzle) return;
    const encoded = encodePuzzle(puzzle);
    const url = `${window.location.origin}/play#puzzle=${encoded}`;
    if (navigator.share) {
      navigator.share({ title: "FlowMaster Puzzle", url }).catch(() => { });
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Puzzle URL copied to clipboard!"))
        .catch((err) => { toast.error("Copy failed"); console.warn("Clipboard write failed:", err); });
    }
  }, [puzzle]);

  const handleCopySeed = useCallback(() => {
    if (!puzzle) return;
    const text = `Seed: ${puzzle.seed ?? "N/A"} | ${puzzle.width}x${puzzle.height} ${difficulty}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Seed copied to clipboard!"))
      .catch((err) => { toast.error("Copy failed"); console.warn("Clipboard write failed:", err); });
  }, [puzzle, difficulty]);

  const handleExportSaveData = useCallback(async () => {
    try {
      const json = await exportSaveData();
      await navigator.clipboard.writeText(json);
      toast.success("Save data copied to clipboard!");
    } catch { toast.error("Failed to export save data"); }
  }, []);

  const handleImportSaveData = useCallback(async () => {
    try {
      const json = await navigator.clipboard.readText();
      const ok = await importSaveData(json);
      if (ok) { toast.success("Save data imported! Refreshing..."); setTimeout(() => window.location.reload(), 1000); }
      else toast.error("Invalid save data format");
    } catch { toast.error("Failed to read clipboard — paste manually"); }
  }, []);

  const handleResetZoom = useCallback(() => getPuzzleState().incrementResetZoom(), []);

  const handleHint = useCallback(() => {
    if (!puzzle) { toast.error("No puzzle loaded"); return; }
    if (isComplete) return;
    if (!canAfford(25)) { toast.error("Not enough flows! Need 25 for a hint."); return; }

    const solvedFlowIds = new Set<string>();
    for (const [flowId, path] of currentFlows) {
      const eps = puzzle.endpoints.filter((ep) => ep.flowId === flowId);
      if (eps.length === 2 && path.length >= 2) {
        const first = path[0];
        const last = path[path.length - 1];
        const matchA = (first.x === eps[0].x && first.y === eps[0].y && last.x === eps[1].x && last.y === eps[1].y);
        const matchB = (first.x === eps[1].x && first.y === eps[1].y && last.x === eps[0].x && last.y === eps[0].y);
        if (matchA || matchB) solvedFlowIds.add(flowId);
      }
    }

    const hint = getHintFlow(puzzle, solvedFlowIds, createPRNG());
    if (!hint) { toast.info("All flows already solved!"); return; }
    if (spendHint()) {
      getGameState().pushAction({ type: "draw", flowId: hint.flowId, path: hint.path }, puzzle);
      toast.success("Hint applied! One flow revealed.", { duration: 3000 });
    }
  }, [puzzle, isComplete, canAfford, currentFlows, spendHint]);

  const handleSkipPuzzle = useCallback(async () => {
    if (!canAfford(50)) { toast.error("Not enough flows! Need 50 to skip."); return; }
    if (spendSkip()) { toast.info("Puzzle skipped!", { duration: 2000 }); await handleNextPuzzle(); }
  }, [canAfford, spendSkip, handleNextPuzzle]);

  const handleKonamiCode = useCallback(() => {
    if (!retroUnlocked) {
      setRetroUnlocked(true);
      localStorage.setItem("flow-master-retro-unlocked", "true");
      const wasNew = unlockAchievement("old_school");
      if (wasNew) getCurrencyState().earn(100);
      toast.success("Retro theme unlocked! Check the themes menu.", { duration: 5000 });
    } else {
      toast.info("Retro theme already unlocked!");
    }
  }, [retroUnlocked, unlockAchievement]);

  const handleExportProfileCard = useCallback(() => { router.push("/stats"); }, [router]);
  const handleViewRanks = useCallback(() => { router.push("/stats"); }, [router]);
  const handleDismissModal = useCallback(() => { }, []);
  const handleViewSolution = useCallback(() => getPuzzleState().toggleSolution(), []);

  const controlsPanelProps = useMemo(() => ({
    gridWidth,
    gridHeight,
    difficulty,
    onGridSizeChange: handleGridSizeChange,
    onDifficultyChange: setDifficulty,
    onGenerate: handleGenerate,
    onCancel: cancel,
    onToggleSolution: handleViewSolution,
    isGenerating,
    showSolution,
    generationTimeMs,
    pairCount: puzzle ? puzzle.endpoints.length / 2 : 0,
  }), [
    gridWidth, gridHeight, difficulty, handleGridSizeChange, setDifficulty,
    handleGenerate, cancel, handleViewSolution, isGenerating, showSolution,
    generationTimeMs, puzzle
  ]);

  const handlePrestige = useCallback(() => {
    if (canPrestige()) {
      const didPrestige = prestige();
      if (didPrestige) {
        updateAchievement("prestige_1", 1);
        toast.success("Prestige activated! Campaign reset. Your currency and achievements are safe.", { duration: 5000 });
      }
    } else {
      toast.error("Complete all 25 campaign stages to prestige.");
    }
  }, [canPrestige, prestige, updateAchievement]);

  return {
    puzzle, colors, isGenerating, generationTimeMs,
    timerSeconds, timerRunning, isComplete, moveCount, pipePercent, starRating,
    showSolution, difficulty, gridWidth, gridHeight,
    controlsPanelProps,
    muted, minimalHud, highContrast, leftHanded, colorblindMode, reducedMotion,
    currencyBalance, totalXP, ghostFlows, retroUnlocked,
    resetZoomCounter, activeFlowId,
    canPrestige,
    handleGenerate, handleNextPuzzle, handlePlayAgain,
    handleGridSizeChange, handleSetGridSize, handleGridSizeIncrement,
    handleReset, handleUndo, handleRedo, handleClearFlow, handleToggleTimer,
    handleShowSeed, handleSharePuzzle, handleCopySeed,
    handleExportSaveData, handleImportSaveData,
    handleResetZoom, handleHint, handleSkipPuzzle,
    handleKonamiCode,
    handleExportProfileCard, handleViewRanks, handlePrestige,
    handleDismissModal, handleViewSolution,
    toggleSolution, toggleMuted, toggleMinimalHud,
    toggleHighContrast, toggleLeftHanded, toggleColorblind, toggleReducedMotion,
    setDifficulty, cancel,
  };
}
