import { ViewMode, RankUp } from '@/types';
import type { StoreApi } from 'zustand';
import type { GameState } from './game-store';

type SetState = StoreApi<GameState>['setState'];

export interface UIStateSlice {
  viewMode: ViewMode;
  showStageSelect: boolean;
  showThemeSelect: boolean;
  showRankUp: RankUp | null;

  setViewMode: (mode: ViewMode) => void;
  setShowStageSelect: (show: boolean) => void;
  setShowThemeSelect: (show: boolean) => void;
  setShowRankUp: (rankUp: RankUp | null) => void;
}

export const createUIStateSlice = (set: SetState): UIStateSlice => ({
  viewMode: 'PLAY',
  showStageSelect: false,
  showThemeSelect: false,
  showRankUp: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setShowStageSelect: (show) => set({ showStageSelect: show }),
  setShowThemeSelect: (show) => set({ showThemeSelect: show }),
  setShowRankUp: (rankUp) => set({ showRankUp: rankUp }),
});
