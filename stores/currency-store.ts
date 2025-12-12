import { THEME_PRICES } from '@/config';
import { getTodayDateString } from '@/lib/daily-challenge';
import type { StoreApi } from 'zustand';
import type { GameState } from './game-store';

type SetState = StoreApi<GameState>['setState'];
type GetState = StoreApi<GameState>['getState'];

export interface CurrencyStateSlice {
  addFlows: (amount: number) => void;
  unlockTheme: (themeId: string) => boolean;
  updateDailyStreak: () => void;
}

export const createCurrencyStateSlice = (set: SetState, get: GetState): CurrencyStateSlice => ({
  addFlows: (amount) =>
    set((state) => ({
      progress: {
        ...state.progress,
        flows: state.progress.flows + amount,
      },
    })),
  unlockTheme: (themeId) => {
    const state = get();
    const price = THEME_PRICES[themeId] || 0;
    const unlockedThemes = state.progress.unlockedThemes || ['WATER'];

    if (unlockedThemes.includes(themeId)) {
      return true;
    }

    if (state.progress.flows >= price) {
      set((prevState) => ({
        progress: {
          ...prevState.progress,
          flows: prevState.progress.flows - price,
          unlockedThemes: [...unlockedThemes, themeId],
        },
      }));
      return true;
    }
    return false;
  },
  updateDailyStreak: () => {
    const state = get();
    const today = getTodayDateString();
    const lastDate = state.progress.lastDailyDate;

    // Already completed today, don't update
    if (lastDate === today) {
      return;
    }

    let newStreak = state.progress.dailyStreak;
    if (lastDate) {
      const lastDateObj = new Date(lastDate);
      const todayObj = new Date(today);
      const daysDiff = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

      // Streak logic: consecutive days = increment, gap = reset to 1
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
    } else {
      // First time completing daily challenge
      newStreak = 1;
    }

    set((prevState) => ({
      progress: {
        ...prevState.progress,
        dailyStreak: newStreak,
        lastDailyDate: today,
      },
    }));
  },
});
