"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BarChart3, Coins, Flame, Gamepad2, Leaf, Play, Shield, Sparkles, Swords, Trophy, Zap } from "lucide-react";

import { RankBadge } from "@/components/game/rank-badge";
import { getDailyDateString, getWeeklyFeaturedSize } from "@/lib/daily-seed";
import { cn } from "@/lib/utils";
import { usePrestigeLevel, useTotalXP } from "@/stores/campaign-store";
import { useBalance } from "@/stores/currency-store";
import { useEntries, useLoad } from "@/stores/history-store";
import { useCurrentStreak, useLastCompletedDate } from "@/stores/streak-store";

const MODES = [
  {
    id: "play",
    title: "Free Play",
    description: "Generate puzzles at any size and difficulty",
    icon: Play,
    href: "/play",
    color: "bg-blue-500/10 text-blue-500",
    accent: "hover:border-blue-500/30",
  },
  {
    id: "campaign",
    title: "Campaign",
    description: "25 stages of progressive challenge",
    icon: Swords,
    href: "/campaign",
    color: "bg-purple-500/10 text-purple-500",
    accent: "hover:border-purple-500/30",
  },
  {
    id: "daily",
    title: "Daily Challenge",
    description: "One new puzzle every day — build your streak",
    icon: Flame,
    href: "/daily",
    color: "bg-orange-500/10 text-orange-500",
    accent: "hover:border-orange-500/30",
  },
  {
    id: "gauntlet",
    title: "Daily Gauntlet",
    description: "5 escalating puzzles — one attempt per day",
    icon: Shield,
    href: "/gauntlet",
    color: "bg-rose-500/10 text-rose-500",
    accent: "hover:border-rose-500/30",
  },
  {
    id: "time-attack",
    title: "Time Attack",
    description: "Race the clock — solve as many as you can",
    icon: Zap,
    href: "/time-attack",
    color: "bg-red-500/10 text-red-500",
    accent: "hover:border-red-500/30",
  },
  {
    id: "zen",
    title: "Zen Mode",
    description: "No timer, no pressure — just flow",
    icon: Leaf,
    href: "/zen",
    color: "bg-green-500/10 text-green-500",
    accent: "hover:border-green-500/30",
  },
] as const;

export default function Home() {
  const currentStreak = useCurrentStreak();
  const lastCompletedDate = useLastCompletedDate();
  const todayStr = getDailyDateString();
  const dailyDone = lastCompletedDate === todayStr;

  const totalSolved = useEntries().length;
  const loadHistory = useLoad();
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const balance = useBalance();
  const totalXP = useTotalXP();
  const prestigeLevel = usePrestigeLevel();
  const featuredSize = getWeeklyFeaturedSize();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-5xl flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Gamepad2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              FlowMaster
            </h1>
            <p className="text-sm text-muted-foreground">
              Numberlink puzzle generator &amp; player
            </p>
          </div>
        </div>

        <div className="grid w-full gap-3 lg:grid-cols-2">
          {MODES.map((mode) => (
            <Link
              key={mode.id}
              href={mode.href}
              className={cn(
                "group flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-all text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                mode.accent,
              )}
            >
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", mode.color)}>
                <mode.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {mode.title}
                  {mode.id === "daily" && dailyDone && (
                    <span className="ml-2 text-xs font-normal text-green-500">Completed</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{mode.description}</span>
              </div>
              {mode.id === "daily" && currentStreak > 0 && (
                <div className="flex items-center gap-1 text-sm font-medium text-orange-400">
                  <Flame className="h-4 w-4" />
                  {currentStreak}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-accent/5 px-5 py-3 md:col-span-2 lg:col-span-1">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                This week&apos;s featured: {featuredSize}&times;{featuredSize}
              </span>
              <span className="text-xs text-muted-foreground">Bonus currency for featured size puzzles!</span>
            </div>
          </div>

          <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-muted/50 px-5 py-3">
            <RankBadge xp={totalXP} showProgress size="sm" />
            {prestigeLevel > 0 && (
              <span className="text-xs text-yellow-400 font-medium">P{prestigeLevel}</span>
            )}
          </div>

          <div className="flex min-h-16 items-center gap-2 rounded-xl border border-border bg-muted/50 px-5 py-3">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">{balance}</span>
            {totalSolved > 0 && (
              <>
                <span className="mx-1 text-border">·</span>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">{totalSolved}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/stats"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Stats
          </Link>
          <span className="text-border">·</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
            <span>Command Palette anywhere</span>
          </div>
        </div>
      </div>
    </div>
  );
}
