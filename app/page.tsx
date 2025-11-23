'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useGameInitialization, useTheme, useCurrentRank } from '@/hooks';
import { startLevel, getTodayDateString, backgroundMusic } from '@/lib';
import { GameHeader, BottomNav, ViewModeRenderer } from '@/components/game';
import { ToastProvider } from '@/components/ui';
import { ErrorBoundary } from '@/components/error-boundary';

export default function FlowGame() {
  const {
    levelData,
    isGenerating,
    dailyChallengeDate,
    setLevelData,
    setIsGenerating,
    setUserPaths,
    setIsLevelComplete,
    setGenerationWarning,
    setDailyChallengeDate,
    setLevelUsedFallback,
    setLevelValidationError,
  } = useGameStore();

  const progress = useGameStore((state) => state.progress);
  const viewMode = useGameStore((state) => state.viewMode);
  const mounted = useGameInitialization();
  const activeTheme = useTheme();
  const currentRank = useCurrentRank();

  useEffect(() => {
    if (!progress.music) {
      backgroundMusic.stop();
    }
  }, [progress.music]);

  const GAME_MODES = ['PLAY', 'DAILY', 'TIME_ATTACK', 'ZEN', 'CREATE'] as const;
  const prevViewModeRef = useRef(viewMode);
  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      const prevWasGameMode = GAME_MODES.includes(prevViewModeRef.current as any);
      const currIsGameMode = GAME_MODES.includes(viewMode as any);
      
      if (prevWasGameMode || currIsGameMode) {
        setLevelData(null);
        setUserPaths({});
        setIsLevelComplete(false);
        setGenerationWarning(null);
        const store = useGameStore.getState();
        store.resetMoveCount();
        store.clearMoveHistory();
        store.setActiveColor(null);
      }
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, setLevelData, setUserPaths, setIsLevelComplete, setGenerationWarning]);

  const { setProgress } = useGameStore();
  
  const {
    shiftPreGeneratedLevel,
    addPreGeneratedLevel,
  } = useGameStore();
  
  // Auto-load level for campaign mode
  useEffect(() => {
    if (mounted && !levelData && !isGenerating && viewMode === 'PLAY') {
      startLevel(null, null, progress, setLevelData, setIsGenerating, setGenerationWarning, setProgress, setLevelUsedFallback, setLevelValidationError, shiftPreGeneratedLevel, addPreGeneratedLevel);
    }
  }, [mounted, levelData, isGenerating, progress, viewMode, setLevelData, setIsGenerating, setGenerationWarning, setProgress, shiftPreGeneratedLevel, addPreGeneratedLevel]);

  useEffect(() => {
    if (viewMode === 'DAILY') {
      const today = getTodayDateString();
      if (dailyChallengeDate && dailyChallengeDate !== today && levelData) {
        setLevelData(null);
        setUserPaths({});
        setIsLevelComplete(false);
        setDailyChallengeDate(null);
      }
      if (!dailyChallengeDate && levelData) {
        setLevelData(null);
        setUserPaths({});
        setIsLevelComplete(false);
      }
    }
  }, [viewMode, dailyChallengeDate, levelData, setLevelData, setUserPaths, setIsLevelComplete, setDailyChallengeDate]);

  const handleUserInteraction = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    if (progress.music && !backgroundMusic.isCurrentlyPlaying()) {
      backgroundMusic.start().catch(() => {});
    }
  }, [progress.music]);


  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div
          className={`min-h-screen font-sans flex flex-col items-center justify-center p-2 sm:p-4 pb-24 touch-none select-none overflow-hidden bg-gradient-to-br ${currentRank.color} to-slate-900 relative`}
          onClick={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            {activeTheme.bg(Math.ceil(progress.stage / 5) - 1)}
          </div>
          <GameHeader />
          <ViewModeRenderer />
          <BottomNav />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
