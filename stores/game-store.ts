import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameProgress, RankUp, TimeAttackConfig } from '@/types';
import { THEME_PRESETS } from '@/constants';
import { STORAGE_KEY, LEVELS_FOR_HINT, STAGES, LEVELS_PER_STAGE } from '@/config';
import { compressLevel } from '@/lib';
import { defaultProgress } from './progress-store';
import { createGameStateSlice, GameStateSlice } from './game-state-store';
import { createUIStateSlice, UIStateSlice } from './ui-store';
import { createCreatorStateSlice, CreatorStateSlice } from './creator-store';
import { createCurrencyStateSlice, CurrencyStateSlice } from './currency-store';
import { createAchievementStateSlice, AchievementStateSlice } from './achievement-store';

export interface GameState extends GameStateSlice, UIStateSlice, CreatorStateSlice, CurrencyStateSlice, AchievementStateSlice {
  progress: GameProgress;
  timeAttack: TimeAttackConfig | null;
  dailyChallengeDate: string | null;
  
  setProgress: (progress: Partial<GameProgress>) => void;
  setTimeAttack: (config: TimeAttackConfig | null | ((prev: TimeAttackConfig | null) => TimeAttackConfig | null)) => void;
  setDailyChallengeDate: (date: string | null) => void;
  resetProgress: () => void;
  handleProgressSave: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...createGameStateSlice(set, get),
      ...createUIStateSlice(set),
      ...createCreatorStateSlice(set),
      ...createCurrencyStateSlice(set, get),
      ...createAchievementStateSlice(set, get),
      
      progress: defaultProgress,
      timeAttack: null,
      dailyChallengeDate: null,
      
      setProgress: (updates) =>
        set((state) => ({
          progress: { ...state.progress, ...updates },
        })),
      
      setTimeAttack: (config) =>
        set((state) => ({
          timeAttack: typeof config === 'function' ? config(state.timeAttack) : config,
        })),
      setDailyChallengeDate: (date) => set({ dailyChallengeDate: date }),
      
      resetProgress: () => {
        set({
          progress: defaultProgress,
          levelData: null,
          userPaths: {},
          activeColor: null,
          isLevelComplete: false,
          moveHistory: [],
          moveCount: 0,
          perfectScore: null,
          viewMode: 'PLAY',
        });
      },
      
      /**
       * Handles level completion progression logic:
       * - Saves level to history (only if not previously solved)
       * - Awards hints every N levels completed
       * - Advances level/stage progression
       * - Triggers rank-up when completing groups of 5 stages
       */
      handleProgressSave: () => {
        const state = get();
        if (!state.levelData) return;
        
        const levelString = compressLevel(state.levelData);
        
        set((prevState) => {
          const currentStageHist = prevState.progress.history[prevState.progress.stage] || [];
          const currentLevelIdx = prevState.progress.level - 1;
          let newHistory = { ...prevState.progress.history };
          let isNewSolve = false;
          
          // Only save if this level hasn't been solved before (avoid overwriting)
          if (!currentStageHist[currentLevelIdx]) {
            newHistory[prevState.progress.stage] = [...currentStageHist, levelString];
            isNewSolve = true;
          }
          
          // Hint system: award hints every N levels completed
          let nextHints = prevState.progress.hints;
          let nextLevelsSince = prevState.progress.levelsSinceHint;
          
          if (isNewSolve) {
            nextLevelsSince += 1;
            if (nextLevelsSince >= LEVELS_FOR_HINT) {
              nextHints += 1;
              nextLevelsSince = 0;
            }
          }
          
          // Progress to next level/stage
          let nextLevel = prevState.progress.level;
          let nextStage = prevState.progress.stage;
          let newMaxStage = prevState.progress.maxStage;
          
          // Advance level if new solve or replaying the last solved level
          if (isNewSolve || currentLevelIdx === currentStageHist.length - 1) {
            nextLevel = prevState.progress.level + 1;
          }
          
          // Stage progression: when completing all levels in a stage
          if (nextLevel > LEVELS_PER_STAGE && prevState.progress.stage < STAGES.length) {
            nextStage = prevState.progress.stage + 1;
            nextLevel = 1;
            newMaxStage = Math.max(newMaxStage, nextStage);
            
            // Rank up system: groups of 5 stages = new rank tier
            // Each rank tier corresponds to a visual theme rank (e.g., Novice -> Apprentice)
            const oldGroup = Math.ceil(prevState.progress.stage / 5);
            const newGroup = Math.ceil(nextStage / 5);
            
            if (newGroup > oldGroup) {
              const theme = THEME_PRESETS[prevState.progress.themeId || 'WATER'];
              if (theme) {
                const rankUp: RankUp = {
                  old: theme.ranks[oldGroup - 1],
                  new: theme.ranks[newGroup - 1],
                };
                setTimeout(() => set({ showRankUp: rankUp }), 100);
              }
            }
          }
          
          return {
            progress: {
              ...prevState.progress,
              level: nextLevel,
              stage: nextStage,
              maxStage: newMaxStage,
              history: newHistory,
              hints: nextHints,
              levelsSinceHint: nextLevelsSince,
            },
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ progress: state.progress, dailyChallengeDate: state.dailyChallengeDate }),
      // Migration: initialize new fields for existing saved data
      // Ensures backward compatibility when adding new progress fields
      migrate: (persistedState: any) => {
        if (persistedState?.state?.progress) {
          const progress = persistedState.state.progress;
          return {
            ...persistedState,
            state: {
              ...persistedState.state,
              progress: {
                ...progress,
                // Initialize new currency/progression fields with defaults if missing
                sound: progress.sound ?? false,
                music: progress.music ?? false,
                flows: progress.flows ?? 0,
                dailyStreak: progress.dailyStreak ?? 0,
                lastDailyDate: progress.lastDailyDate ?? null,
                perfectClears: progress.perfectClears ?? 0,
                totalLevelsCompleted: progress.totalLevelsCompleted ?? 0,
                campaignLevelsCompleted: progress.campaignLevelsCompleted ?? 0,
                totalTimePlayed: progress.totalTimePlayed ?? 0,
                timeAttackPuzzlesCompleted: progress.timeAttackPuzzlesCompleted ?? 0,
                unlockedThemes: progress.unlockedThemes ?? ['WATER'],
                achievements: progress.achievements ?? {},
              },
            },
          };
        }
        return persistedState;
      },
    }
  )
);
