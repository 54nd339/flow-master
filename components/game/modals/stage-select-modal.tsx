'use client';

import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useGameStore } from '@/stores/game-store';
import { STAGES, LEVELS_PER_STAGE } from '@/config';
import { startLevel } from '@/lib';
import { getActiveTheme } from '@/utils';

export const StageSelectModal: React.FC = () => {
  const { showStageSelect, setShowStageSelect, progress, setProgress, setLevelData, setIsGenerating } = useGameStore();
  const activeTheme = getActiveTheme(progress);

  const handleStageSelect = (stageId: number, levelIdx: number) => {
    setProgress({ stage: stageId, level: levelIdx + 1 });
    startLevel(stageId, levelIdx, progress, setLevelData, setIsGenerating, undefined, setProgress);
    setShowStageSelect(false);
  };

  return (
    <Modal
      isOpen={showStageSelect}
      onClose={() => setShowStageSelect(false)}
      title="Exploration Map"
    >
      {Array.from({ length: 5 }).map((_, gIdx) => {
        const rank = activeTheme.ranks[gIdx];
        return (
          <div
            key={gIdx}
            className={`mb-8 p-4 rounded-2xl border bg-gradient-to-br ${rank.color} bg-opacity-10 border-white/10 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                {React.createElement(rank.icon, { size: 20, className: "text-white" })}
                <span className="font-black text-white uppercase tracking-wide text-sm">
                  {rank.name}
                </span>
              </div>
              {STAGES.slice(gIdx * 5, (gIdx + 1) * 5).map((s) => {
                const isLocked = s.id > progress.maxStage;
                const hist = progress.history[s.id] || [];
                return (
                  <div key={s.id} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isLocked ? (
                        <Lock size={12} className="text-white/30" />
                      ) : (
                        <Unlock size={12} className="text-white/80" />
                      )}
                      <span
                        className={`font-bold text-xs ${isLocked ? 'text-white/30' : 'text-white'
                          }`}
                      >
                        Area {s.id}: {s.w}x{s.h}
                      </span>
                    </div>
                    {!isLocked && (
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({
                          length: Math.min(hist.length + 1, LEVELS_PER_STAGE),
                        }).map((__, lvlIdx) => {
                          const isSolved = lvlIdx < hist.length;
                          const isCurrent =
                            s.id === progress.stage && lvlIdx + 1 === progress.level;
                          return (
                            <button
                              key={lvlIdx}
                              onClick={() => handleStageSelect(s.id, lvlIdx)}
                              className={`aspect-square rounded-md font-bold text-[10px] flex items-center justify-center transition-all ${isCurrent
                                  ? 'bg-white text-black shadow-lg scale-110 ring-2 ring-white'
                                  : isSolved
                                    ? 'bg-white/20 text-white hover:bg-white/30'
                                    : 'bg-black/40 text-white/30'
                                }`}
                            >
                              {lvlIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Modal>
  );
};
