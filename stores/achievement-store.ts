import { ACHIEVEMENTS } from '@/config';
import type { StoreApi } from 'zustand';
import type { GameState } from './game-store';

type SetState = StoreApi<GameState>['setState'];
type GetState = StoreApi<GameState>['getState'];

export interface AchievementStateSlice {
  checkAchievements: () => void;
}

export const createAchievementStateSlice = (set: SetState, get: GetState): AchievementStateSlice => ({
  checkAchievements: () => {
    const state = get();
    const newAchievements: Record<string, boolean> = { ...state.progress.achievements };
    let flowsToAdd = 0;
    
    // Helper to get max time attack score
    const getMaxTimeAttackScore = () => {
      const scores = state.progress.timeAttackHighScores || {};
      const scoreValues = Object.values(scores) as number[];
      return scoreValues.length > 0 ? Math.max(...scoreValues, 0) : 0;
    };
    
    // Helper to count unlocked themes
    const getUnlockedThemeCount = () => {
      return (state.progress.unlockedThemes || ['WATER']).length;
    };
    
    ACHIEVEMENTS.forEach((achievement: { id: string; reward: number }) => {
      if (newAchievements[achievement.id]) return;
      
      let unlocked = false;
      switch (achievement.id) {
        // First Steps
        case 'first_clear':
          unlocked = state.progress.totalLevelsCompleted >= 1;
          break;
        case 'levels_10':
          unlocked = state.progress.totalLevelsCompleted >= 10;
          break;
        case 'levels_25':
          unlocked = state.progress.totalLevelsCompleted >= 25;
          break;
        case 'levels_50':
          unlocked = state.progress.totalLevelsCompleted >= 50;
          break;
        case 'levels_100':
          unlocked = state.progress.totalLevelsCompleted >= 100;
          break;
        case 'levels_250':
          unlocked = state.progress.totalLevelsCompleted >= 250;
          break;
        case 'levels_500':
          unlocked = state.progress.totalLevelsCompleted >= 500;
          break;
        case 'levels_1000':
          unlocked = state.progress.totalLevelsCompleted >= 1000;
          break;
        
        // Campaign Progression
        case 'campaign_10':
          unlocked = state.progress.campaignLevelsCompleted >= 10;
          break;
        case 'campaign_50':
          unlocked = state.progress.campaignLevelsCompleted >= 50;
          break;
        case 'campaign_100':
          unlocked = state.progress.campaignLevelsCompleted >= 100;
          break;
        case 'stage_5':
          unlocked = state.progress.stage >= 5;
          break;
        case 'stage_10':
          unlocked = state.progress.stage >= 10;
          break;
        case 'stage_15':
          unlocked = state.progress.stage >= 15;
          break;
        case 'stage_20':
          unlocked = state.progress.stage >= 20;
          break;
        case 'stage_25':
          unlocked = state.progress.stage >= 25;
          break;
        
        // Perfect Clears
        case 'perfect_1':
          unlocked = state.progress.perfectClears >= 1;
          break;
        case 'perfect_5':
          unlocked = state.progress.perfectClears >= 5;
          break;
        case 'perfect_10':
          unlocked = state.progress.perfectClears >= 10;
          break;
        case 'perfect_25':
          unlocked = state.progress.perfectClears >= 25;
          break;
        case 'perfect_50':
          unlocked = state.progress.perfectClears >= 50;
          break;
        case 'perfect_100':
          unlocked = state.progress.perfectClears >= 100;
          break;
        case 'perfect_250':
          unlocked = state.progress.perfectClears >= 250;
          break;
        
        // Daily Challenge Streaks
        case 'streak_3':
          unlocked = state.progress.dailyStreak >= 3;
          break;
        case 'streak_7':
          unlocked = state.progress.dailyStreak >= 7;
          break;
        case 'streak_14':
          unlocked = state.progress.dailyStreak >= 14;
          break;
        case 'streak_30':
          unlocked = state.progress.dailyStreak >= 30;
          break;
        case 'streak_60':
          unlocked = state.progress.dailyStreak >= 60;
          break;
        case 'streak_100':
          unlocked = state.progress.dailyStreak >= 100;
          break;
        
        // Time Attack
        case 'time_attack_1':
          unlocked = (state.progress.timeAttackPuzzlesCompleted || 0) >= 1;
          break;
        case 'time_attack_5':
          unlocked = (state.progress.timeAttackPuzzlesCompleted || 0) >= 5;
          break;
        case 'time_attack_10':
          unlocked = (state.progress.timeAttackPuzzlesCompleted || 0) >= 10;
          break;
        case 'time_attack_25':
          unlocked = (state.progress.timeAttackPuzzlesCompleted || 0) >= 25;
          break;
        case 'time_attack_50':
          unlocked = (state.progress.timeAttackPuzzlesCompleted || 0) >= 50;
          break;
        case 'time_attack_high_5':
          unlocked = getMaxTimeAttackScore() >= 5;
          break;
        case 'time_attack_high_10':
          unlocked = getMaxTimeAttackScore() >= 10;
          break;
        case 'time_attack_high_20':
          unlocked = getMaxTimeAttackScore() >= 20;
          break;
        
        // Currency & Economy
        case 'flows_100':
          unlocked = state.progress.flows >= 100;
          break;
        case 'flows_500':
          unlocked = state.progress.flows >= 500;
          break;
        case 'flows_1000':
          unlocked = state.progress.flows >= 1000;
          break;
        case 'flows_5000':
          unlocked = state.progress.flows >= 5000;
          break;
        case 'flows_10000':
          unlocked = state.progress.flows >= 10000;
          break;
        case 'unlock_theme_1':
          unlocked = getUnlockedThemeCount() >= 2; // At least 1 unlocked (WATER is default)
          break;
        case 'unlock_theme_all':
          unlocked = getUnlockedThemeCount() >= 5; // All 5 themes unlocked
          break;
        
        // Time Played
        case 'time_1h':
          unlocked = (state.progress.totalTimePlayed || 0) >= 3600;
          break;
        case 'time_5h':
          unlocked = (state.progress.totalTimePlayed || 0) >= 18000;
          break;
        case 'time_10h':
          unlocked = (state.progress.totalTimePlayed || 0) >= 36000;
          break;
        case 'time_24h':
          unlocked = (state.progress.totalTimePlayed || 0) >= 86400;
          break;
        case 'time_100h':
          unlocked = (state.progress.totalTimePlayed || 0) >= 360000;
          break;
      }
      
      if (unlocked) {
        newAchievements[achievement.id] = true;
        flowsToAdd += achievement.reward;
      }
    });
    
    if (Object.keys(newAchievements).length > Object.keys(state.progress.achievements).length) {
      set((prevState) => ({
        progress: {
          ...prevState.progress,
          achievements: newAchievements,
          flows: prevState.progress.flows + flowsToAdd,
        },
      }));
    }
  },
});

