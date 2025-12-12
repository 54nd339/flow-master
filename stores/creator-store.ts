import type { StoreApi } from 'zustand';
import type { GameState } from './game-store';

type SetState = StoreApi<GameState>['setState'];

export interface CreatorStateSlice {
  creatorW: number;
  creatorH: number;
  creatorLocked: boolean;
  creatorAnchors: Record<number, { colorId: number; type: 'endpoint' }>;
  creatorSelectedColor: number;
  creatorError: string | null;
  creatorSuccess: string | null;
  importCode: string;

  setCreatorW: (w: number) => void;
  setCreatorH: (h: number) => void;
  setCreatorLocked: (locked: boolean) => void;
  setCreatorAnchors: (anchors: Record<number, { colorId: number; type: 'endpoint' }>) => void;
  updateCreatorAnchor: (idx: number, anchor: { colorId: number; type: 'endpoint' } | null) => void;
  setCreatorSelectedColor: (color: number) => void;
  setCreatorError: (error: string | null) => void;
  setCreatorSuccess: (success: string | null) => void;
  setImportCode: (code: string) => void;
}

export const createCreatorStateSlice = (set: SetState): CreatorStateSlice => ({
  creatorW: 5,
  creatorH: 5,
  creatorLocked: true,
  creatorAnchors: {},
  creatorSelectedColor: 0,
  creatorError: null,
  creatorSuccess: null,
  importCode: '',

  setCreatorW: (w) => set({ creatorW: w }),
  setCreatorH: (h) => set({ creatorH: h }),
  setCreatorLocked: (locked) => set({ creatorLocked: locked }),
  setCreatorAnchors: (anchors) => set({ creatorAnchors: anchors }),
  updateCreatorAnchor: (idx, anchor) =>
    set((state) => {
      const newAnchors = { ...state.creatorAnchors };
      if (anchor) {
        newAnchors[idx] = anchor;
      } else {
        delete newAnchors[idx];
      }
      return { creatorAnchors: newAnchors };
    }),
  setCreatorSelectedColor: (color) => set({ creatorSelectedColor: color }),
  setCreatorError: (error) => set({ creatorError: error }),
  setCreatorSuccess: (success) => set({ creatorSuccess: success }),
  setImportCode: (code) => set({ importCode: code }),
});
