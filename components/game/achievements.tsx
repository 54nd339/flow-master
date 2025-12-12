'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { ACHIEVEMENTS } from '@/config';
import { Card } from '@/components/ui';

export const Achievements: React.FC = React.memo(() => {
  const { progress } = useGameStore();

  const unlockedAchievements = React.useMemo(
    () => ACHIEVEMENTS.filter((ach) => (progress.achievements || {})[ach.id]),
    [progress.achievements]
  );

  return (
    <div className="w-full max-w-md space-y-4 mb-24 mt-0">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Achievements</h2>
            <p className="text-sm text-white/60">
              {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
            </p>
          </div>
        </div>
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = (progress.achievements || {})[achievement.id];
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`p-3 rounded-xl border ${unlocked
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                    : 'bg-black/40 border-white/10 opacity-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/30'
                      }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{achievement.name}</div>
                    <div className="text-xs text-white/60">{achievement.description}</div>
                  </div>
                  {unlocked && (
                    <div className="text-xs font-bold text-yellow-400">
                      +{achievement.reward} flows
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
});

Achievements.displayName = 'Achievements';
