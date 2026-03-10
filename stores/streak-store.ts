import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StreakState {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

interface StreakActions {
  recordCompletion: (dateStr: string) => void
  getMultiplier: () => number
}

type StreakStore = StreakState & StreakActions

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round(Math.abs(da - db) / msPerDay);
}

const useStreakStoreBase = create<StreakStore>()(
  persist(
  (set, get) => ({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,

    recordCompletion: (dateStr) => {
    const state = get();
    if (state.lastCompletedDate === dateStr) return;

    let newStreak: number;
    if (state.lastCompletedDate && daysBetween(state.lastCompletedDate, dateStr) === 1) {
      newStreak = state.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    set({
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, state.longestStreak),
      lastCompletedDate: dateStr,
    });
    },

    getMultiplier: () => {
    return 1 + get().currentStreak * 0.1;
    },
  }),
  {
    name: "flow-master-streaks",
    version: 1,
  },
  ),
);

import { useShallow } from "zustand/react/shallow";

export const useCurrentStreak = () => useStreakStoreBase(useShallow((s) => s.currentStreak));
export const useLongestStreak = () => useStreakStoreBase(useShallow((s) => s.longestStreak));
export const useLastCompletedDate = () => useStreakStoreBase(useShallow((s) => s.lastCompletedDate));
export const useRecordCompletion = () => useStreakStoreBase(useShallow((s) => s.recordCompletion));


