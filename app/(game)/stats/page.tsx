"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, BarChart3, Clock, Flame, Star, Target, Trophy } from "lucide-react";

import { cn, formatTime } from "@/lib/utils";
import { ACHIEVEMENTS, useGetUnlockedCount, useProgress } from "@/stores/achievement-store";
import { useCompletedAreasCount } from "@/stores/campaign-store";
import { useBalance, useTotalEarned } from "@/stores/currency-store";
import { useEntries, useLoad } from "@/stores/history-store";
import { useRecords } from "@/stores/records-store";
import { useCurrentStreak, useLongestStreak } from "@/stores/streak-store";

const SolveTimeChart = dynamic(() => import("@/components/game/solve-time-chart").then((m) => m.SolveTimeChart), { ssr: false });

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function StatsPage() {
  const entries = useEntries();
  const loadHistory = useLoad();
  const records = useRecords();
  const completedAreasCount = useCompletedAreasCount();
  const balance = useBalance();
  const totalEarned = useTotalEarned();
  const currentStreak = useCurrentStreak();
  const longestStreak = useLongestStreak();
  const achievementProgress = useProgress();
  const unlockedCount = useGetUnlockedCount();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const stats = useMemo(() => {
    const totalPuzzles = entries.length;
    const totalTime = entries.reduce((sum, e) => sum + e.time, 0);
    const perfectClears = entries.filter((e) => e.stars === 3).length;
    const avgTime =
      totalPuzzles > 0 ? Math.round(totalTime / totalPuzzles) : 0;

    return { totalPuzzles, totalTime, perfectClears, avgTime };
  }, [entries]);

  const chartData = useMemo(() => {
    return entries
      .slice(0, 30)
      .reverse()
      .map((e, i) => ({
        index: i + 1,
        time: e.time,
        size: `${e.gridWidth}×${e.gridHeight}`,
        stars: e.stars,
      }));
  }, [entries]);

  const recordsList = useMemo(() => {
    return Object.entries(records)
      .map(([key, pb]) => ({ key, ...pb }))
      .sort((a, b) => b.bestStars - a.bestStars || a.bestTime - b.bestTime)
      .slice(0, 20);
  }, [records]);

  return (
    <div className="flex min-h-dvh flex-col items-center p-4 lg:p-8">
      <div className="mb-6 flex w-full max-w-3xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">Stats Dashboard</h1>

      <div className="w-full max-w-3xl space-y-8">
        {/* Overview grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Target} label="Puzzles Solved" value={stats.totalPuzzles} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Clock} label="Total Time" value={formatTime(stats.totalTime)} color="bg-purple-500/10 text-purple-500" />
          <StatCard icon={Star} label="Perfect Clears" value={stats.perfectClears} color="bg-yellow-500/10 text-yellow-500" />
          <StatCard icon={BarChart3} label="Avg Solve Time" value={stats.avgTime > 0 ? `${stats.avgTime}s` : "—"} color="bg-green-500/10 text-green-500" />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Flame} label="Current Streak" value={currentStreak} color="bg-orange-500/10 text-orange-500" />
          <StatCard icon={Flame} label="Longest Streak" value={longestStreak} color="bg-red-500/10 text-red-500" />
          <StatCard icon={Trophy} label="Campaign Areas" value={`${completedAreasCount()}/25`} color="bg-yellow-500/10 text-yellow-500" />
          <StatCard icon={Trophy} label="Campaign Stages" value={`${completedAreasCount()}/25`} color="bg-emerald-500/10 text-emerald-500" />
        </div>

        {/* Currency */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4">
            <span className="text-xl font-bold text-foreground">{balance}</span>
            <span className="text-xs text-muted-foreground">Current Flows</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4">
            <span className="text-xl font-bold text-foreground">{totalEarned}</span>
            <span className="text-xs text-muted-foreground">Total Earned</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4">
            <span className="text-xl font-bold text-foreground">{unlockedCount()}/{ACHIEVEMENTS.length}</span>
            <span className="text-xs text-muted-foreground">Achievements</span>
          </div>
        </div>

        {/* Solve time chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Solve Time Trend</h2>
            <SolveTimeChart data={chartData} />
          </div>
        )}

        {/* Personal bests */}
        {recordsList.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Personal Bests</h2>
            <div className="space-y-2">
              {recordsList.map((r) => (
                <div key={r.key} className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm font-medium text-foreground">{r.key}</span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatTime(r.bestTime)}</span>
                    <span>{r.bestMoves} moves</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i <= r.bestStars
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="rounded-xl border border-border bg-background p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Achievements</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const prog = achievementProgress[a.id];
              const unlocked = prog?.unlocked ?? false;
              const progress = prog?.progress ?? 0;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 transition-all",
                    unlocked ? "bg-green-500/5" : "bg-muted/50",
                  )}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className={cn(
                      "text-sm font-medium",
                      unlocked ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {a.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.description}</span>
                    {!unlocked && (
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full w-[var(--progress-width)] rounded-full bg-accent transition-all"
                          style={{ "--progress-width": `${Math.min(100, (progress / a.target) * 100)}%` } as React.CSSProperties}
                        />
                      </div>
                    )}
                  </div>
                  {unlocked && (
                    <span className="text-xs font-medium text-green-500">Unlocked</span>
                  )}
                  {!unlocked && (
                    <span className="text-xs text-muted-foreground">
                      {progress}/{a.target}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
