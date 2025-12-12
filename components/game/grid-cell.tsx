'use client';

import React from 'react';
import { COLOR_BLIND_SYMBOLS } from '@/constants';
import { ColorPalette, LevelData } from '@/types';
import { isLargeGrid } from '@/utils/grid-utils';

interface GridCellProps {
  cellIndex: number;
  anchor: { colorId: number; type: 'endpoint' } | undefined;
  pathColor: string | null;
  currentPalette: ColorPalette[];
  isLevelComplete: boolean;
  colorblind: boolean;
  levelData: LevelData | null;
}

/**
 * Memoized grid cell component to prevent unnecessary re-renders.
 * Only re-renders when its specific props change.
 */
export const GridCell: React.FC<GridCellProps> = React.memo(({
  cellIndex,
  anchor,
  pathColor,
  currentPalette,
  isLevelComplete,
  colorblind,
  levelData,
}) => {
  const anchorColor = anchor
    ? currentPalette[anchor.colorId % currentPalette.length].hex
    : null;

  // Show numbers for:
  // 1. Large grids (20×20+) for clarity
  // 2. Colorblind mode
  // 3. When there are more than 10 colors (for better differentiation)
  // 4. When palette limit is hit (determined by number of unique colors in level)
  const isLarge = levelData ? isLargeGrid(levelData.width, levelData.height) : false;
  const uniqueColors = levelData
    ? new Set(Object.values(levelData.anchors).map(a => a.colorId)).size
    : 0;
  const hasManyColors = uniqueColors > 10;
  const paletteLimitHit = uniqueColors >= currentPalette.length;
  const showNumber = isLarge || colorblind || hasManyColors || paletteLimitHit;

  const displayNumber = anchor && showNumber
    ? (anchor.colorId + 1).toString() // Show 1-based number
    : null;

  const colorBlindSymbol = colorblind && anchor && !isLarge
    ? COLOR_BLIND_SYMBOLS[anchor.colorId % COLOR_BLIND_SYMBOLS.length]
    : null;

  return (
    <div
      key={cellIndex}
      className="relative border border-white/5 flex items-center justify-center"
    >
      {pathColor && (
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: pathColor }}
        />
      )}
      {anchor && (
        <div
          className="rounded-full z-10 shadow-lg transition-transform duration-300 flex items-center justify-center text-black/50"
          style={{
            backgroundColor: anchorColor || undefined,
            width: '60%',
            height: '60%',
            boxShadow: anchorColor ? `0 0 10px 2px ${anchorColor}` : undefined,
            transform: isLevelComplete ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          {showNumber && displayNumber ? (
            <span
              className={`font-black ${isLarge ? 'text-[10px]' : 'text-lg'}`}
              style={{
                color: '#ffffff',
                textShadow: '0 0 3px black, 0 0 3px black, 0 0 3px black',
                fontWeight: 900,
              }}
            >
              {displayNumber}
            </span>
          ) : colorblind && colorBlindSymbol ? (
            <span className="text-white font-black text-lg" style={{ textShadow: '0 0 3px black, 0 0 3px black' }}>
              {colorBlindSymbol}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
});

GridCell.displayName = 'GridCell';
