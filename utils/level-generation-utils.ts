import { LevelData, ColorPalette } from '@/types';
import { generateLevel } from '@/lib/level-generator';
import { generateLevelHash } from '@/lib/level-compression';
import { validateNumberlinkRules } from '@/lib/level-validator';

/**
 * Shared utility for generating unique levels with validation and uniqueness checking.
 * Extracted to avoid code duplication across multiple modules.
 */

export interface GenerateUniqueLevelOptions {
  width: number;
  height: number;
  minC: number;
  maxC: number;
  palette: ColorPalette[] | null;
  existingHashes: Set<string>;
  maxAttempts?: number;
  seedGenerator?: (attempt: number) => number;
}

export interface GenerateUniqueLevelResult {
  level: LevelData | null;
  hash: string | null;
  isUnique: boolean;
  attempts: number;
}

/**
 * Generates a unique level with validation and uniqueness checking.
 * 
 * @param options - Generation options
 * @returns Result with level, hash, uniqueness status, and attempt count
 */
export function generateUniqueLevelSync(
  options: GenerateUniqueLevelOptions
): GenerateUniqueLevelResult {
  const {
    width,
    height,
    minC,
    maxC,
    palette,
    existingHashes,
    maxAttempts = 200,
    seedGenerator = () => Math.floor(Math.random() * 1000000),
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const levelSeed = seedGenerator(attempt);
      const result = generateLevel(width, height, minC, maxC, palette, levelSeed);
      const level = result.level;

      if (!level) {
        continue;
      }

      // Validate the level
      const validation = validateNumberlinkRules(level);
      if (!validation.isValid) {
        continue;
      }

      // Check uniqueness
      const hash = generateLevelHash(level);
      if (hash && !existingHashes.has(hash)) {
        return {
          level,
          hash,
          isUnique: true,
          attempts: attempt + 1,
        };
      }
    } catch (error) {
      // Continue to next attempt
      continue;
    }
  }

  // Failed to generate unique level after max attempts
  return {
    level: null,
    hash: null,
    isUnique: false,
    attempts: maxAttempts,
  };
}
