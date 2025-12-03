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
import { STAGES, BACKGROUND_GENERATION } from '@/config';
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
 * Global flag to track background generation status
 */
interface GlobalWithBackgroundGenerator {
  __backgroundGeneratorRunning?: boolean;
}

const globalWithBG = global as GlobalWithBackgroundGenerator;

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
 * Generates a batch of levels for a specific grid size
 * 
 * @param targetCount - Number of levels to generate in this batch (typically LEVELS_PER_BATCH)
 * @returns Number of levels successfully generated
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
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures
  
  while (generated < targetCount && consecutiveFailures < maxConsecutiveFailures) {
    try {
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
        consecutiveFailures = 0; // Reset failure counter on success
      } else {
        consecutiveFailures++;
        console.warn(`[Background Generator] Failed to generate level for ${width}x${height} (${consecutiveFailures}/${maxConsecutiveFailures})`);
      }
      
      // Small delay to avoid blocking (use setImmediate in Node.js for better async behavior)
      await new Promise(resolve => setImmediate(resolve));
      
    } catch (error) {
      consecutiveFailures++;
      console.error(`[Background Generator] Error generating level for ${width}x${height}:`, error);
      
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.error(`[Background Generator] Too many failures for ${width}x${height}, stopping batch`);
        break;
      }
    }
  }
  
  return generated;
}

/**
 * Continuous background level generation loop
 * 
 * Architecture:
 * - Generates LEVELS_PER_BATCH levels per grid size in round-robin fashion
 * - Target: TARGET_POOL_SIZE levels per grid size
 * - Non-blocking: Uses setImmediate/setTimeout for async breaks
 * - Continuous: Runs forever, replenishing pool as levels consumed
 * - Efficient: Only generates when pool is below target
 */
export async function startBackgroundGeneration(): Promise<void> {
  // Check if already running
  if (globalWithBG.__backgroundGeneratorRunning) {
    console.log('[Background Generator] Already running, skipping duplicate start');
    return;
  }
  globalWithBG.__backgroundGeneratorRunning = true;
  
  console.log('[Background Generator] Starting continuous background generation...');
  console.log(`[Background Generator] Target pool size: ${BACKGROUND_GENERATION.TARGET_POOL_SIZE} levels per grid size`);
  console.log(`[Background Generator] Batch size: ${BACKGROUND_GENERATION.LEVELS_PER_BATCH} levels`);
  
  const gridSizes = getUniqueGridSizes();
  console.log(`[Background Generator] Monitoring ${gridSizes.length} grid sizes`);
  
  // Continuous generation loop
  while (globalWithBG.__backgroundGeneratorRunning) {
    try {
      const existingHashes = await getAllPoolHashes();
      let anyGenerationDone = false;
      
      // Process each grid size in round-robin fashion
      for (const gridSize of gridSizes) {
        // Check if we should stop
        if (!globalWithBG.__backgroundGeneratorRunning) {
          break;
        }
        
        const currentCount = await getPoolCount(gridSize.width, gridSize.height);
        const needed = BACKGROUND_GENERATION.TARGET_POOL_SIZE - currentCount;
        
        if (needed <= 0) {
          // Pool is full for this grid size, skip
          continue;
        }
        
        // Generate one batch (LEVELS_PER_BATCH levels)
        const batchSize = Math.min(needed, BACKGROUND_GENERATION.LEVELS_PER_BATCH);
        
        console.log(`[Background Generator] ${gridSize.width}x${gridSize.height}: ${currentCount}/${BACKGROUND_GENERATION.TARGET_POOL_SIZE} levels, generating ${batchSize}...`);
        
        const generated = await generateLevelsForGridSize(
          gridSize.width,
          gridSize.height,
          gridSize.minC,
          gridSize.maxC,
          batchSize,
          existingHashes
        );
        
        if (generated > 0) {
          anyGenerationDone = true;
          const newCount = await getPoolCount(gridSize.width, gridSize.height);
          console.log(`[Background Generator] ${gridSize.width}x${gridSize.height}: Generated ${generated} levels, pool now has ${newCount}`);
          
          // Update last generated timestamp
          try {
            const config = await getPoolConfig();
            await updatePoolConfig({
              lastGenerated: {
                ...config.lastGenerated,
                [`${gridSize.width}x${gridSize.height}`]: Date.now(),
              },
            });
          } catch (configError) {
            console.warn('[Background Generator] Failed to update config:', configError);
          }
        }
        
        // Small delay between grid sizes to avoid blocking
        await new Promise(resolve => setTimeout(resolve, BACKGROUND_GENERATION.BATCH_DELAY_MS));
      }
      
      // If no generation was needed this cycle, wait longer before next cycle
      if (!anyGenerationDone) {
        console.log('[Background Generator] All pools at target size, waiting...');
        await new Promise(resolve => setTimeout(resolve, BACKGROUND_GENERATION.CYCLE_DELAY_MS));
      } else {
        // Short delay between cycles when actively generating
        await new Promise(resolve => setTimeout(resolve, BACKGROUND_GENERATION.BATCH_DELAY_MS));
      }
      
    } catch (error) {
      console.error('[Background Generator] Error in generation loop:', error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, BACKGROUND_GENERATION.CYCLE_DELAY_MS));
    }
  }
  
  console.log('[Background Generator] Stopped');
  globalWithBG.__backgroundGeneratorRunning = false;
}

/**
 * Starts background generation in a non-blocking way
 */
export function startBackgroundGenerationAsync(): void {
  // Start in background, don't await
  startBackgroundGeneration().catch(error => {
    console.error('[Background Generator] Fatal error:', error);
    globalWithBG.__backgroundGeneratorRunning = false;
  });
}

/**
 * Stops the background generation loop gracefully
 */
export function stopBackgroundGeneration(): void {
  console.log('[Background Generator] Stopping...');
  globalWithBG.__backgroundGeneratorRunning = false;
}

