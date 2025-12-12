import { NextRequest, NextResponse } from 'next/server';
import { generateLevelHash, decompressLevel } from '@/lib/level-compression';
import { generateUniqueLevelSync } from '@/utils/level-generation-utils';
import { calculateColorCounts } from '@/utils';
import { STAGES, BACKGROUND_GENERATION } from '@/config';
import { GameProgress, LevelData } from '@/types';
import { getRandomLevelFromPool, getAllPoolHashes, getPoolCount, addLevelToPool, isHashInPool } from '@/lib/server/level-pool';
import { getServerPalette } from '@/lib/server-palettes';
import { startBackgroundGenerationAsync } from '@/lib/server/background-generator';

// Initialize background generator on first API call
let backgroundGeneratorStarted = false;
if (!backgroundGeneratorStarted) {
  backgroundGeneratorStarted = true;
  startBackgroundGenerationAsync();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stageId,
      levelIndex,
      width,
      height,
      minColors,
      maxColors,
      palette,
      progress,
      generatedLevelHashes = [],
      history = {},
    } = body;

    // Determine grid dimensions
    let gridWidth = width;
    let gridHeight = height;
    let colorPalette = palette;
    let minC = minColors;
    let maxC = maxColors;

    // If client already generated a level (because pool was empty), persist it to pool
    // Expected shape: { clientGeneratedLevel?: LevelData, clientGeneratedHash?: string }
    if (body && (body.clientGeneratedLevel || body.clientGeneratedHash)) {
      try {
        const submittedLevel: LevelData | undefined = body.clientGeneratedLevel;
        const submittedHash: string | undefined = body.clientGeneratedHash;

        // Use provided hash if present, otherwise compute from submitted level
        let hashToCheck: string | undefined = submittedHash;
        if (!hashToCheck && submittedLevel) {
          try {
            hashToCheck = generateLevelHash(submittedLevel);
          } catch (e) {
            console.warn('Failed to compute hash for submitted level:', e);
          }
        }

        if (hashToCheck && !(await isHashInPool(hashToCheck)) && submittedLevel) {
          // Persist asynchronously (don't block the main generation flow)
          addLevelToPool(gridWidth, gridHeight, submittedLevel).catch((err) => {
            console.warn('Failed to persist client-generated level to pool:', err);
          });
        }
      } catch (err) {
        console.warn('Error handling client-submitted level:', err);
      }
    }

    if (stageId !== undefined && stageId !== null) {
      // Campaign mode - use stage config
      const stageConfig = STAGES.find((s) => s.id === stageId) || STAGES[0];
      if (!stageConfig) {
        return NextResponse.json(
          { success: false, error: 'Invalid stage ID' },
          { status: 400 }
        );
      }

      gridWidth = stageConfig.w;
      gridHeight = stageConfig.h;

      // Safely get palette with fallback
      try {
        const themeId = (progress && typeof progress === 'object' && 'themeId' in progress)
          ? (progress as GameProgress).themeId
          : 'WATER';

        const pal = getServerPalette(themeId);
        colorPalette = pal;
        const colorCounts = calculateColorCounts(gridWidth, gridHeight, pal.length);
        minC = colorCounts.minC;
        maxC = colorCounts.maxC;
      } catch (paletteError) {
        console.error('Palette error:', paletteError);
        // Fallback to WATER palette
        const pal = getServerPalette('WATER');
        colorPalette = pal;
        const colorCounts = calculateColorCounts(gridWidth, gridHeight, pal.length);
        minC = colorCounts.minC;
        maxC = colorCounts.maxC;
      }
    } else {
      // Non-campaign mode - validate required params
      if (!width || !height || !minColors || !maxColors || !palette) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters for non-campaign mode' },
          { status: 400 }
        );
      }
    }

    // Validate grid dimensions
    if (!gridWidth || !gridHeight || gridWidth < 3 || gridHeight < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid grid dimensions' },
        { status: 400 }
      );
    }

    // Validate palette
    if (!colorPalette || !Array.isArray(colorPalette) || colorPalette.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid palette' },
        { status: 400 }
      );
    }

    // Try to get level from pool first (for campaign mode with stageId)
    if (stageId !== undefined && stageId !== null) {
      try {
        // Check if pool has levels for this grid size
        const poolCount = await getPoolCount(gridWidth, gridHeight);

        // If pool is empty, tell client to generate
        if (poolCount === 0) {
          return NextResponse.json({
            success: false,
            error: 'Pool empty',
            clientShouldGenerate: true,
          });
        }

        const poolLevel = await getRandomLevelFromPool(gridWidth, gridHeight);
        if (poolLevel) {
          // Check if level is unique for this client
          const poolHash = generateLevelHash(poolLevel);

          // Check stage history for duplicates
          const historyList = (history && typeof history === 'object')
            ? (history[stageId] || [])
            : [];

          const stageHashes = new Set<string>();
          try {
            for (const str of historyList) {
              if (typeof str === 'string') {
                const lvl = decompressLevel(str);
                if (lvl) {
                  const hash = generateLevelHash(lvl);
                  if (hash) stageHashes.add(hash);
                }
              }
            }
          } catch (hashError) {
            console.warn('Error processing history hashes:', hashError);
          }

          const globalHashes = new Set(
            Array.isArray(generatedLevelHashes)
              ? generatedLevelHashes.filter((h): h is string => typeof h === 'string')
              : []
          );

          // If pool level is unique for this client, return it
          if (!stageHashes.has(poolHash) && !globalHashes.has(poolHash)) {
            return NextResponse.json({
              success: true,
              level: poolLevel,
              hash: poolHash,
              fromPool: true,
            });
          }
        }
      } catch (poolError) {
        console.warn('Error getting level from pool:', poolError);
        // Return error so client can generate
        return NextResponse.json({
          success: false,
          error: 'Pool error',
          clientShouldGenerate: true,
        });
      }
    }

    // If we reach here and it's campaign mode, pool was empty or all levels were duplicates
    // Client should generate instead
    if (stageId !== undefined && stageId !== null) {
      return NextResponse.json({
        success: false,
        error: 'No unique levels available in pool',
        clientShouldGenerate: true,
      });
    }

    // Fallback to on-demand generation (only for non-campaign mode)
    // Check stage history for duplicates
    const historyList = (history && typeof history === 'object' && stageId !== undefined && stageId !== null)
      ? (history[stageId] || [])
      : [];

    const stageHashes = new Set<string>();
    try {
      for (const str of historyList) {
        if (typeof str === 'string') {
          const lvl = decompressLevel(str);
          if (lvl) {
            const hash = generateLevelHash(lvl);
            if (hash) stageHashes.add(hash);
          }
        }
      }
    } catch (hashError) {
      console.warn('Error processing history hashes:', hashError);
    }

    // Also check pool hashes for global uniqueness
    const poolHashes = await getAllPoolHashes();
    const globalHashes = new Set(
      Array.isArray(generatedLevelHashes)
        ? generatedLevelHashes.filter((h): h is string => typeof h === 'string')
        : []
    );
    const allExistingHashes = new Set([...stageHashes, ...globalHashes, ...poolHashes]);

    // Generate unique level using shared utility
    const seedGenerator = (stageId !== undefined && stageId !== null && levelIndex !== undefined && levelIndex !== null)
      ? (attempt: number) => stageId * 1000 + levelIndex + attempt
      : undefined;

    const result = generateUniqueLevelSync({
      width: gridWidth,
      height: gridHeight,
      minC,
      maxC,
      palette: colorPalette,
      existingHashes: allExistingHashes,
      maxAttempts: BACKGROUND_GENERATION.MAX_ATTEMPTS_PER_LEVEL,
      seedGenerator,
    });

    const newLevel = result.level;
    const isUnique = result.isUnique;

    if (newLevel && isUnique) {
      return NextResponse.json({
        success: true,
        level: newLevel,
        hash: result.hash,
      });
    } else {
      // Return the last generated level even if not unique
      return NextResponse.json({
        success: true,
        level: newLevel,
        hash: result.hash,
        warning: !isUnique ? 'Level may not be unique' : undefined,
      });
    }
  } catch (error) {
    console.error('Level generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate level',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
