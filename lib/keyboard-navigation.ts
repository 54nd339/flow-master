import { useGameStore } from '@/stores/game-store';
import { ViewMode } from '@/types';
import { handlePathMovement, isPathComplete } from '@/utils';

/**
 * Keyboard navigation handler for tab switching
 * Only works in non-game modes or when no level is loaded
 * @param e - Keyboard event
 * @returns True if the event was handled
 */
export const handleTabNavigation = (e: KeyboardEvent): boolean => {
  const { viewMode, setViewMode, levelData } = useGameStore.getState();
  
  // Only handle if not in an input field
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return false;
  }

  // Don't handle tab navigation in game modes when level is loaded (color selection takes priority)
  const gameModes: ViewMode[] = ['PLAY', 'DAILY', 'TIME_ATTACK', 'ZEN'];
  if (gameModes.includes(viewMode) && levelData) {
    return false;
  }

  // Tab switching with number keys (1-8)
  if (e.key >= '1' && e.key <= '8' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    const tabMap: Record<string, ViewMode> = {
      '1': 'PLAY',
      '2': 'DAILY',
      '3': 'TIME_ATTACK',
      '4': 'ZEN',
      '5': 'CREATE',
      '6': 'PROFILE',
      '7': 'ACHIEVEMENTS',
      '8': 'SETTINGS',
    };

    const newViewMode = tabMap[e.key];
    if (newViewMode && newViewMode !== viewMode) {
      setViewMode(newViewMode);
      e.preventDefault();
      return true;
    }
  }

  return false;
};

/**
 * Keyboard navigation handler for color selection and movement
 * @param e - Keyboard event
 * @returns True if the event was handled
 */
export const handleGameNavigation = (e: KeyboardEvent): boolean => {
  const {
    levelData,
    userPaths,
    activeColor,
    setActiveColor,
    updateUserPath,
    isLevelComplete,
    isGenerating,
    viewMode,
    progress,
  } = useGameStore.getState();

  // Only handle in game modes
  if (!levelData || isLevelComplete || isGenerating || 
      viewMode === 'PROFILE' || viewMode === 'ACHIEVEMENTS' || viewMode === 'SETTINGS' || viewMode === 'CREATE') {
    return false;
  }

  // Don't handle if in input field
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return false;
  }

  // Color selection with number keys (1-9)
  if (e.key >= '1' && e.key <= '9') {
    const colorIndex = parseInt(e.key) - 1;
    const colorIds = new Set<number>();
    Object.values(levelData.anchors).forEach((anchor) => {
      colorIds.add(anchor.colorId);
    });
    const sortedColorIds = Array.from(colorIds).sort((a, b) => a - b);
    
    if (colorIndex < sortedColorIds.length) {
      const targetColorId = sortedColorIds[colorIndex];
      const existingPath = userPaths[targetColorId] || [];
      
      // Don't allow selecting a color with a complete path
      if (isPathComplete(levelData, existingPath, targetColorId)) {
        e.preventDefault();
        return false;
      }
      
      setActiveColor(targetColorId);
      
      if (existingPath.length === 0) {
        // Start path from first anchor
        for (const [idx, anchor] of Object.entries(levelData.anchors)) {
          if (anchor.colorId === targetColorId) {
            updateUserPath(targetColorId, [parseInt(idx)]);
            break;
          }
        }
      }
      e.preventDefault();
      return true;
    }
  }

  // Movement with arrow keys or WASD
  if (activeColor !== null) {
    const currentPath = userPaths[activeColor] || [];
    if (currentPath.length === 0) return false;

    // Don't allow movement if path is already complete
    if (isPathComplete(levelData, currentPath, activeColor)) {
      return false;
    }

    const lastIdx = currentPath[currentPath.length - 1];
    const width = levelData.width;
    const row = Math.floor(lastIdx / width);
    const col = lastIdx % width;

    let newIdx: number | null = null;

    // Arrow keys or WASD
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (row > 0) newIdx = lastIdx - width;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (row < levelData.height - 1) newIdx = lastIdx + width;
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (col > 0) newIdx = lastIdx - 1;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (col < width - 1) newIdx = lastIdx + 1;
    }

    if (newIdx !== null && newIdx >= 0 && newIdx < levelData.width * levelData.height) {
      const newRow = Math.floor(newIdx / width);
      const newCol = newIdx % width;
      const isAdjacent = Math.abs(newRow - row) + Math.abs(newCol - col) === 1;

      if (isAdjacent) {
        const result = handlePathMovement(
          newIdx,
          activeColor,
          currentPath,
          levelData,
          userPaths,
          setActiveColor,
          updateUserPath,
          progress.sound
        );

        if (result.handled) {
          e.preventDefault();
          return true;
        }
        return false;
      }
    }
  }

  return false;
};

