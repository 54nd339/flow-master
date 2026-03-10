import { PuzzleData } from "@/lib/engine/types";

export function encodePuzzle(puzzle: PuzzleData): string {
  return puzzle.serialize();
}

export function decodePuzzle(encoded: string): PuzzleData | null {
  return PuzzleData.deserialize(encoded);
}

export function puzzleToQueryParams(puzzle: PuzzleData, difficulty: string): string {
  const params = new URLSearchParams();
  params.set("g", `${puzzle.width}x${puzzle.height}`);
  params.set("d", difficulty);
  if (puzzle.seed != null) params.set("s", String(puzzle.seed));
  return params.toString();
}

export function parseQueryParams(search: string): {
  width?: number
  height?: number
  difficulty?: string
  seed?: number
} | null {
  const params = new URLSearchParams(search);
  const g = params.get("g");
  const d = params.get("d");
  const s = params.get("s");
  if (!g) return null;
  const match = g.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return {
    width: parseInt(match[1]),
    height: parseInt(match[2]),
    difficulty: d ?? undefined,
    seed: s ? parseInt(s) : undefined,
  };
}
