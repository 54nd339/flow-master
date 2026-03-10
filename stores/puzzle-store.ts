import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import type { PuzzleData } from "@/lib/engine/types";

interface PuzzleState {
  puzzle: PuzzleData | null
  colors: Map<string, string>
  isGenerating: boolean
  showSolution: boolean
  generationTimeMs: number
  /** Which game mode generated the current puzzle */
  mode: string | null
  resetZoomCounter: number
  preGeneratedPuzzle: { puzzle: PuzzleData; colors: Map<string, string> } | null
}

interface PuzzleActions {
  setPuzzle: (puzzle: PuzzleData, colors: Map<string, string>, mode?: string) => void
  setGenerating: (generating: boolean) => void
  setGenerationTime: (ms: number) => void
  toggleSolution: () => void
  clearPuzzle: () => void
  incrementResetZoom: () => void
  setPreGenerated: (puzzle: PuzzleData, colors: Map<string, string>) => void
  consumePreGenerated: () => { puzzle: PuzzleData; colors: Map<string, string> } | null
}

type PuzzleStore = PuzzleState & PuzzleActions

const usePuzzleStoreBase = create<PuzzleStore>()((set, get) => ({
  puzzle: null,
  colors: new Map(),
  isGenerating: false,
  showSolution: false,
  generationTimeMs: 0,
  mode: null,
  resetZoomCounter: 0,
  preGeneratedPuzzle: null,

  setPuzzle: (puzzle, colors, mode) =>
    set({ puzzle, colors, isGenerating: false, mode: mode ?? null }),

  setGenerating: (generating) => set({ isGenerating: generating }),

  setGenerationTime: (ms) => set({ generationTimeMs: ms }),

  toggleSolution: () =>
    set((state) => ({ showSolution: !state.showSolution })),

  clearPuzzle: () =>
    set({
      puzzle: null,
      colors: new Map(),
      showSolution: false,
      generationTimeMs: 0,
      mode: null,
    }),

  incrementResetZoom: () =>
    set((state) => ({ resetZoomCounter: state.resetZoomCounter + 1 })),

  setPreGenerated: (puzzle, colors) =>
    set({ preGeneratedPuzzle: { puzzle, colors } }),

  consumePreGenerated: () => {
    const pre = get().preGeneratedPuzzle;
    if (pre) set({ preGeneratedPuzzle: null });
    return pre;
  },
}));

export const getPuzzleState = () => usePuzzleStoreBase.getState();

export const usePuzzle = () => usePuzzleStoreBase(useShallow((s) => s.puzzle));
export const useColors = () => usePuzzleStoreBase(useShallow((s) => s.colors));
export const useIsGenerating = () => usePuzzleStoreBase(useShallow((s) => s.isGenerating));
export const useShowSolution = () => usePuzzleStoreBase(useShallow((s) => s.showSolution));
export const useGenerationTimeMs = () => usePuzzleStoreBase(useShallow((s) => s.generationTimeMs));
export const useResetZoomCounter = () => usePuzzleStoreBase(useShallow((s) => s.resetZoomCounter));
export const useToggleSolution = () => usePuzzleStoreBase(useShallow((s) => s.toggleSolution));
