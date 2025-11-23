import { ViewMode, LevelData } from '@/types';
import { useGameStore } from '@/stores/game-store';
import { startLevel } from '@/lib';

/**
 * Handles navigation to the next level based on view mode
 */
export const handleNextLevel = (
  viewMode: ViewMode,
  setIsLevelComplete: (value: boolean) => void,
  setUserPaths: (paths: Record<number, number[]>) => void,
  setActiveColor: (color: number | null) => void,
  setGenerationWarning: (warning: string | null) => void,
  setLevelData: (data: LevelData | null) => void,
  handleProgressSave: () => void
) => {
  setIsLevelComplete(false);
  setUserPaths({});
  setActiveColor(null);
  setGenerationWarning(null);

  if (viewMode === 'DAILY') {
    return;
  }

  if (viewMode === 'ZEN') {
    setLevelData(null);
    return;
  }

  if (viewMode === 'PLAY') {
    handleProgressSave();
    const store = useGameStore.getState();
    store.resetMoveCount();
    store.clearMoveHistory();
    const latestProgress = store.progress;
    const { 
      setLevelData: updateLevelData, 
      setIsGenerating, 
      setGenerationWarning: updateWarning, 
      setProgress,
      shiftPreGeneratedLevel,
      addPreGeneratedLevel,
    } = store;
    startLevel(null, null, latestProgress, updateLevelData, setIsGenerating, updateWarning, setProgress, undefined, undefined, shiftPreGeneratedLevel, addPreGeneratedLevel);
  }
};

