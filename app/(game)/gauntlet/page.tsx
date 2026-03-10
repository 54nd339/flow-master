"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Shield, Trophy } from "lucide-react";

import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GenFailed } from "@/components/game/gen-failed";
import { GridCanvas } from "@/components/game/grid-canvas";
import { LoadingSpinner } from "@/components/game/loading-spinner";
import { registerAction } from "@/lib/keyboard-actions";
import { formatTime } from "@/lib/utils";
import { usePipePercent } from "@/stores/game-store";
import { getPuzzleState, useShowSolution } from "@/stores/puzzle-store";
import { GAUNTLET_STAGES, useGauntlet } from "@/hooks/use-gauntlet";

export default function GauntletPage() {
  const {
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
  } = useGauntlet();

  const pipePercent = usePipePercent();
  const showSolution = useShowSolution();

  useEffect(() => {
    const cleanups = [
      registerAction("reset", () => { /* no-op in gauntlet */ }),
      registerAction("nextPuzzle", handleNextStage),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
    ];
    return () => cleanups.forEach((c) => c());
  }, [handleNextStage]);

  if (alreadyAttempted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-400/10">
          <Shield className="h-8 w-8 text-orange-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Gauntlet Attempted
        </h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve already attempted today&apos;s gauntlet. Come back tomorrow!
        </p>
        <Link
          href="/"
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (gauntletComplete) {
    const totalTime = stageTimes.reduce((a, b) => a + b, 0);
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10">
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Gauntlet Complete!
        </h1>
        <p className="text-sm text-muted-foreground">
          Total time: {formatTime(totalTime)}
        </p>
        <div className="flex flex-col gap-2 text-sm">
          {stageTimes.map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-muted-foreground">
              <span className="w-24 text-left">
                Stage {i + 1} ({GAUNTLET_STAGES[i].size}x{GAUNTLET_STAGES[i].size})
              </span>
              <span className="font-mono">{formatTime(t)}</span>
            </div>
          ))}
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

  const stage = GAUNTLET_STAGES[stageIndex];
  const totalElapsed = stageTimes.reduce((a, b) => a + b, 0);

  return (
    <GameShell
      activePuzzle={puzzle}
      title={
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Shield className="h-4 w-4 text-orange-400" />
            <span className="hidden sm:inline">Daily Gauntlet</span>
          </Link>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="text-sm font-bold tracking-tight text-foreground line-clamp-1">
                Stage {stageIndex + 1}/5
              </h1>
              <div className="flex items-center gap-1">
                {GAUNTLET_STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-full transition-colors ${i < stageIndex
                      ? "bg-green-500"
                      : i === stageIndex
                        ? "bg-blue-500"
                        : "bg-muted"
                      }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none">
              {stage.size}&times;{stage.size} &middot; {stage.difficulty}
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
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Total: {formatTime(totalElapsed + timerSeconds)}
              </span>
            }
          />
        ) : null
      }
      isComplete={isComplete}
      completionData={puzzle && starRating && isComplete && !gauntletComplete && stageIndex === GAUNTLET_STAGES.length - 1 ? {
        timerSeconds,
        moveCount,
        starRating: starRating as number,
        pipePercent,
        onNextPuzzle: handleNextStage,
        onPlayAgain: () => { },
        onViewSolution: () => { },
        onDismiss: () => { },
        mode: "gauntlet",
      } : undefined}
    >
      {isGenerating && !puzzle && (
        <LoadingSpinner message="Generating puzzle..." />
      )}

      {genFailed && !puzzle && (
        <GenFailed
          icon={Shield}
          message="Failed to generate puzzle"
          detail="The gauntlet run depends on a stable connection."
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

