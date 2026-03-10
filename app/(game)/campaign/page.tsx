"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Lock, SkipForward } from "lucide-react";

import { GameShell } from "@/components/game/game-shell";
import { GameStats } from "@/components/game/game-stats";
import { GenFailed } from "@/components/game/gen-failed";
import { GridCanvas } from "@/components/game/grid-canvas";
import { LoadingSpinner } from "@/components/game/loading-spinner";
import type { CampaignArea } from "@/lib/campaign";
import { CAMPAIGN_GROUPS, LEVELS_PER_AREA } from "@/lib/campaign";
import { registerAction } from "@/lib/keyboard-actions";
import { getThemeById } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { getPuzzleState, useShowSolution } from "@/stores/puzzle-store";
import { useGameThemeId } from "@/stores/settings-store";
import { useCampaignGame } from "@/hooks/use-campaign-game";
import { useHint } from "@/hooks/use-hint";

function AreaRow({
  area,
  history,
  unlocked,
  expanded,
  onToggle,
  onPlayLevel,
}: {
  area: CampaignArea
  history: string[]
  unlocked: boolean
  expanded: boolean
  onToggle: () => void
  onPlayLevel: (areaId: number, levelIdx: number) => void
}) {
  const completed = history.length >= LEVELS_PER_AREA;
  const nextLevel = Math.min(history.length, LEVELS_PER_AREA - 1);

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        disabled={!unlocked}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-all",
          unlocked
            ? "hover:bg-muted/50 cursor-pointer"
            : "opacity-50 cursor-not-allowed",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
            completed
              ? "bg-green-500/10 text-green-500"
              : unlocked
                ? "bg-accent/10 text-accent-foreground"
                : "bg-muted text-muted-foreground",
          )}
        >
          {unlocked ? area.id : <Lock className="h-3.5 w-3.5" />}
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-foreground">
            Area {area.id}
          </span>
          <span className="text-xs text-muted-foreground">
            {area.w}&times;{area.h} &middot; {history.length}/{LEVELS_PER_AREA}
          </span>
        </div>
        {unlocked && (
          expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && unlocked && (
        <div className="border-t border-border/50 px-4 py-3">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: LEVELS_PER_AREA }, (_, i) => {
              const solved = i < history.length;
              const isCurrent = i === nextLevel && !completed;
              const isLocked = i > history.length;

              return (
                <button
                  key={i}
                  disabled={isLocked}
                  onClick={() => onPlayLevel(area.id, i)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    solved && "bg-green-500/10 text-green-600 dark:text-green-400",
                    isCurrent && "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/50",
                    isLocked && "bg-muted/30 text-muted-foreground/40 cursor-not-allowed",
                    !solved && !isCurrent && !isLocked && "bg-muted/50 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignPage() {
  const {
    view,
    activeArea,
    activeLevel,
    genFailed,
    timerSeconds,
    isComplete,
    moveCount,
    pipePercent,
    starRating,
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
  } = useCampaignGame();

  const gameThemeId = useGameThemeId();
  const theme = getThemeById(gameThemeId);
  const showSolution = useShowSolution();
  const hint = useHint();
  const [expandedArea, setExpandedArea] = useState<number | null>(null);

  useEffect(() => {
    const cleanups = [
      registerAction("reset", handlePlayAgain),
      registerAction("playAgain", handlePlayAgain),
      registerAction("nextPuzzle", handleNextLevel),
      registerAction("hint", hint),
      registerAction("resetZoom", () => getPuzzleState().incrementResetZoom()),
    ];
    return () => cleanups.forEach((c) => c());
  }, [handlePlayAgain, handleNextLevel, hint]);

  if (view === "select") {
    return (
      <div className="flex min-h-dvh flex-col items-center p-4 lg:p-8">
        <div className="mb-6 flex w-full max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="text-sm text-muted-foreground">
            Max area: {maxArea}/25
          </span>
        </div>

        <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
          Campaign
        </h1>

        <div className="flex w-full max-w-2xl flex-col gap-6">
          {CAMPAIGN_GROUPS.map((group, groupIdx) => {
            const rank = theme?.ranks[groupIdx];
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5",
                  rank ? `bg-gradient-to-r ${rank.color} text-white` : "bg-muted",
                )}>
                  {rank && <rank.icon className="h-5 w-5" />}
                  <span className="text-sm font-semibold">
                    {rank?.name ?? `Group ${group.id}`}
                  </span>
                  <span className="ml-auto text-xs opacity-80">
                    Areas {group.areas[0].id}–{group.areas[group.areas.length - 1].id}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pl-2">
                  {group.areas.map((area) => (
                    <AreaRow
                      key={area.id}
                      area={area}
                      history={getAreaHistory(area.id)}
                      unlocked={isAreaUnlocked(area.id)}
                      expanded={expandedArea === area.id}
                      onToggle={() =>
                        setExpandedArea(expandedArea === area.id ? null : area.id)
                      }
                      onPlayLevel={handlePlayLevel}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <GameShell
      activePuzzle={puzzle}
      title={
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </button>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              Area {activeArea?.id} – Level {activeLevel + 1}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {activeArea?.w}&times;{activeArea?.h}
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
          />
        ) : null
      }
      actions={
        <div className="flex items-center gap-2">
          {activeArea && balance >= 50 && !isComplete && (
            <button
              onClick={handleSkipArea}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Skip Area (50)</span>
              <span className="sm:hidden">50</span>
            </button>
          )}
        </div>
      }
      isComplete={isComplete}
      completionData={puzzle && starRating ? {
        timerSeconds,
        moveCount,
        starRating: starRating as number,
        pipePercent,
        onNextPuzzle: handleNextLevel,
        onPlayAgain: handlePlayAgain,
        onDismiss: () => { },
        mode: "campaign",
        nextLabel: "Next Level",
      } : undefined}
    >
      {isGenerating && !puzzle && (
        <LoadingSpinner message="Generating level..." />
      )}

      {genFailed && !puzzle && !isGenerating && (
        <GenFailed
          icon={Lock}
          message="Failed to generate puzzle"
          detail="This area might be temporarily unavailable."
          onRetry={() => activeArea && handlePlayLevel(activeArea.id, activeLevel)}
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
