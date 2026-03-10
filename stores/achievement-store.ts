import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  target: number
  reward: number
}

export interface AchievementProgress {
  unlocked: boolean
  unlockedAt: number | null
  progress: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_flow", name: "First Flow", description: "Complete your first puzzle", icon: "🎯", target: 1, reward: 25 },
  { id: "ten_down", name: "Ten Down", description: "Complete 10 puzzles", icon: "🔟", target: 10, reward: 50 },
  { id: "century", name: "Century", description: "Complete 100 puzzles", icon: "💯", target: 100, reward: 200 },
  { id: "speed_demon", name: "Speed Demon", description: "Complete a 5×5 puzzle under 10 seconds", icon: "⚡", target: 1, reward: 100 },
  { id: "perfectionist", name: "Perfectionist", description: "Get 10 perfect (3-star) clears", icon: "⭐", target: 10, reward: 150 },
  { id: "streak_3", name: "On Fire", description: "Reach a 3-day streak", icon: "🔥", target: 3, reward: 50 },
  { id: "streak_7", name: "Weekly Warrior", description: "Reach a 7-day streak", icon: "🗓️", target: 7, reward: 150 },
  { id: "streak_30", name: "Monthly Master", description: "Reach a 30-day streak", icon: "👑", target: 30, reward: 500 },
  { id: "campaign_5", name: "Adventurer", description: "Complete 5 campaign stages", icon: "🗺️", target: 5, reward: 100 },
  { id: "campaign_15", name: "Explorer", description: "Complete 15 campaign stages", icon: "🧭", target: 15, reward: 300 },
  { id: "campaign_25", name: "Champion", description: "Complete all 25 campaign stages", icon: "🏆", target: 25, reward: 1000 },
  { id: "time_attack_5", name: "Time Crusher", description: "Solve 5 puzzles in a single Time Attack", icon: "⏱️", target: 5, reward: 100 },
  { id: "time_attack_10", name: "Unstoppable", description: "Solve 10 puzzles in a single Time Attack", icon: "🚀", target: 10, reward: 250 },
  { id: "big_grid", name: "Going Big", description: "Complete a 20×20 or larger puzzle", icon: "📐", target: 1, reward: 100 },
  { id: "huge_grid", name: "Colossus", description: "Complete a 40×40 or larger puzzle", icon: "🏗️", target: 1, reward: 500 },
  { id: "speed_3s", name: "Are You Human?", description: "Complete a 5×5 in under 3 seconds", icon: "🤖", target: 1, reward: 200 },
  { id: "old_school", name: "Old School", description: "Unlock the Retro theme", icon: "👾", target: 1, reward: 100 },
  { id: "collector", name: "Collector", description: "Purchase 3 themes", icon: "🎨", target: 3, reward: 200 },
  { id: "wealthy", name: "Wealthy", description: "Earn 5000 total flows", icon: "💰", target: 5000, reward: 250 },
  { id: "daily_10", name: "Dedicated", description: "Complete 10 daily challenges", icon: "📅", target: 10, reward: 200 },
  { id: "century_club", name: "Century Club", description: "Reach a 100-day streak", icon: "💫", target: 100, reward: 1000 },
  { id: "prestige_1", name: "Reborn", description: "Prestige for the first time", icon: "🔄", target: 1, reward: 500 },
  { id: "gauntlet_clear", name: "Gauntlet Runner", description: "Complete a Daily Gauntlet", icon: "🛡️", target: 1, reward: 200 },
];

interface AchievementState {
  progress: Record<string, AchievementProgress>
}

interface AchievementActions {
  updateProgress: (achievementId: string, newProgress: number) => boolean
  incrementProgress: (achievementId: string, amount?: number) => boolean
  isUnlocked: (achievementId: string) => boolean
  getProgress: (achievementId: string) => AchievementProgress
  getUnlockedCount: () => number
  unlockDirectly: (achievementId: string) => boolean
}

type AchievementStore = AchievementState & AchievementActions

function getDefaultProgress(): AchievementProgress {
  return { unlocked: false, unlockedAt: null, progress: 0 };
}

const useAchievementStoreBase = create<AchievementStore>()(
  persist(
  (set, get) => ({
    progress: {},

    updateProgress: (achievementId, newProgress) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return false;

    const current = get().progress[achievementId] ?? getDefaultProgress();
    if (current.unlocked) return false;

    const updated = { ...current, progress: Math.max(current.progress, newProgress) };
    if (updated.progress >= achievement.target) {
      updated.unlocked = true;
      updated.unlockedAt = Date.now();
    }

    set((state) => ({
      progress: { ...state.progress, [achievementId]: updated },
    }));

    return updated.unlocked && !current.unlocked;
    },

    incrementProgress: (achievementId, amount = 1) => {
    const current = get().progress[achievementId] ?? getDefaultProgress();
    return get().updateProgress(achievementId, current.progress + amount);
    },

    isUnlocked: (achievementId) =>
    get().progress[achievementId]?.unlocked ?? false,

    getProgress: (achievementId) =>
    get().progress[achievementId] ?? getDefaultProgress(),

    getUnlockedCount: () =>
    Object.values(get().progress).filter((p) => p.unlocked).length,

    unlockDirectly: (achievementId) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return false;
    const current = get().progress[achievementId] ?? getDefaultProgress();
    if (current.unlocked) return false;

    set((state) => ({
      progress: {
      ...state.progress,
      [achievementId]: {
        unlocked: true,
        unlockedAt: Date.now(),
        progress: achievement.target,
      },
      },
    }));
    return true;
    },
  }),
  {
    name: "flow-master-achievements",
    version: 1,
  },
  ),
);

import { useShallow } from "zustand/react/shallow";

export const getAchievementState = () => useAchievementStoreBase.getState();

export const useProgress = () => useAchievementStoreBase(useShallow((s) => s.progress));
export const useUpdateProgress = () => useAchievementStoreBase(useShallow((s) => s.updateProgress));
export const useIncrementProgress = () => useAchievementStoreBase(useShallow((s) => s.incrementProgress));
export const useIsUnlocked = () => useAchievementStoreBase(useShallow((s) => s.isUnlocked));
export const useGetUnlockedCount = () => useAchievementStoreBase(useShallow((s) => s.getUnlockedCount));
export const useUnlockDirectly = () => useAchievementStoreBase(useShallow((s) => s.unlockDirectly));

