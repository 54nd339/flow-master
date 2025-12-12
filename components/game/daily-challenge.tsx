'use client';

import React, { useEffect } from 'react';
import { Calendar, Trophy, CheckCircle2, X } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { generateDailyChallenge, getTodayDateString, isDailyChallengeSolved } from '@/lib';
import { Card, Button } from '@/components/ui';
import { resetGameState } from '@/utils';

export const DailyChallenge: React.FC = () => {
  const {
    progress,
    dailyChallengeDate,
    levelData,
    setLevelData,
    setIsGenerating,
    setDailyChallengeDate,
    resetMoveCount,
    clearMoveHistory,
    setUserPaths,
    setIsLevelComplete,
  } = useGameStore();

  const today = getTodayDateString();
  const isSolved = isDailyChallengeSolved(progress.dailySolved);

  useEffect(() => {
    if (levelData && dailyChallengeDate && dailyChallengeDate !== today) {
      setLevelData(null);
      setUserPaths({});
      setIsLevelComplete(false);
      setDailyChallengeDate(null);
    }
  }, [today, dailyChallengeDate, levelData, setLevelData, setUserPaths, setIsLevelComplete, setDailyChallengeDate]);

  const handleStartDaily = () => {
    resetGameState({
      setIsGenerating,
      setIsLevelComplete,
      setUserPaths,
      resetMoveCount,
      clearMoveHistory,
    });
    setLevelData(null);
    setDailyChallengeDate(today);
    setTimeout(() => {
      const dailyLevel = generateDailyChallenge();
      setLevelData(dailyLevel);
      setIsGenerating(false);
    }, 100);
  };

  const handleHide = () => {
    setLevelData(null);
    setUserPaths({});
    setIsLevelComplete(false);
    setDailyChallengeDate(null);
  };

  return (
    <Card className={`w-full max-w-md ${levelData ? 'mb-2' : 'mb-24'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <Calendar size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-white">Daily Challenge</h3>
          <p className="text-xs text-white/60">New puzzle every day</p>
        </div>
        <div className="flex items-center gap-2">
          {isSolved && (
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle2 size={20} />
            </div>
          )}
          {levelData && (
            <button
              onClick={handleHide}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Hide challenge"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 p-3 bg-black/40 rounded-xl border border-white/10">
        <div className="text-xs text-white/60 mb-1">Today's Puzzle</div>
        <div className="text-sm font-bold text-white">8x8 Grid • Medium Difficulty</div>
        {isSolved && (
          <div className="mt-2 text-xs text-green-400 font-bold flex items-center gap-1">
            <Trophy size={12} /> Completed Today
          </div>
        )}
      </div>

      <Button
        onClick={handleStartDaily}
        variant={isSolved ? 'secondary' : 'primary'}
        className="w-full"
      >
        {isSolved ? 'View Today\'s Challenge' : levelData ? 'Restart Today\'s Challenge' : 'Start Daily Challenge'}
      </Button>
    </Card>
  );
};
