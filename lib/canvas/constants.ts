export const MIN_TOUCH_TARGET = 44;

export const NEIGHBORS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export const CB_SYMBOLS = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "hexagon",
  "cross",
  "heart",
  "pentagon",
  "plus",
] as const;

export type ColorblindSymbol = (typeof CB_SYMBOLS)[number];
