"use client";

import { useMemo, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Eye, Home, RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { useSaveData } from "@/hooks/use-save-data";

const COMPLETION_MESSAGES = [
  "Puzzle Complete!",
  "Nailed it!",
  "Brilliant solve!",
  "Flow master!",
  "Perfectly connected!",
  "Smooth moves!",
  "You crushed it!",
  "Outstanding!",
  "Flawless flow!",
  "Excellent work!",
  "Grid conquered!",
  "Connections made!",
  "All paths clear!",
  "Well played!",
  "Masterful!",
  "Pure genius!",
  "Every cell filled!",
  "Solved like a pro!",
  "Impressive!",
  "Clean sweep!",
  "Puzzle obliterated!",
  "That was beautiful!",
];

export type CompletionMode = "play" | "daily" | "gauntlet" | "campaign";

interface CompletionModalProps {
  open: boolean
  timerSeconds: number
  moveCount: number
  starRating: 1 | 2 | 3
  pipePercent: number
  onNextPuzzle: () => void
  onPlayAgain: () => void
  onViewSolution: () => void
  onDismiss: () => void
  mode?: CompletionMode
  onGoHome?: () => void
  nextLabel?: string
}

function StarDisplay({ rating, saveData }: { rating: 1 | 2 | 3, saveData: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cn(
            "h-8 w-8 transition-all duration-300 delay-[var(--star-delay)]",
            i <= rating
              ? "scale-100 fill-yellow-400 text-yellow-400"
              : "scale-90 fill-muted text-muted",
          )}
          style={{ "--star-delay": saveData ? "0ms" : `${i * 150}ms` } as React.CSSProperties}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function CompletionModal({
  open,
  timerSeconds,
  moveCount,
  starRating,
  pipePercent,
  onNextPuzzle,
  onPlayAgain,
  onViewSolution,
  onDismiss,
  mode = "play",
  onGoHome,
  nextLabel,
}: CompletionModalProps) {
  const saveData = useSaveData();
  const openCountRef = useRef(0);
  if (open) openCountRef.current++;

  const message = useMemo(
    () => COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openCountRef.current],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-background p-0 shadow-2xl",
            "data-[state=open]:animate-[modal-in_300ms_ease-out]",
          )}
        >
          <div className="flex flex-col items-center gap-6 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10">
              <Trophy className="h-8 w-8 text-yellow-400" aria-hidden="true" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <Dialog.Title className="text-xl font-semibold tracking-tight text-foreground">
                {message}
              </Dialog.Title>
              <StarDisplay rating={starRating} saveData={saveData} />
            </div>

            <div className="grid w-full grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted p-3">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-xs text-muted-foreground">Time</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted p-3">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {moveCount}
                </span>
                <span className="text-xs text-muted-foreground">Moves</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-muted p-3">
                <span className="font-mono text-lg font-semibold text-foreground">
                  {pipePercent}%
                </span>
                <span className="text-xs text-muted-foreground">Fill</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2">
              {mode !== "daily" && (
                <Button onClick={onNextPuzzle} variant="primary" size="md" className="w-full">
                  <ArrowRight className="h-4 w-4" />
                  {nextLabel ?? "Next Puzzle"}
                </Button>
              )}
              {mode === "daily" && onGoHome && (
                <Button onClick={onGoHome} variant="primary" size="md" className="w-full">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              )}
              <div className="flex gap-2">
                <Button onClick={onPlayAgain} variant="secondary" size="md" className="flex-1">
                  <RotateCcw className="h-4 w-4" />
                  Replay
                </Button>
                <Button onClick={onViewSolution} variant="secondary" size="md" className="flex-1">
                  <Eye className="h-4 w-4" />
                  Solution
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
