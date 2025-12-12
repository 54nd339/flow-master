'use client';

import React from 'react';
import { Grid, Coins } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { STAGES, LEVELS_PER_STAGE } from '@/config';
import { Button, Card } from '@/components/ui';
import { getActiveTheme } from '@/utils';

export const GameHeader: React.FC = React.memo(() => {
  const { progress, viewMode, setShowStageSelect, levelData } = useGameStore();
  const activeTheme = getActiveTheme(progress);

  const currentRank = React.useMemo(() => {
    const currentGroupIdx = Math.ceil(progress.stage / 5) - 1;
    return activeTheme.ranks[Math.min(currentGroupIdx, 4)] || activeTheme.ranks[0];
  }, [progress.stage, activeTheme.ranks]);

  const showGameInfo = React.useMemo(
    () => viewMode === 'PLAY' || viewMode === 'DAILY' || viewMode === 'TIME_ATTACK' || viewMode === 'ZEN',
    [viewMode]
  );

  const handleMapClick = React.useCallback(() => {
    setShowStageSelect(true);
  }, [setShowStageSelect]);

  return (
    <Card className="w-full max-w-md relative z-20 mb-4">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-white/10 text-white`}>
              {React.createElement(currentRank.icon, { size: 16 })}
            </div>
            <h1 className="text-base font-black text-white leading-none tracking-tight">
              FLOW <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">MASTER</span>
            </h1>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Coins size={12} className="text-yellow-400" />
            <span className="text-xs font-black text-white">{progress.flows || 0}</span>
          </div>
        </div>

        {showGameInfo && viewMode === 'PLAY' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                  Stage {progress.stage} / {STAGES.length}
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                  Lvl {progress.level} / {LEVELS_PER_STAGE}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-black text-white truncate">
                  {levelData ? `${levelData.width}x${levelData.height} Grid` : 'Loading...'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${(progress.level / LEVELS_PER_STAGE) * 100}%` }}
                />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMapClick}
              className="p-2 flex flex-col items-center gap-0.5 shrink-0"
            >
              <Grid size={18} />
              <span className="text-[8px] uppercase font-bold">Map</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
});

GameHeader.displayName = 'GameHeader';
