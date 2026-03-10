"use client";

import { useCallback } from "react";
import { Redo2, RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fireAction } from "@/lib/keyboard-actions";
import { cn } from "@/lib/utils";
import { getGameState } from "@/stores/game-store";
import { usePuzzle } from "@/stores/puzzle-store";

interface ActionButtonsProps {
  className?: string;
}

export function ActionButtons({ className }: ActionButtonsProps) {
  const puzzle = usePuzzle();
  const handleUndo = useCallback(() => getGameState().undo(), []);
  const handleRedo = useCallback(() => getGameState().redo(), []);
  const handleReset = useCallback(() => fireAction("reset"), []);

  if (!puzzle) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleUndo}
        title="Undo (Ctrl+Z)"
        className="h-8 w-8"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleRedo}
        title="Redo (Ctrl+Shift+Z)"
        className="h-8 w-8"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleReset}
        title="Restart Level (R)"
        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
