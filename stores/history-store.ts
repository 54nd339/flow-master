import { get as idbGet, set as idbSet } from "idb-keyval";
import { create } from "zustand";

const IDB_KEY = "flow-master-history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  seed: number | undefined
  gridWidth: number
  gridHeight: number
  difficulty: string
  time: number
  moves: number
  stars: 1 | 2 | 3
  date: number
}

interface HistoryState {
  entries: HistoryEntry[]
  loaded: boolean
}

interface HistoryActions {
  load: () => Promise<void>
  addEntry: (entry: HistoryEntry) => void
  clear: () => void
  totalSolved: () => number
}

type HistoryStore = HistoryState & HistoryActions

const useHistoryStoreBase = create<HistoryStore>((set, get) => ({
  entries: [],
  loaded: false,

  load: async () => {
  if (get().loaded) return;
  try {
    const saved = await idbGet<HistoryEntry[]>(IDB_KEY);
    if (saved && Array.isArray(saved)) {
    set({ entries: saved, loaded: true });
    } else {
    set({ loaded: true });
    }
  } catch {
    set({ loaded: true });
  }
  },

  addEntry: (entry) => {
  const updated = [entry, ...get().entries].slice(0, MAX_ENTRIES);
  set({ entries: updated });
  idbSet(IDB_KEY, updated).catch((err) => console.warn("Failed to persist history:", err));
  },

  clear: () => {
  set({ entries: [] });
  idbSet(IDB_KEY, []).catch((err) => console.warn("Failed to clear history:", err));
  },

  totalSolved: () => get().entries.length,
}));

import { useShallow } from "zustand/react/shallow";

export const getHistoryState = () => useHistoryStoreBase.getState();



export const useEntries = () => useHistoryStoreBase(useShallow((s) => s.entries));
export const useLoad = () => useHistoryStoreBase(useShallow((s) => s.load));
export const useAddEntry = () => useHistoryStoreBase(useShallow((s) => s.addEntry));
