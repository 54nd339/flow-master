/**
 * File-based level pool storage system.
 * Stores pre-generated levels in JSON files organized by grid size.
 * 
 * SERVER-ONLY MODULE - Do not import in client-side code
 */

// Throw error if imported client-side - must be before any imports
if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.versions?.node) {
  throw new Error('level-pool.ts is a server-only module and cannot be imported in client-side code');
}

// Server-only imports - these will only work in Node.js environment
import { promises as fs } from 'fs';
import path from 'path';
import { LevelData } from '@/types';
import { generateLevelHash } from '../level-compression';

const LEVELS_DIR = path.join(process.cwd(), 'data', 'levels');
const POOL_CONFIG_FILE = path.join(LEVELS_DIR, 'pool-config.json');

interface PoolConfig {
  generationRounds: number;
  levelsPerRound: number;
  lastGenerated: Record<string, number>; // gridSize -> timestamp
}

interface LevelPoolEntry {
  level: LevelData;
  hash: string;
  generatedAt: number;
}

/**
 * Ensures we're in a server environment
 */
function ensureServer(): void {
  if (typeof window !== 'undefined') {
    throw new Error('level-pool can only be used server-side');
  }
}

/**
 * Ensures the levels directory exists
 */
async function ensureLevelsDir(): Promise<void> {
  ensureServer();
  try {
    await fs.mkdir(LEVELS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}

/**
 * Gets the file path for a specific grid size
 */
function getGridSizeFilePath(width: number, height: number): string {
  ensureServer();
  return path.join(LEVELS_DIR, `${width}x${height}.json`);
}


/**
 * Reads levels from file for a specific grid size
 */
export async function getLevelsFromPool(
  width: number,
  height: number
): Promise<LevelPoolEntry[]> {
  ensureServer();
  try {
    await ensureLevelsDir();
    const filePath = getGridSizeFilePath(width, height);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Gets a random level from the pool for a specific grid size
 */
export async function getRandomLevelFromPool(
  width: number,
  height: number
): Promise<LevelData | null> {
  const levels = await getLevelsFromPool(width, height);
  if (levels.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * levels.length);
  return levels[randomIndex].level;
}

/**
 * Adds a level to the pool for a specific grid size
 */
export async function addLevelToPool(
  width: number,
  height: number,
  level: LevelData
): Promise<void> {
  await ensureLevelsDir();
  const levels = await getLevelsFromPool(width, height);
  const hash = generateLevelHash(level);
  
  // Check for duplicates
  if (levels.some(entry => entry.hash === hash)) {
    return; // Level already exists
  }
  
  const entry: LevelPoolEntry = {
    level,
    hash,
    generatedAt: Date.now(),
  };
  
  levels.push(entry);
  const filePath = getGridSizeFilePath(width, height);
  await fs.writeFile(filePath, JSON.stringify(levels, null, 2), 'utf-8');
}

/**
 * Gets the count of levels in the pool for a specific grid size
 */
export async function getPoolCount(
  width: number,
  height: number
): Promise<number> {
  const levels = await getLevelsFromPool(width, height);
  return levels.length;
}

/**
 * Gets all unique hashes from the pool across all grid sizes
 */
export async function getAllPoolHashes(): Promise<Set<string>> {
  await ensureLevelsDir();
  const hashes = new Set<string>();
  
  try {
    const files = await fs.readdir(LEVELS_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'pool-config.json') {
        const filePath = path.join(LEVELS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const levels: LevelPoolEntry[] = JSON.parse(data);
        levels.forEach(entry => hashes.add(entry.hash));
      }
    }
  } catch (error) {
    // Directory might be empty, return empty set
  }
  
  return hashes;
}

/**
 * Checks if a level hash exists in the pool
 */
export async function isHashInPool(hash: string): Promise<boolean> {
  const allHashes = await getAllPoolHashes();
  return allHashes.has(hash);
}

/**
 * Gets pool configuration
 */
export async function getPoolConfig(): Promise<PoolConfig> {
  try {
    await ensureLevelsDir();
    const data = await fs.readFile(POOL_CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default config
    return {
      generationRounds: 20,
      levelsPerRound: 5, // LEVELS_PER_STAGE
      lastGenerated: {},
    };
  }
}

/**
 * Updates pool configuration
 */
export async function updatePoolConfig(config: Partial<PoolConfig>): Promise<void> {
  await ensureLevelsDir();
  const current = await getPoolConfig();
  const updated = { ...current, ...config };
  await fs.writeFile(POOL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
}

/**
 * Gets all unique grid sizes that have levels in the pool
 */
export async function getPoolGridSizes(): Promise<Array<{ width: number; height: number }>> {
  await ensureLevelsDir();
  const gridSizes: Array<{ width: number; height: number }> = [];
  
  try {
    const files = await fs.readdir(LEVELS_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'pool-config.json') {
        const match = file.match(/^(\d+)x(\d+)\.json$/);
        if (match) {
          gridSizes.push({
            width: parseInt(match[1]),
            height: parseInt(match[2]),
          });
        }
      }
    }
  } catch (error) {
    // Directory might be empty
  }
  
  return gridSizes;
}

