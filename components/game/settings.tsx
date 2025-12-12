'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Palette, RotateCcw, AlertTriangle, CheckCircle2, Lock, Coins, Store, X } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { backgroundMusic, audioEngine } from '@/lib';
import { THEME_PRESETS } from '@/constants';
import { THEME_PRICES, TIMING } from '@/config';
import { Card, Button } from '@/components/ui';

export const SettingsView: React.FC = React.memo(() => {
  const colorblind = useGameStore((state) => state.progress.colorblind);
  const sound = useGameStore((state) => state.progress.sound);
  const music = useGameStore((state) => state.progress.music);
  const flows = useGameStore((state) => state.progress.flows);
  const unlockedThemes = useGameStore((state) => state.progress.unlockedThemes);
  const themeId = useGameStore((state) => state.progress.themeId);

  const progress = useMemo(
    () => ({ colorblind, sound, music, flows, unlockedThemes, themeId }),
    [colorblind, sound, music, flows, unlockedThemes, themeId]
  );
  const { setProgress, resetProgress, unlockTheme } = useGameStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState<{
    themeId: string;
    success: boolean;
  } | null>(null);

  const handleReset = React.useCallback(() => {
    resetProgress();
    setShowResetConfirm(false);
  }, [resetProgress]);

  const handleColorblindToggle = React.useCallback(() => {
    setProgress({ colorblind: !colorblind });
  }, [setProgress, colorblind]);

  const handleSoundToggle = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newSound = !sound;
    setProgress({ sound: newSound });
    audioEngine.setEnabled(newSound);
  }, [setProgress, sound]);

  const handleMusicToggle = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMusic = !music;
    setProgress({ music: newMusic });
    if (newMusic) {
      backgroundMusic.stop();
      await new Promise(resolve => setTimeout(resolve, 200));
      await backgroundMusic.start();
    } else {
      backgroundMusic.stop();
    }
  }, [setProgress, music]);

  const handleResetConfirm = React.useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetCancel = React.useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  return (
    <div className="w-full max-w-md space-y-4 mb-24 mt-0">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Settings</h2>
            <p className="text-sm text-white/60">Customize your experience</p>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white mb-1">Colorblind Mode</div>
                <div className="text-xs text-white/60">Show symbols inside dots</div>
              </div>
              <button
                onClick={handleColorblindToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${colorblind ? 'bg-green-500' : 'bg-slate-700'
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${colorblind ? 'translate-x-6' : ''
                    }`}
                />
              </button>
            </div>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white mb-1">Sound Effects</div>
                <div className="text-xs text-white/60">Pop sounds when connecting dots</div>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${sound ? 'bg-green-500' : 'bg-slate-700'
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sound ? 'translate-x-6' : ''
                    }`}
                />
              </button>
            </div>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white mb-1">Background Music</div>
                <div className="text-xs text-white/60">Zen ambient music</div>
              </div>
              <button
                onClick={handleMusicToggle}
                className={`w-12 h-6 rounded-full transition-colors relative ${music ? 'bg-green-500' : 'bg-slate-700'
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${music ? 'translate-x-6' : ''
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Theme Shop & Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Store size={16} />
              Theme Shop
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              <Coins size={16} className="text-yellow-400" />
              <span className="text-sm font-black text-white">{flows}</span>
            </div>
          </div>
          <div className="space-y-3">
            {Object.values(THEME_PRESETS).map((theme) => {
              const isUnlocked = (unlockedThemes || ['WATER']).includes(theme.id);
              const price = THEME_PRICES[theme.id] || 0;
              const canAfford = flows >= price;
              const isCurrent = themeId === theme.id;

              const handlePurchase = React.useCallback(() => {
                const success = unlockTheme(theme.id);
                setPurchaseFeedback({ themeId: theme.id, success });
                setTimeout(() => setPurchaseFeedback(null), TIMING.ERROR_MESSAGE_DURATION);
                if (success) {
                  setProgress({ themeId: theme.id });
                }
              }, [theme.id, unlockTheme, setProgress]);

              const handleThemeSelect = React.useCallback(() => {
                setProgress({ themeId: theme.id });
              }, [theme.id, setProgress]);

              return (
                <div
                  key={theme.id}
                  className={`p-4 rounded-xl border transition-all ${isUnlocked
                      ? isCurrent
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50'
                        : 'bg-black/40 border-white/20 hover:border-white/40'
                      : 'bg-black/60 border-white/10 opacity-75'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${isUnlocked
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                          : 'bg-white/10'
                        }`}
                    >
                      {isUnlocked ? (
                        <Palette size={24} className="text-white" />
                      ) : (
                        <Lock size={24} className="text-white/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-white">{theme.label}</h3>
                        {isCurrent && isUnlocked && (
                          <CheckCircle2 size={16} className="text-blue-400" />
                        )}
                      </div>
                      {isUnlocked ? (
                        <p className="text-xs text-white/60">Unlocked</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Coins size={14} className="text-yellow-400" />
                          <span className="text-sm font-bold text-white">{price}</span>
                          {!canAfford && (
                            <span className="text-xs text-red-400 ml-2">Insufficient flows</span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isUnlocked && (
                      <Button
                        onClick={handlePurchase}
                        disabled={!canAfford}
                        variant={canAfford ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {canAfford ? 'Unlock' : 'Locked'}
                      </Button>
                    )}
                    {isUnlocked && !isCurrent && (
                      <Button
                        onClick={handleThemeSelect}
                        variant="secondary"
                        size="sm"
                      >
                        Select
                      </Button>
                    )}
                  </div>

                  {purchaseFeedback?.themeId === theme.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${purchaseFeedback.success
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {purchaseFeedback.success ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span className="text-sm font-bold">Theme Unlocked!</span>
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          <span className="text-sm font-bold">Insufficient flows</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Progress */}
        <div className="pt-6 border-t border-white/10">
          <Button
            onClick={handleResetConfirm}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 border-red-500/30"
          >
            <RotateCcw size={16} />
            Reset All Progress
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Reset All Progress?</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-white/80 mb-6">
              This will reset all your progress, including levels completed, flows, achievements, unlocked themes, and daily streaks.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleResetCancel}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                variant="primary"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SettingsView.displayName = 'SettingsView';
