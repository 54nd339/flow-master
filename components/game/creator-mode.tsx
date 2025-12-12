'use client';

import React, { useRef } from 'react';
import { LinkIcon, Unlink, Wand2, ClipboardCopy, PlayCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '@/stores/game-store';
import { generateLevel, decompressLevel, cn } from '@/lib';
import { Button, Card } from '@/components/ui';
import { getCellIndex, validateAndExportCreator, getCurrentPalette, calculateColorCounts } from '@/utils';
import { TIMING } from '@/config';

export const CreatorMode: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    creatorW,
    creatorH,
    creatorLocked,
    creatorAnchors,
    creatorSelectedColor,
    creatorError,
    creatorSuccess,
    importCode,
    progress,
    setCreatorW,
    setCreatorH,
    setCreatorLocked,
    updateCreatorAnchor,
    setCreatorAnchors,
    setCreatorSelectedColor,
    setCreatorError,
    setCreatorSuccess,
    setImportCode,
    setLevelData,
    setViewMode,
    setIsGenerating,
    setIsLevelComplete,
    setUserPaths,
  } = useGameStore();

  const currentPalette = getCurrentPalette(progress);

  const handleCreatorClick = (e: React.PointerEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const idx = getCellIndex(e.clientX, e.clientY, creatorW, creatorH, rect);
    if (idx === -1) return;

    let count = 0;
    Object.values(creatorAnchors).forEach((a) => {
      if (a.colorId === creatorSelectedColor) count++;
    });

    if (creatorAnchors[idx]) {
      updateCreatorAnchor(idx, null);
    } else {
      if (count < 2) {
        updateCreatorAnchor(idx, { colorId: creatorSelectedColor, type: 'endpoint' });
      } else {
        setCreatorError('Max 2 anchors per color.');
        setTimeout(() => setCreatorError(null), TIMING.ERROR_MESSAGE_DURATION);
      }
    }
  };

  const handleRandomizeCreator = () => {
    const { minC, maxC } = calculateColorCounts(creatorW, creatorH, currentPalette.length);
    const result = generateLevel(creatorW, creatorH, minC, maxC, currentPalette);
    setCreatorAnchors(result.level.anchors);
    setCreatorSuccess('Random generated!');
    setTimeout(() => setCreatorSuccess(null), 2000);
  };

  const handleValidateAndExport = () => {
    const result = validateAndExportCreator(creatorW, creatorH, creatorAnchors);
    if (!result.success) {
      setCreatorError(result.error || 'Validation failed');
      setTimeout(() => setCreatorError(null), 2000);
      return;
    }

    if (result.levelString) {
      navigator.clipboard.writeText(result.levelString);
      setCreatorSuccess('Copied!');
      setTimeout(() => setCreatorSuccess(null), TIMING.ERROR_MESSAGE_DURATION);
    }
  };

  const handleImport = () => {
    const lvl = decompressLevel(importCode);
    if (lvl) {
      setLevelData(lvl);
      setViewMode('PLAY');
      setIsGenerating(false);
      setIsLevelComplete(false);
      setUserPaths({});
      setImportCode('');
    } else {
      setCreatorError('Invalid Code');
      setTimeout(() => setCreatorError(null), 2000);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
            Grid Dimensions
          </span>
          <button
            onClick={() => {
              if (creatorLocked) {
                setCreatorH(creatorW);
              }
              setCreatorLocked(!creatorLocked);
            }}
            className={cn(
              'p-1 rounded',
              creatorLocked ? 'bg-white/20 text-white' : 'text-white/40'
            )}
          >
            {creatorLocked ? <LinkIcon size={14} /> : <Unlink size={14} />}
          </button>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-white/60 font-bold block mb-2">
              Width: {creatorW}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              value={creatorW}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCreatorW(v);
                if (creatorLocked) setCreatorH(v);
                setCreatorAnchors({});
              }}
              className="w-full h-1 bg-white/20 rounded-lg accent-white appearance-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-white/60 font-bold block mb-2">
              Height: {creatorH}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              value={creatorH}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCreatorH(v);
                if (creatorLocked) setCreatorW(v);
                setCreatorAnchors({});
              }}
              className="w-full h-1 bg-white/20 rounded-lg accent-white appearance-none"
              disabled={creatorLocked}
            />
          </div>
        </div>
        <Button
          onClick={handleRandomizeCreator}
          variant="secondary"
          className="w-full py-3 flex items-center justify-center gap-2"
        >
          <Wand2 size={16} /> Generate Random Layout
        </Button>
      </Card>

      <div
        className="relative w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden z-10"
        style={{ aspectRatio: `${creatorW}/${creatorH}`, maxHeight: '50vh' }}
      >
        <div
          ref={gridRef}
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${creatorW}, 1fr)`,
            gridTemplateRows: `repeat(${creatorH}, 1fr)`,
          }}
          onPointerDown={handleCreatorClick}
        >
          {Array.from({ length: creatorW * creatorH }).map((_, i) => {
            const anchor = creatorAnchors[i];
            const color = anchor
              ? currentPalette[anchor.colorId % currentPalette.length].hex
              : null;
            return (
              <div
                key={i}
                className="relative border border-white/5 flex items-center justify-center hover:bg-white/5 cursor-pointer"
              >
                {anchor && (
                  <div
                    className="rounded-full shadow-lg"
                    style={{
                      backgroundColor: color || undefined,
                      width: '60%',
                      height: '60%',
                      boxShadow: color ? `0 0 10px 2px ${color}` : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {creatorError && (
          <div className="absolute bottom-4 inset-x-4 bg-red-500/90 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {creatorError}
          </div>
        )}
        {creatorSuccess && (
          <div className="absolute bottom-4 inset-x-4 bg-green-500/90 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} /> {creatorSuccess}
          </div>
        )}
      </div>

      <div className="w-full max-w-md mt-4 flex gap-2 overflow-x-auto pb-4 no-scrollbar z-10">
        {currentPalette.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setCreatorSelectedColor(i)}
            className={cn(
              'w-9 h-9 rounded-full shrink-0 border-2 transition-all',
              creatorSelectedColor === i
                ? 'border-white scale-110'
                : 'border-transparent opacity-40 hover:opacity-100'
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-3 z-10 mb-24">
        <Button
          onClick={handleValidateAndExport}
          variant="secondary"
          className="p-3 flex items-center justify-center gap-2"
        >
          <ClipboardCopy size={16} /> Copy Code
        </Button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste Code..."
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-white/50"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
          />
          <Button
            onClick={handleImport}
            variant="primary"
            size="sm"
            className="p-3"
          >
            <PlayCircle size={18} />
          </Button>
        </div>
      </div>
    </>
  );
};
