"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";

import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GenFailed } from "@/components/game/gen-failed";
import { GridCanvas } from "@/components/game/grid-canvas";
import { LoadingSpinner } from "@/components/game/loading-spinner";
import { registerAction } from "@/lib/keyboard-actions";
import { getGameState, usePipePercent } from "@/stores/game-store";
import { getPuzzleState, useShowSolution } from "@/stores/puzzle-store";
import { useDaily } from "@/hooks/use-daily";
import { useHint } from "@/hooks/use-hint";

export default function DailyPage() {
  const {
    puzzle,
    colors,
    isGenerating,
    timerSeconds,
    isComplete,
    moveCount,
    starRating,
    alreadyCompleted,
    genFailed,
    currentStreak,
    longestStreak,
    todayStr,
    handleRetry,
  } = useDaily();

  const pipePercent = usePipePercent();
  const showSolution = useShowSolution();
  const hint = useHint();

  const handlePlayAgain = useCallback(() => {
    if (puzzle) {
      getGameState().initPuzzle(puzzle);
    }
  }, [puzzle]);

  const handleViewSolution = useCallback(() => {
    getPuzzleState().toggleSolution();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.assign("/");
  }, []);

  useEffect(() => {
    const cleanups = [
      registerAction("reset", handlePlayAgain),
      registerAction("playAgain", handlePlayAgain),
      registerAction("nextPuzzle", handleGoHome),
      registerAction("hint", hint),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
    ];
    return () => cleanups.forEach((c) => c());
  }, [handlePlayAgain, handleGoHome, hint]);

  const gridSize = puzzle?.width ?? 0;

  if (alreadyCompleted && !puzzle) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10">
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Daily Complete!
        </h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve already completed today&apos;s challenge. Come back tomorrow!
        </p>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-xl font-bold text-foreground">{currentStreak}</span>
            </div>
            <span className="text-xs text-muted-foreground">Current Streak</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold text-foreground">{longestStreak}</span>
            <span className="text-xs text-muted-foreground">Longest Streak</span>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <GameShell
      activePuzzle={puzzle}
      title={
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="hidden sm:inline">Daily Challenge</span>
          </Link>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              {todayStr}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {gridSize}&times;{gridSize} &middot; Daily
            </p>
          </div>
        </div>
      }
      stats={
        puzzle ? (
          <GameStats
            timerSeconds={timerSeconds}
            pipePercent={pipePercent}
            moveCount={moveCount}
            extra={
              <div className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>{currentStreak}</span>
              </div>
            }
          />
        ) : null
      }
      isComplete={isComplete}
      completionData={puzzle && starRating ? {
        timerSeconds,
        moveCount,
        starRating: starRating as number,
        pipePercent,
        onNextPuzzle: handlePlayAgain,
        onPlayAgain: handlePlayAgain,
        onViewSolution: handleViewSolution,
        onDismiss: () => { },
        mode: "daily",
        onGoHome: handleGoHome,
      } : undefined}
    >
      {isGenerating && (
        <LoadingSpinner message="Generating daily puzzle..." />
      )}

      {genFailed && !puzzle && (
        <GenFailed
          icon={Trophy}
          message="Failed to generate puzzle"
          detail="Please check your connection and try again."
          onRetry={handleRetry}
        />
      )}

      {puzzle && (
        <GridCanvas
          puzzle={puzzle}
          colors={colors}
          showSolution={showSolution}
          className="w-full h-full"
        />
      )}
    </GameShell>
  );
}

