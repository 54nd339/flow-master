'use client';

import React from 'react';
import { User, Trophy, Settings, PlayCircle, Calendar, Clock, Leaf, PenTool, ChevronDown } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { cn } from '@/lib';
import { Card, Button, DropdownMenu, DropdownMenuItem } from '@/components/ui';
import { isValidViewMode } from '@/utils';

const MODE_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  PLAY: { label: 'Campaign', icon: PlayCircle },
  DAILY: { label: 'Daily Challenge', icon: Calendar },
  TIME_ATTACK: { label: 'Time Attack', icon: Clock },
  ZEN: { label: 'Zen Mode', icon: Leaf },
  CREATE: { label: 'Level Creator', icon: PenTool },
} as const;

const NAV_ITEMS = [
  { id: 'PROFILE', label: 'Profile', icon: User },
  { id: 'ACHIEVEMENTS', label: 'Achievements', icon: Trophy },
  { id: 'SETTINGS', label: 'Settings', icon: Settings },
] as const;

export const BottomNav: React.FC = React.memo(() => {
  const { viewMode, setViewMode } = useGameStore();

  const currentMode = MODE_MAP[viewMode] || MODE_MAP.PLAY;
  const ModeIcon = currentMode.icon;

  const handleClick = React.useCallback((id: string) => {
    if (isValidViewMode(id)) {
      setViewMode(id);
    }
  }, [setViewMode]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2">
      <div className="max-w-md mx-auto">
        <Card className="p-2">
          <div className="flex items-center justify-around">
            <DropdownMenu
              openUpward={true}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 text-xs flex items-center gap-1.5"
                >
                  <ModeIcon size={16} />
                  <span className="hidden sm:inline">{currentMode.label}</span>
                  <ChevronDown size={12} />
                </Button>
              }
            >
              {Object.entries(MODE_MAP).map(([key, mode]) => {
                const Icon = mode.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => isValidViewMode(key) && setViewMode(key)}
                    active={viewMode === key}
                    icon={<Icon size={16} />}
                  >
                    {mode.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenu>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
});

BottomNav.displayName = 'BottomNav';
