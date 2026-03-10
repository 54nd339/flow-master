import { cloneElement, isValidElement, type ReactElement, type ReactNode, useState } from "react";
import { Home, Pause, Play, RotateCcw, X } from "lucide-react";

import { ActionButtons } from "@/components/game/action-buttons";
import { CompletionModal, type CompletionMode } from "@/components/game/completion-modal";
import { Button } from "@/components/ui/button";
import type { PuzzleData } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { getGameState, useIsComplete, useTimerRunning, useTotalCells } from "@/stores/game-store";
import { usePuzzle } from "@/stores/puzzle-store";

interface GameShellProps {
  title: ReactNode;
  stats?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  activePuzzle?: PuzzleData | null;
  sidebar?: ReactNode;
  sidebarTitle?: string;
  leftHanded?: boolean;
  isComplete?: boolean;
  isSolving?: boolean;
  completionData?: {
    timerSeconds: number;
    moveCount: number;
    starRating: number | null;
    pipePercent: number;
    onNextPuzzle: () => void;
    onPlayAgain: () => void;
    onViewSolution?: () => void;
    onDismiss: () => void;
    mode?: CompletionMode;
    onGoHome?: () => void;
    nextLabel?: string;
  };
}

export function GameShell({
  title,
  stats,
  actions,
  children,
  activePuzzle,
  sidebar,
  sidebarTitle = "Settings",
  leftHanded = false,
  isComplete = false,
  isSolving = false,
  completionData,
}: GameShellProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const storePuzzle = usePuzzle();
  const timerRunning = useTimerRunning();
  const gameIsComplete = useIsComplete();
  const totalCells = useTotalCells();
  const resetPuzzle = activePuzzle ?? storePuzzle;

  const canPause = totalCells > 0 && !gameIsComplete;

  const handleOpenPause = () => {
    if (!canPause) return;
    if (timerRunning) getGameState().pauseTimer();
    setShowPauseMenu(true);
  };

  const handleResume = () => {
    if (canPause) getGameState().resumeTimer();
    setShowPauseMenu(false);
  };

  const handleResetBoard = () => {
    if (!resetPuzzle) return;
    getGameState().initPuzzle(resetPuzzle);
    setShowPauseMenu(false);
  };

  const handleGoHome = () => {
    window.location.assign("/");
  };

  return (
    <div className={cn(
      "flex h-dvh overflow-hidden flex-col",
      leftHanded ? "lg:flex-row-reverse" : "lg:flex-row"
    )}>
      <main className="flex-1 flex flex-col items-stretch overflow-hidden bg-background relative">
        {/* Unified Top HUD */}
        <header className="relative flex shrink-0 items-center justify-between px-4 py-2 sm:py-4 min-h-12 sm:min-h-16 border-b border-border/50 lg:border-none gap-4">
          <div className="z-10 flex flex-1 items-center min-w-0">
            {title}
          </div>

          <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center md:justify-center">
            {stats}
          </div>

          <div className="z-10 flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="md:hidden">
              {/* Mobile might show stats differently or we just hide them in narrow view */}
              {/* For now, just show the actions */}
            </div>
            <ActionButtons className="hidden sm:flex" />
            {canPause && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={showPauseMenu ? handleResume : handleOpenPause}
                title={showPauseMenu ? "Resume" : "Pause"}
                className="h-8 w-8"
              >
                {showPauseMenu ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
            {actions}
          </div>
        </header>

        {/* HUD for mobile stats if needed, or we just rely on parent layout */}
        <div className="md:hidden flex shrink-0 items-center justify-center pb-2 px-4">
          {stats}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {children}
        </div>

        {showPauseMenu && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-lg">
              <h2 className="text-center text-base font-semibold text-foreground">Paused</h2>
              <Button onClick={handleResume} variant="primary" size="md" className="w-full">
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button onClick={handleResetBoard} variant="outline" size="md" className="w-full" disabled={!resetPuzzle}>
                <RotateCcw className="h-4 w-4" />
                Reset Board
              </Button>
              <Button onClick={handleGoHome} variant="outline" size="md" className="w-full">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Toggle (Floating Action Button) */}
        {sidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show ${sidebarTitle.toLowerCase()}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </main>

      {/* Constraints Pane / Sidebar */}
      {sidebar && (
        <aside
          className={cn(
            "fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex",
            "w-full lg:w-80 h-full",
            "bg-background/95 lg:bg-card/50 backdrop-blur-md lg:backdrop-blur-sm",
            "border-l border-border transition-transform duration-300 ease-in-out",
            showSidebar ? "translate-y-0" : "translate-y-full lg:translate-y-0",
            "overflow-y-auto custom-scrollbar flex flex-col"
          )}
        >
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{sidebarTitle}</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 p-4 lg:p-6">
            {/* Wrap sidebar content to handle toggle dismissal on generation */}
            {isValidElement(sidebar) ? cloneElement(sidebar as ReactElement<{
              isSolving: boolean;
              onGenerate?: (...args: unknown[]) => void;
            }>, {
              isSolving,
              onGenerate: (...args: unknown[]) => {
                const innerOnGen = (sidebar.props as { onGenerate?: (...args: unknown[]) => void }).onGenerate;
                if (innerOnGen) innerOnGen(...args);
                setShowSidebar(false);
              }
            }) : sidebar}
          </div>
        </aside>
      )}

      {/* Unified Completion Modal */}
      {isComplete && completionData && (
        <CompletionModal
          open={isComplete}
          timerSeconds={completionData.timerSeconds}
          moveCount={completionData.moveCount}
          starRating={(completionData.starRating ?? 0) as 1 | 2 | 3}
          pipePercent={completionData.pipePercent}
          onNextPuzzle={completionData.onNextPuzzle}
          onPlayAgain={completionData.onPlayAgain}
          onViewSolution={completionData.onViewSolution || (() => { })}
          onDismiss={completionData.onDismiss || (() => { })}
          mode={completionData.mode}
          onGoHome={completionData.onGoHome}
          nextLabel={completionData.nextLabel}
        />
      )}
    </div>
  );
}
