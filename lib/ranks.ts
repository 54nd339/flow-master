export interface Rank {
  id: string
  name: string
  icon: string
  minXP: number
  color: string
}

export const RANKS: Rank[] = [
  { id: "novice",       name: "Novice",       icon: "🌱", minXP: 0,      color: "#6b7280" },
  { id: "apprentice",   name: "Apprentice",   icon: "📘", minXP: 100,    color: "#3b82f6" },
  { id: "solver",       name: "Solver",       icon: "🧩", minXP: 500,    color: "#22c55e" },
  { id: "expert",       name: "Expert",       icon: "⚡", minXP: 1500,   color: "#f59e0b" },
  { id: "master",       name: "Master",       icon: "🏅", minXP: 4000,   color: "#ef4444" },
  { id: "grandmaster",  name: "Grandmaster",  icon: "💎", minXP: 10000,  color: "#8b5cf6" },
  { id: "legend",       name: "Legend",       icon: "👑", minXP: 25000,  color: "#f97316" },
];

export function getRankForXP(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXP) current = rank;
    else break;
  }
  return current;
}

function getNextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (xp < rank.minXP) return rank;
  }
  return null;
}

export function getXPProgress(xp: number): { current: Rank; next: Rank | null; progress: number } {
  const current = getRankForXP(xp);
  const next = getNextRank(xp);

  if (!next) {
    return { current, next: null, progress: 1 };
  }

  const range = next.minXP - current.minXP;
  const earned = xp - current.minXP;
  return { current, next, progress: range > 0 ? earned / range : 1 };
}

export function calculateXP(
  stars: 1 | 2 | 3,
  gridArea: number,
  timeSeconds: number,
  difficulty: string,
): number {
  const difficultyMultiplier =
    difficulty === "hard" ? 1.5 : difficulty === "medium" ? 1.0 : 0.7;

  const areaBonus = Math.floor(Math.sqrt(gridArea) * 2);
  const starBonus = stars * 5;
  const speedBonus = Math.max(0, Math.floor(30 - timeSeconds));

  return Math.round((areaBonus + starBonus + speedBonus) * difficultyMultiplier);
}
