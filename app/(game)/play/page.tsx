"use client";

import { useEffect } from "react";

import { ControlsPanel } from "@/components/game/controls-panel";
import { EmptyState } from "@/components/game/empty-state";
import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GridCanvas } from "@/components/game/grid-canvas";
import { RankBadge } from "@/components/game/rank-badge";
import { registerAction } from "@/lib/keyboard-actions";
import { getPuzzleState } from "@/stores/puzzle-store";
import { useGamePersistence } from "@/hooks/use-game-persistence";
import { useHint } from "@/hooks/use-hint";
import { usePlayGame } from "@/hooks/use-play-game";
import { useWatchSolve } from "@/hooks/use-watch-solve";

export default function PlayPage() {
  const game = usePlayGame();
  const hint = useHint();
  const { watchSolveFlows, isSolving } = useWatchSolve(game.puzzle);
  useGamePersistence(game.puzzle, game.colors);

  const {
    handleGenerate, handleReset, handlePlayAgain, handleNextPuzzle,
    handleSetGridSize, handleGridSizeIncrement, handleSharePuzzle, handleCopySeed,
  } = game;

  useEffect(() => {
    const cleanups = [
      registerAction("generate", handleGenerate),
      registerAction("reset", handleReset),
      registerAction("playAgain", handlePlayAgain),
      registerAction("nextPuzzle", handleNextPuzzle),
      registerAction("hint", hint),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
      registerAction("setGridSize", (size: unknown) => handleSetGridSize(size as number)),
      registerAction("gridSizeIncrement", (delta: unknown) => handleGridSizeIncrement(delta as number)),
      registerAction("sharePuzzle", handleSharePuzzle),
      registerAction("copySeed", handleCopySeed),
    ];
    return () => cleanups.forEach((c) => c());
  }, [handleGenerate, handleReset, handlePlayAgain, handleNextPuzzle, hint, handleSetGridSize, handleGridSizeIncrement, handleSharePuzzle, handleCopySeed]);

  return (
    <GameShell
      activePuzzle={game.puzzle}
      leftHanded={game.leftHanded}
      title={
        game.puzzle && !game.minimalHud ? (
          <div className="scale-90 sm:scale-100">
            <RankBadge xp={game.totalXP} size="sm" />
          </div>
        ) : null
      }
      stats={
        game.puzzle ? (
          <GameStats
            timerSeconds={game.timerSeconds}
            pipePercent={game.pipePercent}
            moveCount={game.moveCount}
            minimalHud={game.minimalHud}
          />
        ) : null
      }
      sidebar={<ControlsPanel {...game.controlsPanelProps} isSolving={isSolving} />}
      isComplete={game.isComplete}
      isSolving={isSolving}
      completionData={game.puzzle && game.starRating ? {
        timerSeconds: game.timerSeconds,
        moveCount: game.moveCount,
        starRating: game.starRating as number,
        pipePercent: game.pipePercent,
        onNextPuzzle: game.handleNextPuzzle,
        onPlayAgain: game.handlePlayAgain,
        onViewSolution: game.handleViewSolution,
        onDismiss: game.handleDismissModal,
      } : undefined}
    >
      {game.puzzle ? (
        <GridCanvas
          puzzle={game.puzzle}
          colors={game.colors}
          showSolution={game.showSolution}
          resetZoomCounter={game.resetZoomCounter}
          ghostFlows={game.ghostFlows}
          watchSolveFlows={watchSolveFlows}
          className="w-full h-full"
        />
      ) : (
        <EmptyState />
      )}
    </GameShell >
  );
}
