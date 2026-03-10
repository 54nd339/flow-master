"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Trophy, Zap } from "lucide-react";

import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GridCanvas } from "@/components/game/grid-canvas";
import { LoadingSpinner } from "@/components/game/loading-spinner";
import { registerAction } from "@/lib/keyboard-actions";
import { GRID_SIZES, TIME_LIMITS } from "@/lib/time-attack";
import { cn } from "@/lib/utils";
import { getPuzzleState, useShowSolution } from "@/stores/puzzle-store";
import { useTimeAttack } from "@/hooks/use-time-attack";

export default function TimeAttackPage() {
  const {
    phase, gridSize, setGridSize, timeLimit, setTimeLimit,
    countdown, puzzlesSolved, score,
    puzzle, colors, pipePercent, moveCount,
    handleStart, handlePlayAgain,
  } = useTimeAttack();
  const showSolution = useShowSolution();

  useEffect(() => {
    const cleanups = [
      registerAction("reset", () => { /* no-op in time-attack */ }),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
    ];
    return () => cleanups.forEach((c) => c());
  }, []);

  if (phase === "config") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 lg:p-8">
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <Zap className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Time Attack</h1>
            <p className="text-sm text-muted-foreground">Solve as many as you can before time runs out</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grid Size</span>
              <div className="flex gap-2">
                {GRID_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setGridSize(s)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      gridSize === s
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Limit</span>
              <div className="flex gap-2">
                {TIME_LIMITS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTimeLimit(t.value)}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      timeLimit === t.value
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="rounded-xl bg-red-500 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start Time Attack
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4 lg:p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10">
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Time&apos;s Up!</h1>
          <p className="text-sm text-muted-foreground">
            {gridSize}&times;{gridSize} &middot; {timeLimit}s
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted p-4">
            <span className="text-2xl font-bold text-foreground">{puzzlesSolved}</span>
            <span className="text-xs text-muted-foreground">Puzzles Solved</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted p-4">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStart}
            className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Play Again
          </button>
          <button
            onClick={handlePlayAgain}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Change Settings
          </button>
        </div>
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
            <Zap className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">Time Attack</span>
          </Link>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              {gridSize}&times;{gridSize} Mode
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {puzzlesSolved} solved &middot; {timeLimit}s limit
            </p>
          </div>
        </div>
      }
      stats={
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold",
            countdown <= 10
              ? "bg-red-500/10 text-red-500 animate-pulse ring-1 ring-red-500/20"
              : "bg-muted text-foreground",
          )}>
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {puzzle && (
            <GameStats
              pipePercent={pipePercent}
              moveCount={moveCount}
            />
          )}
        </div>
      }
    >
      {puzzle ? (
        <GridCanvas
          puzzle={puzzle}
          colors={colors}
          showSolution={showSolution}
          className="w-full h-full"
        />
      ) : (
        <LoadingSpinner message="Loading next puzzle..." />
      )}
    </GameShell>
  );
}
