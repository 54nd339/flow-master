import type { ReactNode } from "react";

import { cn, formatTime } from "@/lib/utils";

interface GameStatsProps {
  timerSeconds?: number;
  pipePercent: number;
  moveCount?: number;
  minimalHud?: boolean;
  extra?: ReactNode;
  className?: string;
}

export function GameStats({
  timerSeconds,
  pipePercent,
  moveCount,
  minimalHud = false,
  extra,
  className,
}: GameStatsProps) {
  return (
    <div className={cn("flex items-center gap-3 text-xs sm:text-sm text-muted-foreground font-medium group", className)}>
      {timerSeconds !== undefined && (
        <>
          <span className="font-mono">{formatTime(timerSeconds)}</span>
          <span className="text-border">|</span>
        </>
      )}
      <span className="whitespace-nowrap">
        {pipePercent}% <span className={cn("hidden sm:inline", minimalHud && "sm:hidden")}>filled</span>
      </span>
      {moveCount !== undefined && !minimalHud && (
        <>
          <span className="text-border">|</span>
          <span className="whitespace-nowrap">
            {moveCount} <span className="hidden sm:inline">moves</span>
          </span>
        </>
      )}
      {extra && (
        <>
          <span className="text-border">|</span>
          {extra}
        </>
      )}
    </div>
  );
}
