'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { useTimeAttackTimer, useUniqueLevelGenerator } from '@/hooks';
import { TIME_ATTACK } from '@/config';
import { formatTimeMMSS, getCurrentPalette, resetGameState, getTimeAttackHighScore, isNewHighScore, getTimeAttackScoreKey, calculateColorCounts } from '@/utils';
import { preGenerateLevel } from '@/lib/level-pre-generation';
import { Card, Button, Modal } from '@/components/ui';

export const TimeAttackMode: React.FC = () => {
  const {
    timeAttack,
    setTimeAttack,
    setViewMode,
    levelData,
    setLevelData,
    setIsGenerating,
    setUserPaths,
    setIsLevelComplete,
    resetMoveCount,
    clearMoveHistory,
    progress,
    setProgress: updateProgress,
    isLevelComplete,
    setProgress: setProgressState,
    shiftPreGeneratedLevel,
    addPreGeneratedLevel,
  } = useGameStore();

  const [showConfig, setShowConfig] = useState(!timeAttack);
  const [selectedGridSize, setSelectedGridSize] = useState(6);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  const palette = React.useMemo(() => getCurrentPalette(progress), [progress.themeId]);

  const generateUniqueLevel = useUniqueLevelGenerator({
    progress,
    setProgress: setProgressState,
    setLevelData,
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
    resetMoveCount,
    clearMoveHistory,
    resetGameState,
  });

  const generateNextPuzzle = useCallback((size: number) => {
    // Check for pre-generated level first
    if (shiftPreGeneratedLevel) {
      const preGenerated = shiftPreGeneratedLevel();
      if (preGenerated && preGenerated.width === size && preGenerated.height === size) {
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
          const { minC, maxC } = calculateColorCounts(size, size, palette.length);
          preGenerateLevel(size, size, minC, maxC, palette, progress, (level) => {
            if (level) addPreGeneratedLevel(level);
          });
          preGenerateLevel(size, size, minC, maxC, palette, progress, (level) => {
            if (level) addPreGeneratedLevel(level);
          });
        }
        return;
      }
    }

    const { minC, maxC } = calculateColorCounts(size, size, palette.length);
    generateUniqueLevel(size, size, minC, maxC, palette);

    // Pre-generate next 2 levels in background
    if (addPreGeneratedLevel) {
      preGenerateLevel(size, size, minC, maxC, palette, progress, (level) => {
        if (level) addPreGeneratedLevel(level);
      });
      preGenerateLevel(size, size, minC, maxC, palette, progress, (level) => {
        if (level) addPreGeneratedLevel(level);
      });
    }
  }, [palette, generateUniqueLevel, shiftPreGeneratedLevel, addPreGeneratedLevel, progress, setIsGenerating, setIsLevelComplete, setUserPaths, resetMoveCount, clearMoveHistory, setLevelData, resetGameState]);

  useTimeAttackTimer(isPaused, generateNextPuzzle);

  const handleStart = () => {
    const config = {
      gridSize: selectedGridSize,
      timeLimit: selectedTimeLimit,
      puzzlesCompleted: 0,
      isActive: true,
      timeRemaining: selectedTimeLimit,
    };
    setTimeAttack(config);
    setShowConfig(false);
    generateNextPuzzle(config.gridSize);
  };

  const puzzleCompleteRef = useRef(false);

  const handlePuzzleComplete = useCallback(() => {
    if (!timeAttack || !timeAttack.isActive || puzzleCompleteRef.current) return;

    puzzleCompleteRef.current = true;

    // Increment total time attack puzzles completed
    updateProgress({
      timeAttackPuzzlesCompleted: (progress.timeAttackPuzzlesCompleted || 0) + 1,
    });

    setTimeAttack((prev) => {
      if (!prev) return null;
      const newCount = prev.puzzlesCompleted + 1;

      if (prev.timeRemaining > 0) {
        setTimeout(() => {
          generateNextPuzzle(prev.gridSize);
          puzzleCompleteRef.current = false;
        }, 1000);
      } else {
        puzzleCompleteRef.current = false;
      }

      return {
        ...prev,
        puzzlesCompleted: newCount,
      };
    });
  }, [timeAttack, setTimeAttack, progress, updateProgress, generateNextPuzzle]);

  useEffect(() => {
    if (isLevelComplete && timeAttack?.isActive && !puzzleCompleteRef.current) {
      handlePuzzleComplete();
    }
  }, [isLevelComplete, timeAttack, handlePuzzleComplete]);

  const handleEnd = () => {
    if (timeAttack) {
      const finalScore = timeAttack.puzzlesCompleted;
      const scoreKey = getTimeAttackScoreKey(timeAttack.gridSize, timeAttack.timeLimit);
      const currentHighScores = progress.timeAttackHighScores || {};
      const currentHighScore = getTimeAttackHighScore(progress, timeAttack.gridSize, timeAttack.timeLimit);

      if (finalScore > currentHighScore) {
        updateProgress({
          timeAttackHighScores: {
            ...currentHighScores,
            [scoreKey]: finalScore,
          },
        });
      }
    }
    setTimeAttack(null);
    setLevelData(null);
    setUserPaths({});
    setIsLevelComplete(false);
    resetMoveCount();
    clearMoveHistory();
    setShowConfig(true);
  };


  if (showConfig) {
    return (
      <Modal
        isOpen={showConfig}
        onClose={() => {
          setShowConfig(false);
          setViewMode('PLAY');
        }}
        title="Time Attack Mode"
      >
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold text-white mb-3 block">Grid Size</label>
            <div className="grid grid-cols-5 gap-2">
              {TIME_ATTACK.GRID_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedGridSize(size)}
                  className={`p-3 rounded-xl font-bold transition-all ${selectedGridSize === size
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-white mb-3 block">Time Limit</label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_ATTACK.TIME_LIMITS.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTimeLimit(time)}
                  className={`p-3 rounded-xl font-bold transition-all ${selectedTimeLimit === time
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleStart} className="w-full flex items-center justify-center" size="lg">
              <Play size={20} className="mr-2" /> Start Challenge
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!timeAttack) {
    return null;
  }

  // Show config modal if time attack ended
  if (!timeAttack.isActive && timeAttack.timeRemaining === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={() => {
          setTimeAttack(null);
          setViewMode('PLAY');
        }}
        title="Time Attack Complete!"
      >
        <div className="space-y-6 text-center">
          <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
            <div className="text-2xl font-black text-white mb-2">
              Completed {timeAttack.puzzlesCompleted} puzzle{timeAttack.puzzlesCompleted !== 1 ? 's' : ''}
            </div>
            {isNewHighScore(progress, timeAttack.gridSize, timeAttack.timeLimit, timeAttack.puzzlesCompleted) && (
              <div className="text-sm font-bold text-yellow-200">New High Score! 🎉</div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setTimeAttack(null);
                setViewMode('PLAY');
              }}
              variant="secondary"
              className="flex-1"
            >
              Back to Menu
            </Button>
            <Button
              onClick={() => {
                setTimeAttack(null);
                setShowConfig(true);
              }}
              className="flex-1"
            >
              Play Again
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Card className={`w-full max-w-md ${timeAttack?.isActive && levelData ? 'mb-2' : 'mb-24'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-white" />
          <h3 className="text-lg font-black text-white">Time Attack</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="secondary"
            size="sm"
            className="p-2"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </Button>
          <Button
            onClick={handleEnd}
            variant="secondary"
            size="sm"
            className="p-2"
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-black/40 rounded-xl border border-white/10">
          <div className="text-xs text-white/60 mb-1">Time Remaining</div>
          <div className={`text-2xl font-black ${timeAttack.timeRemaining < 10 ? 'text-red-400' : 'text-white'}`}>
            {formatTimeMMSS(timeAttack.timeRemaining)}
          </div>
        </div>
        <div className="p-3 bg-black/40 rounded-xl border border-white/10">
          <div className="text-xs text-white/60 mb-1">Puzzles Solved</div>
          <div className="text-2xl font-black text-white flex items-center gap-1">
            {timeAttack.puzzlesCompleted}
            <Trophy size={18} className="text-yellow-400" />
          </div>
        </div>
      </div>

      {timeAttack && (() => {
        const highScore = getTimeAttackHighScore(progress, timeAttack.gridSize, timeAttack.timeLimit);
        return (
          <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 mb-4">
            <div className="text-xs text-white/60 mb-1">Highest for {timeAttack.gridSize}x{timeAttack.gridSize} • {timeAttack.timeLimit}s</div>
            <div className="text-lg font-black text-white flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              {highScore} puzzles
            </div>
          </div>
        );
      })()}

    </Card>
  );
};
