'use client';

import React, { useState } from 'react';
import { User, Trophy, Flame, Star, Target, Clock, Coins, Share2 } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { ACHIEVEMENTS } from '@/config';
import { handleShareStats, processTimeAttackScores, formatTime } from '@/utils';
import { Card, Button, useToast } from '@/components/ui';

export const Profile: React.FC = React.memo(() => {
  const progress = useGameStore((state) => state.progress);
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const { showToast } = useToast();

  const unlockedAchievements = React.useMemo(
    () => ACHIEVEMENTS.filter((ach) => (progress.achievements || {})[ach.id]),
    [progress.achievements]
  );

  const handleShareStatsClick = React.useCallback(async () => {
    await handleShareStats(
      progress,
      unlockedAchievements,
      (msg) => showToast(msg, 'success'),
      (msg) => showToast(msg, 'error'),
      setIsGeneratingSnapshot
    );
  }, [progress, unlockedAchievements, showToast]);

  const timeAttackEntries = React.useMemo(
    () => processTimeAttackScores(progress.timeAttackHighScores || {}),
    [progress.timeAttackHighScores]
  );

  return (
    <div className="w-full max-w-md space-y-4 mb-24 mt-0">

      {/* Stats Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Profile</h2>
              <p className="text-sm text-white/60">Your Flow Master Stats</p>
            </div>
          </div>
          <Button
            onClick={handleShareStatsClick}
            disabled={isGeneratingSnapshot}
            variant="secondary"
            size="sm"
            className="flex items-center justify-center shrink-0"
          >
            <Share2 size={18} className="mr-2" />
            {isGeneratingSnapshot ? 'Generating...' : 'Share'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={18} className="text-yellow-400" />
              <div className="text-xs text-white/60">Flows</div>
            </div>
            <div className="text-2xl font-black text-white">{progress.flows || 0}</div>
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-orange-400" />
              <div className="text-xs text-white/60">Daily Streak</div>
            </div>
            <div className="text-2xl font-black text-white">{progress.dailyStreak || 0}</div>
            <div className="text-xs text-white/40">days</div>
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-yellow-400" />
              <div className="text-xs text-white/60">Perfect Clears</div>
            </div>
            <div className="text-2xl font-black text-white">{progress.perfectClears || 0}</div>
          </div>

          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-green-400" />
              <div className="text-xs text-white/60">Campaign Levels</div>
            </div>
            <div className="text-2xl font-black text-white">{progress.campaignLevelsCompleted || 0}</div>
          </div>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-blue-400" />
            <div className="text-xs text-white/60">Total Time Played</div>
          </div>
          <div className="text-xl font-black text-white">
            {formatTime(progress.totalTimePlayed || 0)}
          </div>
        </div>
      </Card>


      {/* Time Attack Stats Card */}
      {timeAttackEntries.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-blue-400" />
            <h3 className="text-lg font-black text-white">Time Attack Stats</h3>
          </div>
          <div className="space-y-2">
            {timeAttackEntries.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {entry.gridSize}x{entry.gridSize} • {entry.timeLimit}s
                    </div>
                    <div className="text-xs text-white/60">Best Score</div>
                  </div>
                  <div className="text-xl font-black text-white flex items-center gap-1">
                    {entry.score}
                    <Trophy size={18} className="text-yellow-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
});

Profile.displayName = 'Profile';

