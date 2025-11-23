'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Leaf, RefreshCw, Sparkles } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { useZenAutoGeneration, useUniqueLevelGenerator } from '@/hooks';
import { ZEN_MODE } from '@/config';
import { getCurrentPalette, resetGameState, calculateColorCounts } from '@/utils';
import { preGenerateLevel } from '@/lib/level-pre-generation';
import { Card, Button } from '@/components/ui';

export const ZenMode: React.FC = () => {
  const {
    progress,
    levelData,
    setLevelData,
    setIsGenerating,
    setUserPaths,
    setIsLevelComplete,
    resetMoveCount,
    clearMoveHistory,
    isLevelComplete,
    setProgress,
    shiftPreGeneratedLevel,
    addPreGeneratedLevel,
  } = useGameStore();

  const [puzzlesCompleted, setPuzzlesCompleted] = useState(0);
  const palette = React.useMemo(() => getCurrentPalette(progress), [progress.themeId]);

  const generateUniqueLevel = useUniqueLevelGenerator({
    progress,
    setProgress,
    setLevelData,
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
    resetMoveCount,
    clearMoveHistory,
    resetGameState,
  });

  const generateRandomPuzzle = useCallback(() => {
    const gridSize = Math.floor(Math.random() * (ZEN_MODE.MAX_GRID_SIZE - ZEN_MODE.MIN_GRID_SIZE + 1)) + ZEN_MODE.MIN_GRID_SIZE;
    
    // Check for pre-generated level first (if it matches the random size)
    if (shiftPreGeneratedLevel) {
      const preGenerated = shiftPreGeneratedLevel();
      if (preGenerated && preGenerated.width === gridSize && preGenerated.height === gridSize) {
        resetGameState({
          setIsGenerating,
          setIsLevelComplete,
          setUserPaths,
          resetMoveCount,
          clearMoveHistory,
        });
        setLevelData(preGenerated);
        
        // Pre-generate next 2 levels in background
        if (addPreGeneratedLevel) {
          const { minC, maxC } = calculateColorCounts(gridSize, gridSize, palette.length);
          preGenerateLevel(gridSize, gridSize, minC, maxC, palette, progress, (level) => {
            if (level) addPreGeneratedLevel(level);
          });
          preGenerateLevel(gridSize, gridSize, minC, maxC, palette, progress, (level) => {
            if (level) addPreGeneratedLevel(level);
          });
        }
        return;
      }
    }
    
    const { minC, maxC } = calculateColorCounts(gridSize, gridSize, palette.length);
    generateUniqueLevel(gridSize, gridSize, minC, maxC, palette);
    
    // Pre-generate next 2 levels in background (with random sizes)
    if (addPreGeneratedLevel) {
      const nextSize1 = Math.floor(Math.random() * (ZEN_MODE.MAX_GRID_SIZE - ZEN_MODE.MIN_GRID_SIZE + 1)) + ZEN_MODE.MIN_GRID_SIZE;
      const nextSize2 = Math.floor(Math.random() * (ZEN_MODE.MAX_GRID_SIZE - ZEN_MODE.MIN_GRID_SIZE + 1)) + ZEN_MODE.MIN_GRID_SIZE;
      const { minC: minC1, maxC: maxC1 } = calculateColorCounts(nextSize1, nextSize1, palette.length);
      const { minC: minC2, maxC: maxC2 } = calculateColorCounts(nextSize2, nextSize2, palette.length);
      
      preGenerateLevel(nextSize1, nextSize1, minC1, maxC1, palette, progress, (level) => {
        if (level) addPreGeneratedLevel(level);
      });
      preGenerateLevel(nextSize2, nextSize2, minC2, maxC2, palette, progress, (level) => {
        if (level) addPreGeneratedLevel(level);
      });
    }
  }, [palette, generateUniqueLevel, shiftPreGeneratedLevel, addPreGeneratedLevel, progress, setIsGenerating, setIsLevelComplete, setUserPaths, resetMoveCount, clearMoveHistory, setLevelData, resetGameState]);

  useEffect(() => {
    if (!levelData) {
      generateRandomPuzzle();
    }
  }, [levelData, generateRandomPuzzle]);

  useEffect(() => {
    if (isLevelComplete) {
      setPuzzlesCompleted((prev) => prev + 1);
    }
  }, [isLevelComplete]);

  useZenAutoGeneration(generateRandomPuzzle);

  return (
    <>
      <Card className={`w-full max-w-md ${levelData ? 'mb-2' : 'mb-24'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Leaf size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Zen Mode</h3>
              <p className="text-xs text-white/60">Endless relaxation</p>
            </div>
          </div>
          <Button
            onClick={generateRandomPuzzle}
            variant="secondary"
            size="sm"
            className="p-2"
            title="New Puzzle"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-black/40 rounded-xl border border-white/10">
            <div className="text-xs text-white/60 mb-1">Current Grid</div>
            <div className="text-lg font-black text-white">
              {levelData ? `${levelData.width}x${levelData.height}` : 'Generating...'}
            </div>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/10">
            <div className="text-xs text-white/60 mb-1">Puzzles Solved</div>
            <div className="text-lg font-black text-white flex items-center gap-1">
              {puzzlesCompleted}
              <Sparkles size={16} className="text-yellow-400" />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

