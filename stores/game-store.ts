import { create } from "zustand";

import {
  calculateStars,
  checkAllConnected,
  computePipePercent,
  countFilledCells,
  rebuildFlows,
} from "@/lib/engine/game-logic";
import type { GameAction, GameStore, PuzzleData } from "@/lib/engine/types";

const useGameStoreBase = create<GameStore>((set) => ({
  moveHistory: [],
  redoStack: [],
  currentFlows: new Map(),
  activeFlowId: null,
  totalCells: 0,
  timerSeconds: 0,
  timerRunning: false,
  isComplete: false,
  moveCount: 0,
  pipePercent: 0,
  starRating: null,
  completedAt: null,

  initPuzzle: (puzzle: PuzzleData) =>
  set({
    moveHistory: [],
    redoStack: [],
    currentFlows: new Map(),
    activeFlowId: null,
    totalCells: puzzle.width * puzzle.height,
    timerSeconds: 0,
    timerRunning: true,
    isComplete: false,
    moveCount: 0,
    pipePercent: 0,
    starRating: null,
    completedAt: null,
  }),

  pushAction: (action: GameAction, puzzle: PuzzleData) =>
  set((state) => {
    if (state.isComplete) return state;

    const newHistory = [...state.moveHistory, action];
    const newFlows = rebuildFlows(newHistory);
    const filled = countFilledCells(newFlows);
    const newPipePercent = computePipePercent(filled, state.totalCells);
    const newMoveCount =
    action.type === "draw" ? state.moveCount + 1 : state.moveCount;

    const allFilled = filled === state.totalCells;
    const allConnected = allFilled && checkAllConnected(newFlows, puzzle);

    if (allConnected) {
    const optimalMoves = puzzle.solution.reduce(
      (sum, p) => sum + p.points.length,
      0,
    );
    return {
      moveHistory: newHistory,
      redoStack: [],
      currentFlows: newFlows,
      moveCount: newMoveCount,
      pipePercent: 100,
      isComplete: true,
      timerRunning: false,
      starRating: calculateStars(newMoveCount, optimalMoves),
      completedAt: Date.now(),
    };
    }

    return {
    moveHistory: newHistory,
    redoStack: [],
    currentFlows: newFlows,
    moveCount: newMoveCount,
    pipePercent: newPipePercent,
    };
  }),

  undo: () =>
  set((state) => {
    if (state.moveHistory.length === 0 || state.isComplete) return state;
    const undone = state.moveHistory[state.moveHistory.length - 1];
    const newHistory = state.moveHistory.slice(0, -1);
    const newFlows = rebuildFlows(newHistory);
    const filled = countFilledCells(newFlows);
    return {
    moveHistory: newHistory,
    redoStack: [undone, ...state.redoStack],
    currentFlows: newFlows,
    pipePercent: computePipePercent(filled, state.totalCells),
    };
  }),

  redo: () =>
  set((state) => {
    if (state.redoStack.length === 0 || state.isComplete) return state;
    const action = state.redoStack[0];
    const newHistory = [...state.moveHistory, action];
    const newFlows = rebuildFlows(newHistory);
    const filled = countFilledCells(newFlows);
    return {
    moveHistory: newHistory,
    redoStack: state.redoStack.slice(1),
    currentFlows: newFlows,
    moveCount:
      action.type === "draw" ? state.moveCount + 1 : state.moveCount,
    pipePercent: computePipePercent(filled, state.totalCells),
    };
  }),

  clearFlow: (flowId: string) =>
  set((state) => {
    if (state.isComplete) return state;
    const eraseAction: GameAction = { type: "erase", flowId, path: [] };
    const newHistory = [...state.moveHistory, eraseAction];
    const newFlows = rebuildFlows(newHistory);
    const filled = countFilledCells(newFlows);
    return {
    moveHistory: newHistory,
    redoStack: [],
    currentFlows: newFlows,
    pipePercent: computePipePercent(filled, state.totalCells),
    };
  }),

  setActiveFlow: (flowId: string | null) => set({ activeFlowId: flowId }),

  startTimer: () => set({ timerSeconds: 0, timerRunning: true }),
  stopTimer: () => set({ timerRunning: false }),
  pauseTimer: () => set({ timerRunning: false }),
  resumeTimer: () =>
  set((state) => (state.isComplete ? state : { timerRunning: true })),
  tick: () =>
  set((state) =>
    state.timerRunning ? { timerSeconds: state.timerSeconds + 1 } : state,
  ),

  reset: () =>
  set({
    moveHistory: [],
    redoStack: [],
    currentFlows: new Map(),
    activeFlowId: null,
    totalCells: 0,
    timerSeconds: 0,
    timerRunning: false,
    isComplete: false,
    moveCount: 0,
    pipePercent: 0,
    starRating: null,
    completedAt: null,
  }),
}));

import { useShallow } from "zustand/react/shallow";

export const getGameState = () => useGameStoreBase.getState();
export const subscribeToGameStore = useGameStoreBase.subscribe;

export const useMoveHistory = () => useGameStoreBase(useShallow((s) => s.moveHistory));
export const useRedoStack = () => useGameStoreBase(useShallow((s) => s.redoStack));
export const useCurrentFlows = () => useGameStoreBase(useShallow((s) => s.currentFlows));
export const useActiveFlowId = () => useGameStoreBase(useShallow((s) => s.activeFlowId));
export const useTotalCells = () => useGameStoreBase(useShallow((s) => s.totalCells));
export const useTimerSeconds = () => useGameStoreBase(useShallow((s) => s.timerSeconds));
export const useTimerRunning = () => useGameStoreBase(useShallow((s) => s.timerRunning));
export const useIsComplete = () => useGameStoreBase(useShallow((s) => s.isComplete));
export const useMoveCount = () => useGameStoreBase(useShallow((s) => s.moveCount));
export const usePipePercent = () => useGameStoreBase(useShallow((s) => s.pipePercent));
export const useStarRating = () => useGameStoreBase(useShallow((s) => s.starRating));
export const useCompletedAt = () => useGameStoreBase(useShallow((s) => s.completedAt));
export const useInitPuzzle = () => useGameStoreBase(useShallow((s) => s.initPuzzle));
export const usePushAction = () => useGameStoreBase(useShallow((s) => s.pushAction));
export const useUndo = () => useGameStoreBase(useShallow((s) => s.undo));
export const useRedo = () => useGameStoreBase(useShallow((s) => s.redo));
export const useClearFlow = () => useGameStoreBase(useShallow((s) => s.clearFlow));
export const useSetActiveFlow = () => useGameStoreBase(useShallow((s) => s.setActiveFlow));
export const useStartTimer = () => useGameStoreBase(useShallow((s) => s.startTimer));
export const useStopTimer = () => useGameStoreBase(useShallow((s) => s.stopTimer));
export const usePauseTimer = () => useGameStoreBase(useShallow((s) => s.pauseTimer));
export const useResumeTimer = () => useGameStoreBase(useShallow((s) => s.resumeTimer));
export const useTick = () => useGameStoreBase(useShallow((s) => s.tick));
export const useReset = () => useGameStoreBase(useShallow((s) => s.reset));
