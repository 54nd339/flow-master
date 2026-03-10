import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { Achievement, AchievementProgress } from "@/stores/achievement-store";

const cardVariants = cva(
  "flex items-center gap-3 rounded-xl border p-4 transition-all",
  {
    variants: {
      state: {
        unlocked: "border-green-500/20 bg-green-500/5",
        locked: "border-border bg-background",
      },
    },
    defaultVariants: {
      state: "locked",
    },
  },
);

interface AchievementCardProps {
  achievement: Achievement
  progress: AchievementProgress
}

export function AchievementCard({ achievement, progress }: AchievementCardProps) {
  const pct = Math.min(100, (progress.progress / achievement.target) * 100);

  return (
    <div
      className={cn(cardVariants({ state: progress.unlocked ? "unlocked" : "locked" }))}
    >
      <span className="text-3xl">{achievement.icon}</span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-semibold",
              progress.unlocked ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {achievement.name}
          </span>
          {progress.unlocked ? (
            <span className="text-xs font-medium text-green-500">+{achievement.reward}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {progress.progress}/{achievement.target}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{achievement.description}</span>
        {!progress.unlocked && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent w-[var(--progress-width)] transition-all duration-300"
              style={{ "--progress-width": `${pct}%` } as React.CSSProperties}
            />
          </div>
        )}
      </div>
    </div>
  );
}
