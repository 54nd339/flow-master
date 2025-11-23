import { ReactNode, ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ThemeRank {
  name: string;
  color: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface ColorPalette {
  id: number;
  hex: string;
}

export interface ThemePreset {
  id: string;
  label: string;
  ranks: ThemeRank[];
  palette: ColorPalette[];
  bg: (idx: number) => ReactNode;
}

export interface Stage {
  id: number;
  w: number;
  h: number;
  minC: number;
  maxC: number;
}

export interface Anchor {
  colorId: number;
  type: 'endpoint';
}

export interface Path {
  colorId: number;
  path: number[];
}

export interface LevelData {
  width: number;
  height: number;
  anchors: Record<number, Anchor>;
  difficulty: number;
  solvedPaths?: Path[];
}

export interface GameProgress {
  themeId: string;
  colorblind: boolean;
  sound: boolean; // Sound effects (pop, glissando)
  music: boolean; // Background music
  stage: number;
  level: number;
  maxStage: number;
  hints: number;
  levelsSinceHint: number;
  history: Record<number, string[]>;
  dailySolved: string | null;
  timeAttackHigh: number; // Legacy - kept for migration
  timeAttackHighScores: Record<string, number>; // Key: "gridSize-timeLimit", Value: high score
  timeAttackPuzzlesCompleted: number; // Total time attack puzzles completed across all sessions
  // Currency and stats
  flows: number; // Currency earned
  dailyStreak: number; // Current daily challenge streak
  lastDailyDate: string | null; // Last date daily challenge was completed
  perfectClears: number; // Total perfect clears (3 stars)
  totalLevelsCompleted: number; // Total levels completed (all modes)
  campaignLevelsCompleted: number; // Campaign levels only
  totalTimePlayed: number; // Total time played in seconds
  unlockedThemes: string[]; // List of unlocked theme IDs
  achievements: Record<string, boolean>; // Achievement ID -> unlocked
  generatedLevelHashes: string[]; // Global set of level hashes generated across all game modes
}

export interface RankUp {
  old: ThemeRank;
  new: ThemeRank;
}

export type ViewMode = 'PLAY' | 'CREATE' | 'DAILY' | 'TIME_ATTACK' | 'ZEN' | 'PROFILE' | 'ACHIEVEMENTS' | 'SETTINGS';

export interface TimeAttackConfig {
  gridSize: number;
  timeLimit: number; // in seconds
  puzzlesCompleted: number;
  isActive: boolean;
  timeRemaining: number;
}

export interface MoveHistory {
  paths: Record<number, number[]>;
  timestamp: number;
}

export interface PerfectScore {
  moves: number;
  minMoves: number;
  stars: number; // 0-3 stars
  perfect: boolean; // no backtracking, no line breaks
}

