import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PersonalBest {
  bestTime: number
  bestMoves: number
  bestStars: 1 | 2 | 3
}

interface RecordsState {
  records: Record<string, PersonalBest>
}

interface RecordsActions {
  submitResult: (
  key: string,
  time: number,
  moves: number,
  stars: 1 | 2 | 3,
  ) => boolean
  getRecord: (key: string) => PersonalBest | undefined
}

type RecordsStore = RecordsState & RecordsActions

export function makeRecordKey(
  width: number,
  height: number,
  difficulty: string,
): string {
  return `${width}x${height}-${difficulty}`;
}

const useRecordsStoreBase = create<RecordsStore>()(
  persist(
  (set, get) => ({
    records: {},

    submitResult: (key, time, moves, stars) => {
    const current = get().records[key];
    const isNewPB =
      !current ||
      stars > current.bestStars ||
      (stars === current.bestStars && time < current.bestTime) ||
      (stars === current.bestStars &&
      time === current.bestTime &&
      moves < current.bestMoves);

    if (isNewPB) {
      set((state) => ({
      records: {
        ...state.records,
        [key]: { bestTime: time, bestMoves: moves, bestStars: stars },
      },
      }));
    }
    return isNewPB;
    },

    getRecord: (key) => get().records[key],
  }),
  {
    name: "flow-master-records",
    version: 1,
  },
  ),
);

import { useShallow } from "zustand/react/shallow";

export const useRecords = () => useRecordsStoreBase(useShallow((s) => s.records));
export const useSubmitResult = () => useRecordsStoreBase(useShallow((s) => s.submitResult));

