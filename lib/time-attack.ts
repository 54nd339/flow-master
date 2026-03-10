export const GRID_SIZES = [5, 6, 7, 8, 9] as const;

export const TIME_LIMITS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "4m", value: 240 },
] as const;

export const LS_KEY = "flow-master-time-attack-scores";

export type Phase = "config" | "playing" | "results";

export interface HighScore {
  puzzlesSolved: number;
  score: number;
  gridSize: number;
  timeLimit: number;
}

export function difficultyMultiplier(size: number): number {
  if (size <= 5) return 1;
  if (size <= 7) return 1.5;
  return 2;
}

export function loadHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHighScore(entry: HighScore): void {
  const scores = loadHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(LS_KEY, JSON.stringify(scores.slice(0, 50)));
}
