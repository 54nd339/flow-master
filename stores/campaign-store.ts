import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import { LEVELS_PER_AREA } from "@/lib/campaign";

export interface CampaignState {
  /** areaId -> array of solved level hashes (index = levelIdx) */
  history: Record<number, string[]>
  currentArea: number
  currentLevel: number
  maxArea: number
  prestigeLevel: number
  totalXP: number
}

interface CampaignActions {
  completeLevel: (areaId: number, levelIdx: number, hash: string) => void
  skipArea: (areaId: number) => void
  isAreaUnlocked: (areaId: number) => boolean
  getAreaHistory: (areaId: number) => string[]
  completedAreasCount: () => number
  setCurrentPosition: (areaId: number, levelIdx: number) => void
  canPrestige: () => boolean
  prestige: () => boolean
  addXP: (amount: number) => void
}

type CampaignStore = CampaignState & CampaignActions;

const useCampaignStoreBase = create<CampaignStore>()(
  persist(
    (set, get) => ({
      history: {},
      currentArea: 1,
      currentLevel: 0,
      maxArea: 1,
      prestigeLevel: 0,
      totalXP: 0,

      completeLevel: (areaId, levelIdx, hash) => {
        const state = get();
        const areaHistory = [...(state.history[areaId] ?? [])];

        if (levelIdx < areaHistory.length) return;
        areaHistory[levelIdx] = hash;

        const newMaxArea =
          areaHistory.length >= LEVELS_PER_AREA && areaId >= state.maxArea
            ? Math.min(areaId + 1, 25)
            : state.maxArea;

        set({
          history: { ...state.history, [areaId]: areaHistory },
          maxArea: newMaxArea,
        });
      },

      skipArea: (areaId) => {
        const state = get();
        if (areaId > 25) return;
        const fakeHistory = Array.from(
          { length: LEVELS_PER_AREA },
          (_, i) => `skipped-${i}`,
        );
        set({
          history: { ...state.history, [areaId]: fakeHistory },
          maxArea: Math.max(state.maxArea, Math.min(areaId + 1, 25)),
        });
      },

      isAreaUnlocked: (areaId) => {
        if (areaId === 1) return true;
        return areaId <= get().maxArea;
      },

      getAreaHistory: (areaId) => get().history[areaId] ?? [],

      completedAreasCount: () => {
        const { history } = get();
        return Object.values(history).filter(
          (h) => h.length >= LEVELS_PER_AREA,
        ).length;
      },

      setCurrentPosition: (areaId, levelIdx) => {
        set({ currentArea: areaId, currentLevel: levelIdx });
      },

      canPrestige: () => get().completedAreasCount() >= 25,

      prestige: () => {
        const state = get();
        if (state.completedAreasCount() < 25) return false;
        if (state.prestigeLevel >= 10) return false;
        set({
          history: {},
          currentArea: 1,
          currentLevel: 0,
          maxArea: 1,
          prestigeLevel: state.prestigeLevel + 1,
        });
        return true;
      },

      addXP: (amount) => {
        set((state) => ({ totalXP: state.totalXP + amount }));
      },
    }),
    {
      name: "flow-master-campaign",
      version: 3,
      migrate: (persisted, version) => {
        if (version < 3) {
          return {
            history: {},
            currentArea: 1,
            currentLevel: 0,
            maxArea: 1,
            prestigeLevel:
              (persisted as Record<string, unknown>).prestigeLevel as number ?? 0,
            totalXP:
              (persisted as Record<string, unknown>).totalXP as number ?? 0,
          } as unknown as CampaignStore;
        }
        return persisted as CampaignStore;
      },
    },
  ),
);

export const useCurrentArea = () =>
  useCampaignStoreBase(useShallow((s) => s.currentArea));
export const useCurrentLevel = () =>
  useCampaignStoreBase(useShallow((s) => s.currentLevel));
export const useMaxArea = () =>
  useCampaignStoreBase(useShallow((s) => s.maxArea));
export const usePrestigeLevel = () =>
  useCampaignStoreBase(useShallow((s) => s.prestigeLevel));
export const useTotalXP = () =>
  useCampaignStoreBase(useShallow((s) => s.totalXP));
export const useCompleteLevel = () =>
  useCampaignStoreBase(useShallow((s) => s.completeLevel));
export const useSkipArea = () =>
  useCampaignStoreBase(useShallow((s) => s.skipArea));
export const useIsAreaUnlocked = () =>
  useCampaignStoreBase(useShallow((s) => s.isAreaUnlocked));
export const useGetAreaHistory = () =>
  useCampaignStoreBase(useShallow((s) => s.getAreaHistory));
export const useCompletedAreasCount = () =>
  useCampaignStoreBase(useShallow((s) => s.completedAreasCount));
export const useSetCurrentPosition = () =>
  useCampaignStoreBase(useShallow((s) => s.setCurrentPosition));
export const usePrestige = () =>
  useCampaignStoreBase(useShallow((s) => s.prestige));
export const useCanPrestige = () =>
  useCampaignStoreBase(useShallow((s) => s.canPrestige));
export const useAddXP = () =>
  useCampaignStoreBase(useShallow((s) => s.addXP));
