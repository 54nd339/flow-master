import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { extractLevelFromUrl, backgroundMusic } from '@/lib';

export const useGameInitialization = () => {
  const [mounted, setMounted] = useState(false);
  const { setProgress, setLevelData, setViewMode } = useGameStore();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('flowMaster_v19_stable_restore');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.state?.progress) {
          setProgress(parsed.state.progress);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Keyboard controls removed - not compatible with large grids
    const urlLevel = extractLevelFromUrl();
    if (urlLevel) {
      setLevelData(urlLevel);
      setViewMode('PLAY');
    }

    return () => {
      backgroundMusic.stop();
    };
  }, [setProgress, setLevelData, setViewMode]);

  return mounted;
};
