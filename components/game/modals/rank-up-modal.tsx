'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { Button } from '@/components/ui';
import { startLevel } from '@/lib';

export const RankUpModal: React.FC = () => {
  const { showRankUp, setShowRankUp, progress, setLevelData, setIsGenerating, setProgress } = useGameStore();

  if (!showRankUp) return null;

  const handleContinue = () => {
    setShowRankUp(null);
    startLevel(null, null, progress, setLevelData, setIsGenerating, undefined, setProgress);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-white/50 font-bold uppercase tracking-[0.2em] mb-8 animate-pulse"
        >
          Rank Up Achieved
        </motion.div>
        <div className="flex items-center justify-center gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0.5, scale: 0.75 }}
            animate={{ opacity: 0.5, scale: 0.75 }}
            className="grayscale blur-sm transition-all duration-1000"
          >
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${showRankUp.old.color} flex items-center justify-center text-white mb-4 mx-auto`}
            >
              {React.createElement(showRankUp.old.icon, { size: 48 })}
            </div>
            <div className="text-white font-bold">{showRankUp.old.name}</div>
          </motion.div>
          <ArrowRight className="text-white animate-bounce" size={32} />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${showRankUp.new.color} flex items-center justify-center text-white mb-6 mx-auto shadow-[0_0_50px_rgba(255,255,255,0.3)] ring-4 ring-white`}
            >
              {React.createElement(showRankUp.new.icon, { size: 64 })}
            </div>
            <div className="text-2xl font-black text-white bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              {showRankUp.new.name}
            </div>
          </motion.div>
        </div>
        <Button onClick={handleContinue} size="lg" className="px-8 py-4 tracking-wider">
          CONTINUE JOURNEY
        </Button>
      </div>
    </motion.div>
  );
};

