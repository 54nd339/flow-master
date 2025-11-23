'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useLevelCompletion, useTheme } from '@/hooks';
import { audioEngine, hapticFeedback, startLevel } from '@/lib';
import { GRID } from '@/config';
import { getCellIndex, isValidMove, handlePathMovement, getCurrentPalette, findPathContainingCell, createPathLookupMap, getCellPosition, isLargeGrid } from '@/utils';
import { LevelCompleteModal } from './modals/level-complete-modal';
import { Celebration } from './celebration';
import { GridCell } from './grid-cell';
import { Button } from '@/components/ui';
import { RefreshCw } from 'lucide-react';

/**
 * Warning banner component for generation errors/warnings
 */
const WarningBanner: React.FC<{
  generationWarning: string | null;
  levelUsedFallback: boolean;
  levelValidationError: string | null;
  onRegenerate: () => void;
}> = ({ generationWarning, levelUsedFallback, levelValidationError, onRegenerate }) => {
  if (!generationWarning && !levelUsedFallback && !levelValidationError) return null;

  return (
    <div className="absolute top-0 inset-x-0 z-40 bg-amber-500/90 text-black text-xs font-bold py-2 px-4 flex items-center justify-between gap-2">
      <div className="flex-1 text-center">
        {levelValidationError 
          ? `Validation Error: ${levelValidationError}` 
          : levelUsedFallback 
          ? 'Fallback algorithm used. Level may have issues.'
          : generationWarning}
      </div>
      {(levelUsedFallback || levelValidationError) && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onRegenerate}
          className="text-xs px-2 py-1 h-auto"
        >
          <RefreshCw size={12} className="mr-1" />
          Regenerate
        </Button>
      )}
    </div>
  );
};

/**
 * Loading spinner overlay
 */
const LoadingOverlay: React.FC<{ isGenerating: boolean }> = ({ isGenerating }) => {
  if (!isGenerating) return null;
  
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
};

/**
 * SVG paths rendering component
 */
const PathSVG: React.FC<{
  userPaths: Record<number, number[]>;
  currentPalette: any[];
  levelData: any;
}> = ({ userPaths, currentPalette, levelData }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none z-20"
    viewBox={`0 0 ${levelData.width} ${levelData.height}`}
    preserveAspectRatio="none"
  >
    {Object.entries(userPaths).map(([cId, path]) => {
      if (path.length < 2 && !levelData.anchors[path[0]]) return null;
      const color = currentPalette[parseInt(cId) % currentPalette.length].hex;
      const points = path
        .map((idx) => {
          const { row: r, col: c } = getCellPosition(idx, levelData.width);
          return `${c + 0.5},${r + 0.5}`;
        })
        .join(' ');
      return (
        <polyline
          key={cId}
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-md"
          style={{
            opacity: 0.9,
            filter: `drop-shadow(0 0 2px ${color})`,
          }}
        />
      );
    })}
  </svg>
);

export const GameBoard: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const lastTouchedIndex = useRef<number | null>(null);
  const {
    levelData,
    userPaths,
    activeColor,
    isLevelComplete,
    isGenerating,
    generationWarning,
    levelUsedFallback,
    levelValidationError,
    progress,
    setActiveColor,
    updateUserPath,
    addMoveToHistory,
    incrementMoveCount,
    resetMoveCount,
    clearMoveHistory,
    setLevelData,
    setUserPaths,
    setIsLevelComplete,
    setIsGenerating,
    setGenerationWarning,
    setLevelUsedFallback,
    setLevelValidationError,
  } = useGameStore();
  
  const handleRegenerate = useCallback(() => {
    setLevelData(null);
    setUserPaths({});
    setIsLevelComplete(false);
    setGenerationWarning(null);
    setLevelUsedFallback(false);
    setLevelValidationError(null);
    const store = useGameStore.getState();
    store.resetMoveCount();
    store.clearMoveHistory();
    store.setActiveColor(null);
    startLevel(null, null, progress, setLevelData, setIsGenerating, setGenerationWarning, store.setProgress, setLevelUsedFallback, setLevelValidationError);
  }, [progress, setLevelData, setUserPaths, setIsLevelComplete, setGenerationWarning, setLevelUsedFallback, setLevelValidationError, setIsGenerating]);
  
  const levelDataHashRef = useRef<string>('');
  
  const levelHash = useMemo(() => {
    if (!levelData) return '';
    return `${levelData.width}x${levelData.height}-${Object.keys(levelData.anchors).length}`;
  }, [levelData]);
  
  useEffect(() => {
    if (levelData) {
      if (levelDataHashRef.current !== levelHash) {
        levelDataHashRef.current = levelHash;
        resetMoveCount();
        clearMoveHistory();
        setActiveColor(null);
      }
    } else {
      levelDataHashRef.current = '';
      resetMoveCount();
      clearMoveHistory();
      setActiveColor(null);
    }
  }, [levelData, levelHash, resetMoveCount, clearMoveHistory, setActiveColor]);

  const activeTheme = useTheme();
  const currentPalette = useMemo(
    () => activeTheme.palette || getCurrentPalette(progress),
    [activeTheme.palette, progress]
  );

  const isLarge = useMemo(
    () => levelData ? isLargeGrid(levelData.width, levelData.height) : false,
    [levelData]
  );

  const handlePlayStart = useCallback((e: React.PointerEvent) => {
    if (isGenerating || isLevelComplete || !levelData || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const idx = getCellIndex(e.clientX, e.clientY, levelData.width, levelData.height, rect);
    if (idx === -1) return;

    if (levelData.anchors[idx]) {
      const { colorId } = levelData.anchors[idx];
      setActiveColor(colorId);
      updateUserPath(colorId, [idx]);
      lastTouchedIndex.current = idx;
      if (progress.sound) {
        audioEngine.playColorNote(colorId, 0.15);
      }
      hapticFeedback.playPop();
      return;
    }

    const pathLookup = createPathLookupMap(userPaths);
    const existingPath = findPathContainingCell(idx, pathLookup, userPaths);
    if (existingPath) {
      setActiveColor(existingPath.colorId);
      updateUserPath(existingPath.colorId, existingPath.path.slice(0, existingPath.path.indexOf(idx) + 1));
      lastTouchedIndex.current = idx;
    }
  }, [isGenerating, isLevelComplete, levelData, userPaths, progress.sound, setActiveColor, updateUserPath]);

  const handlePlayMove = useCallback((e: React.PointerEvent) => {
    if (activeColor === null || isGenerating || !levelData || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const idx = getCellIndex(e.clientX, e.clientY, levelData.width, levelData.height, rect);
    if (idx === -1) return;

    const currentPath = userPaths[activeColor] || [];
    const lastIdx = currentPath[currentPath.length - 1];

    if (!isValidMove(lastIdx, idx, levelData.width, lastTouchedIndex.current)) {
      return;
    }

    const result = handlePathMovement(
      idx,
      activeColor,
      currentPath,
      levelData,
      userPaths,
      setActiveColor,
      updateUserPath,
      progress.sound
    );

    if (!result.handled) {
      return;
    }

    if (result.shouldUpdateLastTouched) {
      lastTouchedIndex.current = idx;
    }
    if (result.shouldAddHistory) {
      addMoveToHistory();
    }
    if (result.shouldIncrementMove) {
      incrementMoveCount();
    }
  }, [activeColor, isGenerating, levelData, userPaths, progress.sound, setActiveColor, updateUserPath, addMoveToHistory, incrementMoveCount]);

  const handlePlayEnd = useCallback(() => {
    setActiveColor(null);
  }, [setActiveColor]);

  useLevelCompletion();

  // Memoize grid cells array - only recreate when grid size changes
  const gridCells = useMemo(
    () => {
      if (!levelData) return [];
      const size = levelData.width * levelData.height;
      const cells: number[] = new Array(size);
      for (let i = 0; i < size; i++) {
        cells[i] = i;
      }
      return cells;
    },
    [levelData?.width, levelData?.height]
  );

  // Create reverse lookup map for O(1) path color lookups
  const pathLookupMap = useMemo(
    () => createPathLookupMap(userPaths),
    [userPaths]
  );

  // Memoize helper function to get path color for a cell
  const getPathColor = useCallback((cellIndex: number): string | null => {
    const colorId = pathLookupMap.get(cellIndex);
    if (colorId === undefined) return null;
    return currentPalette[colorId % currentPalette.length].hex;
  }, [pathLookupMap, currentPalette]);

  if (!levelData) {
    return null;
  }

  return (
    <div
      className="relative w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden transition-all duration-300 z-10"
      style={{
        aspectRatio: isLarge ? undefined : `${levelData.width}/${levelData.height}`,
        maxHeight: `${GRID.MAX_HEIGHT_VH}vh`,
      }}
    >
      <div className={`absolute inset-0 ${isLarge ? 'overflow-auto' : 'overflow-auto no-scrollbar'}`}>
        <div
          className="relative"
          style={isLarge ? {
            width: `${levelData.width * GRID.CELL_SIZE}px`,
            height: `${levelData.height * GRID.CELL_SIZE}px`,
          } : {
            width: '100%',
            height: '100%',
          }}
        >
          <div
            ref={gridRef}
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${levelData.width}, 1fr)`,
              gridTemplateRows: `repeat(${levelData.height}, 1fr)`,
            }}
          >
            {gridCells.map((i) => (
              <GridCell
                key={i}
                cellIndex={i}
                anchor={levelData.anchors[i]}
                pathColor={getPathColor(i)}
                currentPalette={currentPalette}
                isLevelComplete={isLevelComplete}
                colorblind={progress.colorblind}
                levelData={levelData}
              />
            ))}
          </div>
          <LoadingOverlay isGenerating={isGenerating} />
          <WarningBanner
            generationWarning={generationWarning}
            levelUsedFallback={levelUsedFallback}
            levelValidationError={levelValidationError}
            onRegenerate={handleRegenerate}
          />
          <div
            className="absolute inset-0 z-30"
            onPointerDown={handlePlayStart}
            onPointerMove={handlePlayMove}
            onPointerUp={handlePlayEnd}
            onPointerLeave={handlePlayEnd}
            onContextMenu={(e) => e.preventDefault()}
            style={{ pointerEvents: 'auto', touchAction: 'none' }}
          />
          <PathSVG
            userPaths={userPaths}
            currentPalette={currentPalette}
            levelData={levelData}
          />
        </div>
      </div>
      
      {isLevelComplete && (
        <>
          <LevelCompleteModal />
          <Celebration
            colors={Object.keys(userPaths).map((cId) => {
              const colorId = parseInt(cId);
              return currentPalette[colorId % currentPalette.length].hex;
            })}
          />
        </>
      )}
    </div>
  );
};
