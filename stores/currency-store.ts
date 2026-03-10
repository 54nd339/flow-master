import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CurrencyState {
  balance: number
  totalEarned: number
  totalSpent: number
  purchasedThemes: string[]
}

interface CurrencyActions {
  earn: (amount: number) => void
  spend: (amount: number) => boolean
  canAfford: (amount: number) => boolean
  purchaseTheme: (themeId: string, cost: number) => boolean
  hasTheme: (themeId: string) => boolean
  earnLevelComplete: () => void
  earnPerfectClear: () => void
  earnDailyChallenge: () => void
  earnTimeAttack: (puzzlesSolved: number) => void
  earnStreakBonus: (multiplier: number) => void
  spendHint: () => boolean
  spendSkip: () => boolean
}

type CurrencyStore = CurrencyState & CurrencyActions

const FREE_THEMES = ["water", "retro"];

const useCurrencyStoreBase = create<CurrencyStore>()(
  persist(
  (set, get) => ({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    purchasedThemes: [],

    earn: (amount) => {
    set((state) => ({
      balance: state.balance + amount,
      totalEarned: state.totalEarned + amount,
    }));
    },

    spend: (amount) => {
    if (get().balance < amount) return false;
    set((state) => ({
      balance: state.balance - amount,
      totalSpent: state.totalSpent + amount,
    }));
    return true;
    },

    canAfford: (amount) => get().balance >= amount,

    purchaseTheme: (themeId, cost) => {
    const state = get();
    if (state.purchasedThemes.includes(themeId)) return true;
    if (state.balance < cost) return false;
    set((s) => ({
      balance: s.balance - cost,
      totalSpent: s.totalSpent + cost,
      purchasedThemes: [...s.purchasedThemes, themeId],
    }));
    return true;
    },

    hasTheme: (themeId) => {
    if (FREE_THEMES.includes(themeId)) return true;
    return get().purchasedThemes.includes(themeId);
    },

    earnLevelComplete: () => {
    get().earn(10);
    },

    earnPerfectClear: () => {
    get().earn(50);
    },

    earnDailyChallenge: () => {
    get().earn(25);
    },

    earnTimeAttack: (puzzlesSolved) => {
    get().earn(5 * puzzlesSolved);
    },

    earnStreakBonus: (multiplier) => {
    const amount = Math.round(10 * multiplier);
    get().earn(amount);
    },

    spendHint: () => get().spend(25),

    spendSkip: () => get().spend(50),
  }),
  {
    name: "flow-master-currency",
    version: 1,
  },
  ),
);

import { useShallow } from "zustand/react/shallow";

export const getCurrencyState = () => useCurrencyStoreBase.getState();

export const useBalance = () => useCurrencyStoreBase(useShallow((s) => s.balance));
export const useTotalEarned = () => useCurrencyStoreBase(useShallow((s) => s.totalEarned));
export const useCanAfford = () => useCurrencyStoreBase(useShallow((s) => s.canAfford));
export const usePurchaseTheme = () => useCurrencyStoreBase(useShallow((s) => s.purchaseTheme));
export const useHasTheme = () => useCurrencyStoreBase(useShallow((s) => s.hasTheme));
export const useEarnLevelComplete = () => useCurrencyStoreBase(useShallow((s) => s.earnLevelComplete));
export const useEarnPerfectClear = () => useCurrencyStoreBase(useShallow((s) => s.earnPerfectClear));
export const useEarnDailyChallenge = () => useCurrencyStoreBase(useShallow((s) => s.earnDailyChallenge));
export const useEarnTimeAttack = () => useCurrencyStoreBase(useShallow((s) => s.earnTimeAttack));
export const useEarnStreakBonus = () => useCurrencyStoreBase(useShallow((s) => s.earnStreakBonus));
export const useSpendHint = () => useCurrencyStoreBase(useShallow((s) => s.spendHint));
export const useSpendSkip = () => useCurrencyStoreBase(useShallow((s) => s.spendSkip));


