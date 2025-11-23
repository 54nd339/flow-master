import { GameProgress } from '@/types';
import { HINTS_START } from '@/config';

export const defaultProgress: GameProgress = {
  themeId: 'WATER',
  colorblind: false,
  sound: false,
  music: false,
  stage: 1,
  level: 1,
  maxStage: 1,
  hints: HINTS_START,
  levelsSinceHint: 0,
  history: {},
  dailySolved: null,
  timeAttackHigh: 0,
  timeAttackHighScores: {},
  timeAttackPuzzlesCompleted: 0,
  flows: 0,
  dailyStreak: 0,
  lastDailyDate: null,
  perfectClears: 0,
  totalLevelsCompleted: 0,
  campaignLevelsCompleted: 0,
  totalTimePlayed: 0,
  unlockedThemes: ['WATER'],
  achievements: {},
  generatedLevelHashes: [],
};

