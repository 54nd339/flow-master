import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Difficulty } from "@/lib/engine/level-config";

interface SettingsState {
  gridWidth: number
  gridHeight: number
  difficulty: Difficulty
  theme: string
  gameThemeId: string
  colorblindMode: boolean
  muted: boolean
  minimalHud: boolean
  haptics: boolean
  autoScale: boolean
  leftHanded: boolean
  highContrast: boolean
  reducedMotion: boolean
  shakeToUndo: boolean
}

interface SettingsActions {
  setGridSize: (w: number, h: number) => void
  setDifficulty: (d: Difficulty) => void
  setTheme: (theme: string) => void
  setGameThemeId: (id: string) => void
  toggleColorblind: () => void
  toggleMuted: () => void
  toggleMinimalHud: () => void
  toggleHaptics: () => void
  toggleAutoScale: () => void
  toggleLeftHanded: () => void
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  toggleShakeToUndo: () => void
}

type SettingsStore = SettingsState & SettingsActions

const useSettingsStoreBase = create<SettingsStore>()(
  persist(
  (set) => ({
    gridWidth: 7,
    gridHeight: 7,
    difficulty: "medium" as Difficulty,
    theme: "system",
    gameThemeId: "water",
    colorblindMode: false,
    muted: false,
    minimalHud: false,
    haptics: true,
    autoScale: false,
    leftHanded: false,
    highContrast: false,
    reducedMotion: false,
    shakeToUndo: false,

    setGridSize: (w, h) => set({ gridWidth: w, gridHeight: h }),
    setDifficulty: (difficulty) => set({ difficulty }),
    setTheme: (theme) => set({ theme }),
    setGameThemeId: (gameThemeId) => set({ gameThemeId }),
    toggleColorblind: () =>
    set((state) => ({ colorblindMode: !state.colorblindMode })),
    toggleMuted: () => set((state) => ({ muted: !state.muted })),
    toggleMinimalHud: () =>
    set((state) => ({ minimalHud: !state.minimalHud })),
    toggleHaptics: () => set((state) => ({ haptics: !state.haptics })),
    toggleAutoScale: () =>
    set((state) => ({ autoScale: !state.autoScale })),
    toggleLeftHanded: () =>
    set((state) => ({ leftHanded: !state.leftHanded })),
    toggleHighContrast: () =>
    set((state) => ({ highContrast: !state.highContrast })),
    toggleReducedMotion: () =>
    set((state) => ({ reducedMotion: !state.reducedMotion })),
    toggleShakeToUndo: () =>
    set((state) => ({ shakeToUndo: !state.shakeToUndo })),
  }),
  {
    name: "flow-master-settings",
    version: 5,
    migrate: (persisted, version) => {
    const state = persisted as Record<string, unknown>;
    if (version < 2) {
      return {
      ...state,
      muted: state.muted ?? false,
      minimalHud: state.minimalHud ?? false,
      haptics: state.haptics ?? true,
      autoScale: false,
      leftHanded: false,
      highContrast: false,
      reducedMotion: false,
      shakeToUndo: false,
      gameThemeId: "water",
      } as unknown as SettingsStore;
    }
    if (version < 3) {
      return {
      ...state,
      haptics: state.haptics ?? true,
      autoScale: false,
      leftHanded: false,
      highContrast: false,
      reducedMotion: false,
      shakeToUndo: false,
      gameThemeId: "water",
      } as unknown as SettingsStore;
    }
    if (version < 4) {
      return {
      ...state,
      autoScale: state.autoScale ?? false,
      leftHanded: state.leftHanded ?? false,
      highContrast: state.highContrast ?? false,
      reducedMotion: state.reducedMotion ?? false,
      shakeToUndo: state.shakeToUndo ?? false,
      gameThemeId: "water",
      } as unknown as SettingsStore;
    }
    if (version < 5) {
      return {
      ...state,
      gameThemeId: (state as Record<string, unknown>).gameThemeId ?? "water",
      } as unknown as SettingsStore;
    }
    return persisted as SettingsStore;
    },
  },
  ),
);

import { useShallow } from "zustand/react/shallow";

export const getSettingsState = () => useSettingsStoreBase.getState();

export const useGridWidth = () => useSettingsStoreBase(useShallow((s) => s.gridWidth));
export const useGridHeight = () => useSettingsStoreBase(useShallow((s) => s.gridHeight));
export const useDifficulty = () => useSettingsStoreBase(useShallow((s) => s.difficulty));
export const useGameThemeId = () => useSettingsStoreBase(useShallow((s) => s.gameThemeId));
export const useSetGameThemeId = () => useSettingsStoreBase(useShallow((s) => s.setGameThemeId));
export const useColorblindMode = () => useSettingsStoreBase(useShallow((s) => s.colorblindMode));
export const useMuted = () => useSettingsStoreBase(useShallow((s) => s.muted));
export const useMinimalHud = () => useSettingsStoreBase(useShallow((s) => s.minimalHud));
export const useHaptics = () => useSettingsStoreBase(useShallow((s) => s.haptics));
export const useAutoScale = () => useSettingsStoreBase(useShallow((s) => s.autoScale));
export const useLeftHanded = () => useSettingsStoreBase(useShallow((s) => s.leftHanded));
export const useHighContrast = () => useSettingsStoreBase(useShallow((s) => s.highContrast));
export const useReducedMotion = () => useSettingsStoreBase(useShallow((s) => s.reducedMotion));
export const useShakeToUndo = () => useSettingsStoreBase(useShallow((s) => s.shakeToUndo));
export const useSetGridSize = () => useSettingsStoreBase(useShallow((s) => s.setGridSize));
export const useSetDifficulty = () => useSettingsStoreBase(useShallow((s) => s.setDifficulty));
export const useToggleColorblind = () => useSettingsStoreBase(useShallow((s) => s.toggleColorblind));
export const useToggleMuted = () => useSettingsStoreBase(useShallow((s) => s.toggleMuted));
export const useToggleMinimalHud = () => useSettingsStoreBase(useShallow((s) => s.toggleMinimalHud));
export const useToggleHaptics = () => useSettingsStoreBase(useShallow((s) => s.toggleHaptics));
export const useToggleAutoScale = () => useSettingsStoreBase(useShallow((s) => s.toggleAutoScale));
export const useToggleLeftHanded = () => useSettingsStoreBase(useShallow((s) => s.toggleLeftHanded));
export const useToggleHighContrast = () => useSettingsStoreBase(useShallow((s) => s.toggleHighContrast));
export const useToggleReducedMotion = () => useSettingsStoreBase(useShallow((s) => s.toggleReducedMotion));


