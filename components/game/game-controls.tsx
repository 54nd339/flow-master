'use client';

import React from 'react';
import { RotateCcw, Lightbulb, Undo2 } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { LEVELS_FOR_HINT } from '@/config';
import { Button } from '@/components/ui';
import { triggerHint } from '@/lib';

export const GameControls: React.FC = () => {
  const {
    levelData,
    isLevelComplete,
    isGenerating,
    progress,
    hintUsed,
    moveHistory,
    setHintUsed,
    resetBoard,
    setProgress,
    userPaths,
    undoLastMove,
  } = useGameStore();

  const handleHint = () => {
    triggerHint(levelData, userPaths, progress, setProgress, setHintUsed);
  };

  const canUseHint =
    !isLevelComplete &&
    progress.hints > 0 &&
    levelData?.solvedPaths &&
    levelData.solvedPaths.length > 0;

  const canUndo = moveHistory.length > 0 && !isLevelComplete && !isGenerating && moveHistory.length <= 100;

  return (
    <div className="w-full max-w-md mt-4 mb-24 space-y-3 z-10">
      <div className="flex items-center gap-3">
        <Button
          onClick={undoLastMove}
          disabled={!canUndo}
          variant="secondary"
          className="p-2 flex items-center justify-center"
          title="Undo last move"
        >
          <Undo2 size={24} />
        </Button>
        <Button
          onClick={resetBoard}
          variant="secondary"
          className="p-2 flex items-center justify-center"
          title="Reset board"
        >
          <RotateCcw size={24} />
        </Button>
        <Button
          onClick={handleHint}
          disabled={!canUseHint || isGenerating}
          variant="primary"
          className="flex-1 flex flex-col items-center justify-center p-2"
        >
          <div className="flex items-center gap-2">
            <Lightbulb
              size={16}
              className={hintUsed ? 'fill-black text-black' : ''}
            />
            <span>
              Hint {levelData?.solvedPaths?.length ? `(${progress.hints})` : ''}
            </span>
          </div>
          <div className="text-[9px] font-bold opacity-60 uppercase tracking-wide">
            {LEVELS_FOR_HINT - progress.levelsSinceHint} wins to next
          </div>
        </Button>
      </div>
    </div>
  );
};

