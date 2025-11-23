import { LevelData, MoveHistory, PerfectScore } from '@/types';
import type { StoreApi } from 'zustand';
import type { GameState } from './game-store';

type SetState = StoreApi<GameState>['setState'];
type GetState = StoreApi<GameState>['getState'];

export interface GameStateSlice {
  levelData: LevelData | null;
  userPaths: Record<number, number[]>;
  activeColor: number | null;
  isLevelComplete: boolean;
  isGenerating: boolean;
  hintUsed: boolean;
  generationWarning: string | null;
  levelUsedFallback: boolean;
  levelValidationError: string | null;
  moveHistory: MoveHistory[];
  perfectScore: PerfectScore | null;
  moveCount: number;
  levelStartTime: number | null;
  levelCompletionTime: number | null;
  preGeneratedLevels: LevelData[];
  
  setLevelData: (data: LevelData | null) => void;
  setUserPaths: (paths: Record<number, number[]>) => void;
  updateUserPath: (colorId: number, path: number[]) => void;
  setActiveColor: (color: number | null) => void;
  setIsLevelComplete: (complete: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setHintUsed: (used: boolean) => void;
  setGenerationWarning: (warning: string | null) => void;
  setLevelUsedFallback: (used: boolean) => void;
  setLevelValidationError: (error: string | null) => void;
  addMoveToHistory: () => void;
  undoLastMove: () => void;
  clearMoveHistory: () => void;
  setPerfectScore: (score: PerfectScore | null) => void;
  incrementMoveCount: () => void;
  resetMoveCount: () => void;
  resetBoard: () => void;
  setLevelStartTime: (time: number | null) => void;
  setLevelCompletionTime: (time: number | null) => void;
  addPreGeneratedLevel: (level: LevelData) => void;
  shiftPreGeneratedLevel: () => LevelData | null;
  clearPreGeneratedLevels: () => void;
}

export const createGameStateSlice = (set: SetState, get: GetState): GameStateSlice => ({
  levelData: null,
  userPaths: {},
  activeColor: null,
  isLevelComplete: false,
  isGenerating: false,
  hintUsed: false,
  generationWarning: null,
  levelUsedFallback: false,
  levelValidationError: null,
  moveHistory: [],
  perfectScore: null,
  moveCount: 0,
  levelStartTime: null,
  levelCompletionTime: null,
  preGeneratedLevels: [],

  setLevelData: (data) => {
    set({ 
      levelData: data,
      levelStartTime: data ? Date.now() : null,
      levelCompletionTime: null,
    });
  },
  setUserPaths: (paths) => set({ userPaths: paths }),
  updateUserPath: (colorId, path) =>
    set((state) => ({
      userPaths: { ...state.userPaths, [colorId]: path },
    })),
  setActiveColor: (color) => set({ activeColor: color }),
  setIsLevelComplete: (complete) => set({ isLevelComplete: complete }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setHintUsed: (used) => set({ hintUsed: used }),
  setGenerationWarning: (warning) => set({ generationWarning: warning }),
  setLevelUsedFallback: (used) => set({ levelUsedFallback: used }),
  setLevelValidationError: (error) => set({ levelValidationError: error }),
  
  addMoveToHistory: () =>
    set((state) => {
      const newHistory = [
        ...state.moveHistory,
        { paths: { ...state.userPaths }, timestamp: Date.now() },
      ];
      return {
        moveHistory: newHistory.slice(-50),
      };
    }),
  /**
   * Undoes the last move by restoring previous state from history.
   * Automatically trims history if it exceeds 100 entries to prevent memory issues.
   * Decrements move count and clears active color selection.
   */
  undoLastMove: () =>
    set((state) => {
      if (state.moveHistory.length === 0) return state;
      // Trim history if it grows too large (memory optimization)
      if (state.moveHistory.length > 100) {
        return {
          moveHistory: state.moveHistory.slice(-50),
        };
      }
      const previousMove = state.moveHistory[state.moveHistory.length - 1];
      return {
        userPaths: { ...previousMove.paths },
        moveHistory: state.moveHistory.slice(0, -1),
        moveCount: Math.max(0, state.moveCount - 1),
        activeColor: null,
      };
    }),
  clearMoveHistory: () => set({ moveHistory: [] }),
  setPerfectScore: (score) => set({ perfectScore: score }),
  incrementMoveCount: () => set((state) => ({ moveCount: state.moveCount + 1 })),
  resetMoveCount: () => set({ moveCount: 0 }),
  setLevelStartTime: (time) => set({ levelStartTime: time }),
  setLevelCompletionTime: (time) => set({ levelCompletionTime: time }),
  addPreGeneratedLevel: (level) =>
    set((state) => ({
      preGeneratedLevels: [...state.preGeneratedLevels, level].slice(-2), // Keep max 2 levels
    })),
  shiftPreGeneratedLevel: () => {
    const state = get();
    if (state.preGeneratedLevels.length === 0) return null;
    const level = state.preGeneratedLevels[0];
    set({ preGeneratedLevels: state.preGeneratedLevels.slice(1) });
    return level;
  },
  clearPreGeneratedLevels: () => set({ preGeneratedLevels: [] }),
  resetBoard: () =>
    set({
      userPaths: {},
      activeColor: null,
      isLevelComplete: false,
      moveHistory: [],
      moveCount: 0,
      perfectScore: null,
      levelStartTime: null,
      levelCompletionTime: null,
    }),
});

