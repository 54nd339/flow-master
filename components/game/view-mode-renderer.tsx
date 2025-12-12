'use client';

import React from 'react';
import { useGameStore } from '@/stores/game-store';
import {
  GameBoard,
  GameControls,
  CreatorMode,
  DailyChallenge,
  TimeAttackMode,
  ZenMode,
  Profile,
  Achievements,
  SettingsView,
  StageSelectModal,
  ThemeSelectModal,
  RankUpModal,
} from '@/components/game';

/**
 * Renders the appropriate view based on the current view mode
 * Extracted from page.tsx for better organization
 */
export const ViewModeRenderer: React.FC = React.memo(() => {
  const viewMode = useGameStore((state) => state.viewMode);
  const levelData = useGameStore((state) => state.levelData);
  const timeAttack = useGameStore((state) => state.timeAttack);

  switch (viewMode) {
    case 'PLAY':
      return (
        <>
          <StageSelectModal />
          <ThemeSelectModal />
          <RankUpModal />
          <GameBoard />
          <GameControls />
        </>
      );

    case 'DAILY':
      return (
        <>
          <DailyChallenge />
          {levelData && (
            <>
              <GameBoard />
              <GameControls />
            </>
          )}
        </>
      );

    case 'TIME_ATTACK':
      return (
        <>
          <TimeAttackMode />
          {timeAttack && timeAttack.isActive && (
            <>
              <GameBoard />
              <GameControls />
            </>
          )}
        </>
      );

    case 'ZEN':
      return (
        <>
          <ZenMode />
          {levelData && (
            <>
              <GameBoard />
              <GameControls />
            </>
          )}
        </>
      );

    case 'PROFILE':
      return <Profile />;

    case 'ACHIEVEMENTS':
      return <Achievements />;

    case 'SETTINGS':
      return <SettingsView />;

    default:
      return (
        <>
          <CreatorMode />
          <ThemeSelectModal />
        </>
      );
  }
});

ViewModeRenderer.displayName = 'ViewModeRenderer';
