'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Share2, Download, Star, Link2, Clock } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { Button, useToast } from '@/components/ui';
import { handleShareImage, handleDownloadImage, handleShareUrl, handleNextLevel, getActiveTheme, formatTimeMMSS } from '@/utils';

const STAR_ARRAY = [0, 1, 2] as const;

export const LevelCompleteModal: React.FC = () => {
  const { 
    isLevelComplete, 
    progress, 
    levelData,
    userPaths,
    viewMode,
    perfectScore,
    levelCompletionTime,
    setLevelData,
    setIsLevelComplete,
    setUserPaths,
    setActiveColor,
    setGenerationWarning,
    handleProgressSave,
  } = useGameStore();
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { showToast } = useToast();
  const activeTheme = getActiveTheme(progress);
  
  const currentRank = React.useMemo(() => {
    const currentGroupIdx = Math.ceil(progress.stage / 5) - 1;
    return activeTheme.ranks[Math.min(currentGroupIdx, 4)] || activeTheme.ranks[0];
  }, [progress.stage, activeTheme.ranks]);

  if (!isLevelComplete || !levelData) return null;

  const handleShareImageClick = React.useCallback(() => {
    setShowShareMenu(false);
    handleShareImage({
      levelData,
      userPaths,
      palette: activeTheme.palette,
      themeLabel: activeTheme.label,
      onSuccess: (msg) => showToast(msg, 'success'),
      onError: (msg) => showToast(msg, 'error'),
      setIsGenerating: setIsGeneratingSnapshot,
    });
  }, [levelData, userPaths, activeTheme.palette, activeTheme.label, showToast, setShowShareMenu]);

  const handleDownloadImageClick = React.useCallback(() => {
    setShowShareMenu(false);
    handleDownloadImage({
      levelData,
      userPaths,
      palette: activeTheme.palette,
      themeLabel: activeTheme.label,
      onSuccess: (msg) => showToast(msg, 'success'),
      onError: (msg) => showToast(msg, 'error'),
      setIsGenerating: setIsGeneratingSnapshot,
    });
  }, [levelData, userPaths, activeTheme.palette, activeTheme.label, showToast, setShowShareMenu]);

  const handleShareUrlClick = React.useCallback(() => {
    setShowShareMenu(false);
    handleShareUrl(
      levelData,
      (msg) => showToast(msg, 'success'),
      (msg) => showToast(msg, 'error')
    );
  }, [levelData, showToast, setShowShareMenu]);

  const handleNext = React.useCallback(() => {
    handleNextLevel(
      viewMode,
      setIsLevelComplete,
      setUserPaths,
      setActiveColor,
      setGenerationWarning,
      setLevelData,
      handleProgressSave
    );
  }, [viewMode, setIsLevelComplete, setUserPaths, setActiveColor, setGenerationWarning, setLevelData, handleProgressSave]);
  
  const handleShareMenuToggle = React.useCallback(() => {
    setShowShareMenu((prev) => !prev);
  }, []);
  
  const handleShareMenuClose = React.useCallback(() => {
    setShowShareMenu(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative mb-6">
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${currentRank.color} blur-3xl opacity-30 rounded-full animate-pulse`}
        />
        <div
          className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${currentRank.color} flex items-center justify-center text-white relative z-10 shadow-2xl ring-4 ring-white/10`}
        >
          {React.createElement(currentRank.icon, { size: 48 })}
        </div>
      </div>
      <h2 className="text-4xl font-black text-white mb-2 tracking-tight">PERFECT</h2>
      <p className="text-white/50 font-medium mb-4">
        {viewMode === 'DAILY' ? 'Daily Challenge Complete!' : viewMode === 'ZEN' ? 'Puzzle Complete!' : 'Zone Cleared'}
      </p>
      
      {levelCompletionTime !== null && levelCompletionTime > 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 text-white/70">
          <Clock size={16} />
          <span className="text-sm font-medium">Time: {formatTimeMMSS(levelCompletionTime)}</span>
        </div>
      )}
      
      {perfectScore && (
        <div className="mb-4 flex items-center justify-center gap-3 bg-white/10 rounded-xl p-3 border border-white/20">
          <div className="text-white text-sm font-bold">
            Moves: {perfectScore.moves} / {perfectScore.minMoves}
          </div>
          <div className="flex gap-1">
            {STAR_ARRAY.map((i) => (
              <Star
                key={i}
                size={18}
                className={perfectScore.stars > i ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'}
              />
            ))}
          </div>
          {perfectScore.perfect && (
            <span className="text-xs font-bold text-yellow-400">PERFECT!</span>
          )}
        </div>
      )}

      <div className="w-full max-w-[280px]">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Button
              onClick={handleShareMenuToggle}
              disabled={isGeneratingSnapshot}
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center"
            >
              <Share2 size={18} className="mr-2" />
              {isGeneratingSnapshot ? 'Generating...' : 'Share'}
            </Button>
            {showShareMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[50]" 
                  onClick={handleShareMenuClose}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[70]"
                >
                <button
                  onClick={handleShareImageClick}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-white"
                >
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Share Image</span>
                </button>
                <button
                  onClick={handleDownloadImageClick}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-white border-t border-white/10"
                >
                  <Download size={18} />
                  <span className="text-sm font-medium">Download Image</span>
                </button>
                <button
                  onClick={handleShareUrlClick}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-white border-t border-white/10"
                >
                  <Link2 size={18} />
                  <span className="text-sm font-medium">Share Level URL</span>
                </button>
                </motion.div>
              </>
            )}
          </div>

          {viewMode === 'DAILY' ? (
            <Button onClick={handleNext} size="lg" className="flex-1 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              <CheckCircle2 size={20} className="mr-2" /> Done
            </Button>
          ) : viewMode === 'ZEN' ? (
            <Button onClick={handleNext} size="lg" className="flex-1 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] text-sm">
              Next Puzzle <ArrowRight size={18} className="ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg" className="flex-1 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] text-sm">
              Next <ArrowRight size={18} className="ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

