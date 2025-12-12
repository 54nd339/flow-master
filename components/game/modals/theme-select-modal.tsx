'use client';

import React from 'react';
import { Palette, CheckCircle2, Lock } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useGameStore } from '@/stores/game-store';
import { THEME_PRESETS } from '@/constants';
import { THEME_PRICES } from '@/config';

export const ThemeSelectModal: React.FC = () => {
  const { showThemeSelect, setShowThemeSelect, progress, setProgress, resetProgress } = useGameStore();

  return (
    <Modal
      isOpen={showThemeSelect}
      onClose={() => setShowThemeSelect(false)}
      title={
        <div className="flex items-center gap-2">
          <Palette size={20} />
          Theme Select
        </div>
      }
      className="max-w-md"
    >
      <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
        <div className="text-sm font-bold text-white">Colorblind Mode</div>
        <button
          onClick={() => setProgress({ colorblind: !progress.colorblind })}
          className={`w-12 h-6 rounded-full transition-colors relative ${progress.colorblind ? 'bg-green-500' : 'bg-slate-700'
            }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${progress.colorblind ? 'translate-x-6' : ''
              }`}
          />
        </button>
      </div>
      <div className="space-y-3">
        {Object.values(THEME_PRESETS).map((theme) => {
          const isUnlocked = (progress.unlockedThemes || ['WATER']).includes(theme.id);
          const price = THEME_PRICES[theme.id] || 0;
          const isCurrent = progress.themeId === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => {
                if (isUnlocked) {
                  setProgress({ themeId: theme.id });
                }
              }}
              disabled={!isUnlocked}
              className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 text-left ${!isUnlocked
                  ? 'bg-black/60 text-white/50 border-white/5 opacity-60 cursor-not-allowed'
                  : isCurrent
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                }`}
            >
              <div
                className={`w-10 h-10 rounded-full ${isUnlocked
                    ? `bg-gradient-to-br ${theme.ranks[0].color}`
                    : 'bg-white/10'
                  } flex items-center justify-center text-white`}
              >
                {isUnlocked ? (
                  React.createElement(theme.ranks[0].icon, { size: 20 })
                ) : (
                  <Lock size={20} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{theme.label}</div>
                {!isUnlocked && (
                  <div className="text-xs text-white/40 mt-1">
                    {price} flows to unlock
                  </div>
                )}
              </div>
              {isCurrent && isUnlocked && (
                <CheckCircle2 className="ml-auto text-emerald-500" />
              )}
              {!isUnlocked && (
                <Lock className="ml-auto text-white/30" size={18} />
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
