import { GameProgress, LevelData } from '@/types';
import { STAGES, BACKGROUND_GENERATION } from '@/config';
import { generateLevel } from './level-generator';
import { generateLevelHash, isLevelHashGenerated, decompressLevel } from './level-compression';
import { getCurrentPalette, calculateColorCounts } from '@/utils';
import { validateNumberlinkRules } from './level-validator';

/**
 * Pre-generates a level in the background for campaign mode.
 * Runs fully client-side to avoid iframe hops or server latency.
 * 
 * @param stageId - Stage ID to generate level for
 * @param levelIndex - Level index (0-based) within the stage
 * @param progress - Current game progress state
 * @param onComplete - Callback when level is generated
 */
export const preGenerateCampaignLevel = (
  stageId: number,
  levelIndex: number,
  progress: GameProgress,
  onComplete: (level: LevelData | null) => void
) => {
  setTimeout(() => {
    try {
      const stageConfig = STAGES.find((s) => s.id === stageId) || STAGES[0];
      const historyList = progress.history[stageId] || [];

      // If this level already exists in history, there is nothing to pre-generate
      if (historyList[levelIndex]) {
        onComplete(null);
        return;
      }

      const stageHashes = new Set(
        historyList
          .map((str) => {
            const lvl = decompressLevel(str);
            return lvl ? generateLevelHash(lvl) : null;
          })
          .filter((h): h is string => h !== null)
      );
      const globalHashes = new Set(progress.generatedLevelHashes || []);
      const allExistingHashes = new Set([...stageHashes, ...globalHashes]);
      const pal = getCurrentPalette(progress);
      const { minC, maxC } = calculateColorCounts(stageConfig.w, stageConfig.h, pal.length);

      let newLevel: LevelData | null = null;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = BACKGROUND_GENERATION.MAX_ATTEMPTS_PER_LEVEL;

      const scheduleNextAttempt = (callback: () => void) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(callback, { timeout: 50 });
        } else {
          setTimeout(callback, 0);
        }
      };

      const tryGenerate = () => {
        if (isUnique || attempts >= maxAttempts) {
          if (newLevel && isUnique) {
            onComplete(newLevel);
          } else {
            onComplete(null);
          }
          return;
        }

        const result = generateLevel(stageConfig.w, stageConfig.h, minC, maxC, pal, undefined, maxAttempts);
        newLevel = result.level;

        const validation = validateNumberlinkRules(newLevel);
        if (!validation.isValid) {
          attempts++;
          scheduleNextAttempt(tryGenerate);
          return;
        }

        const hash = generateLevelHash(newLevel);
        if (!allExistingHashes.has(hash)) {
          isUnique = true;
          onComplete(newLevel);
        } else {
          attempts++;
          scheduleNextAttempt(tryGenerate);
        }
      };

      tryGenerate();
    } catch (err) {
      console.error('Pre-generation error:', err);
      onComplete(null);
    }
  }, 0);
};

/**
 * Pre-generates a level in the background for time attack or zen mode.
 * 
 * @param width - Grid width
 * @param height - Grid height
 * @param minColors - Minimum colors
 * @param maxColors - Maximum colors
 * @param palette - Color palette
 * @param progress - Current game progress state
 * @param onComplete - Callback when level is generated
 */
export const preGenerateLevel = (
  width: number,
  height: number,
  minColors: number,
  maxColors: number,
  palette: any[] | null,
  progress: GameProgress,
  onComplete: (level: LevelData | null) => void
) => {
  setTimeout(() => {
    try {
      const globalHashes = new Set(progress.generatedLevelHashes || []);
      let newLevel: LevelData | null = null;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = BACKGROUND_GENERATION.MAX_ATTEMPTS_PER_LEVEL;

      // Use requestIdleCallback with setTimeout fallback to yield control between attempts
      const scheduleNextAttempt = (callback: () => void) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(callback, { timeout: 50 });
        } else {
          setTimeout(callback, 0);
        }
      };

      const tryGenerate = () => {
        if (isUnique || attempts >= maxAttempts) {
          if (newLevel && isUnique) {
            onComplete(newLevel);
          } else {
            onComplete(null);
          }
          return;
        }

        // Generate one attempt
        const levelSeed = Math.floor(Math.random() * 1000000);
        const result = generateLevel(width, height, minColors, maxColors, palette, levelSeed);
        newLevel = result.level;
        const hash = generateLevelHash(newLevel);

        if (!isLevelHashGenerated(hash, progress.generatedLevelHashes || [])) {
          isUnique = true;
          onComplete(newLevel);
        } else {
          attempts++;
          scheduleNextAttempt(tryGenerate);
        }
      };

      // Start the async generation loop
      tryGenerate();
    } catch (err) {
      console.error('Pre-generation error:', err);
      onComplete(null);
    }
  }, 0);
};
