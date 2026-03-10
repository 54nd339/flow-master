import { cva } from "class-variance-authority";

import { getXPProgress } from "@/lib/ranks";
import { cn } from "@/lib/utils";

const rankBadgeVariants = cva("flex items-center", {
  variants: {
    size: {
      sm: "gap-1 text-xs",
      md: "gap-1.5 text-sm",
      lg: "gap-2 text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface RankBadgeProps {
  xp: number
  showProgress?: boolean
  size?: "sm" | "md" | "lg"
}

export function RankBadge({ xp, showProgress = false, size = "md" }: RankBadgeProps) {
  const { current, next, progress } = getXPProgress(xp);

  return (
    <div className={cn(rankBadgeVariants({ size }))}>
      <span>{current.icon}</span>
      <span
        className="font-medium text-[var(--rank-color)]"
        style={{ "--rank-color": current.color } as React.CSSProperties}
      >
        {current.name}
      </span>
      {showProgress && next && (
        <div className="flex items-center gap-1.5 ml-1">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full w-[var(--progress-width)] bg-[var(--progress-bg)] transition-all duration-300"
              style={{
                "--progress-width": `${Math.round(progress * 100)}%`,
                "--progress-bg": next.color,
              } as React.CSSProperties}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
