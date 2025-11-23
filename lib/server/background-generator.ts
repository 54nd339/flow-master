/**
 * Background level generator that pre-generates levels on server startup.
 * Generates LEVELS_PER_STAGE levels per grid size, repeated for configurable rounds.
 * 
 * SERVER-ONLY MODULE - Do not import in client-side code
 */

// Throw error if imported client-side - must be before any imports
if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.versions?.node) {
  throw new Error('background-generator.ts is a server-only module and cannot be imported in client-side code');
}

import { LevelData } from '@/types';
import { STAGES, LEVELS_PER_STAGE, BACKGROUND_GENERATION } from '@/config';
import { generateUniqueLevelSync } from '@/utils/level-generation-utils';
import {
  addLevelToPool,
  getPoolCount,
  getAllPoolHashes,
  getPoolConfig,
  updatePoolConfig,
} from './level-pool';
import { getServerPalette } from '../server-palettes';

/**
 * Gets unique grid sizes from stages
 */
function getUniqueGridSizes(): Array<{ width: number; height: number; minC: number; maxC: number }> {
  const seen = new Set<string>();
  const gridSizes: Array<{ width: number; height: number; minC: number; maxC: number }> = [];
  
  for (const stage of STAGES) {
    const key = `${stage.w}x${stage.h}`;
    if (!seen.has(key)) {
      seen.add(key);
      gridSizes.push({
        width: stage.w,
        height: stage.h,
        minC: stage.minC,
        maxC: stage.maxC,
      });
    }
  }
  
  return gridSizes;
}

/**
 * Generates a single level with uniqueness checking
 */
async function generateUniqueLevel(
  width: number,
  height: number,
  minC: number,
  maxC: number,
  palette: Array<{ id: number; hex: string }>,
  existingHashes: Set<string>,
  maxAttempts: number = 200
): Promise<LevelData | null> {
  const result = generateUniqueLevelSync({
    width,
    height,
    minC,
    maxC,
    palette,
    existingHashes,
    maxAttempts,
  });

  if (result.isUnique && result.level && result.hash) {
    existingHashes.add(result.hash);
    return result.level;
  }
  
  return null;
}

/**
 * Generates levels for a specific grid size
 */
async function generateLevelsForGridSize(
  width: number,
  height: number,
  minC: number,
  maxC: number,
  targetCount: number,
  existingHashes: Set<string>
): Promise<number> {
  const palette = getServerPalette('WATER'); // Use WATER theme for pre-generation
  let generated = 0;
  
  console.log(`[Background Generator] Generating ${targetCount} levels for ${width}x${height}...`);
  
  while (generated < targetCount) {
    const level = await generateUniqueLevel(
      width,
      height,
      minC,
      maxC,
      palette,
      existingHashes,
      BACKGROUND_GENERATION.MAX_ATTEMPTS_PER_LEVEL
    );
    
    if (level) {
      await addLevelToPool(width, height, level);
      generated++;
      
      if (generated % 5 === 0) {
        console.log(`[Background Generator] Generated ${generated}/${targetCount} levels for ${width}x${height}`);
      }
    } else {
      // Failed to generate after maxAttempts, skip this one
      console.warn(`[Background Generator] Failed to generate level for ${width}x${height} after max attempts`);
      break;
    }
    
    // Small delay to avoid blocking
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return generated;
}

/**
 * Starts background level generation
 */
export async function startBackgroundGeneration(): Promise<void> {
  // Check if already running
  if ((global as any).__backgroundGeneratorRunning) {
    return;
  }
  (global as any).__backgroundGeneratorRunning = true;
  
  console.log('[Background Generator] Starting background level generation...');
  
  try {
    const config = await getPoolConfig();
    const generationRounds = config.generationRounds || BACKGROUND_GENERATION.ROUNDS;
    const levelsPerRound = config.levelsPerRound || BACKGROUND_GENERATION.LEVELS_PER_ROUND;
    const targetCount = generationRounds * levelsPerRound;
    
    const gridSizes = getUniqueGridSizes();
    const existingHashes = await getAllPoolHashes();
    
    console.log(`[Background Generator] Target: ${targetCount} levels per grid size (${generationRounds} rounds × ${levelsPerRound} levels)`);
    console.log(`[Background Generator] Grid sizes to process: ${gridSizes.length}`);
    
    // Process each grid size
    for (const gridSize of gridSizes) {
      const currentCount = await getPoolCount(gridSize.width, gridSize.height);
      const needed = targetCount - currentCount;
      
      if (needed <= 0) {
        console.log(`[Background Generator] ${gridSize.width}x${gridSize.height} already has ${currentCount} levels, skipping`);
        continue;
      }
      
      // Generate in rounds
      for (let round = 0; round < generationRounds; round++) {
        const roundTarget = Math.min(levelsPerRound, targetCount - (await getPoolCount(gridSize.width, gridSize.height)));
        
        if (roundTarget <= 0) {
          break; // Already have enough
        }
        
        await generateLevelsForGridSize(
          gridSize.width,
          gridSize.height,
          gridSize.minC,
          gridSize.maxC,
          roundTarget,
          existingHashes
        );
        
        // Update last generated timestamp
        await updatePoolConfig({
          lastGenerated: {
            ...config.lastGenerated,
            [`${gridSize.width}x${gridSize.height}`]: Date.now(),
          },
        });
        
        // Delay between rounds
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const finalCount = await getPoolCount(gridSize.width, gridSize.height);
      console.log(`[Background Generator] Completed ${gridSize.width}x${gridSize.height}: ${finalCount} levels`);
    }
    
    console.log('[Background Generator] Background generation completed!');
  } catch (error) {
    console.error('[Background Generator] Error during background generation:', error);
  } finally {
    (global as any).__backgroundGeneratorRunning = false;
  }
}

/**
 * Starts background generation in a non-blocking way
 */
export function startBackgroundGenerationAsync(): void {
  // Start in background, don't await
  startBackgroundGeneration().catch(error => {
    console.error('[Background Generator] Fatal error:', error);
  });
}

