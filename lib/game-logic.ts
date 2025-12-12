import { GameProgress, LevelData } from '@/types';
import { STAGES, LEVELS_PER_STAGE } from '@/config';
import { generateLevel } from './level-generator';
import { decompressLevel, generateLevelHash, addLevelHash } from './level-compression';
import { getCurrentPalette, calculateColorCounts } from '@/utils';
import { validateNumberlinkRules } from './level-validator';
import { preGenerateCampaignLevel } from './level-pre-generation';

/**
 * Starts a level for campaign mode, either loading from history or generating a new unique level.
 * 
 * Level Loading Strategy:
 * 1. First attempts to load from stage history (for replay consistency)
 * 2. If not found, generates a new level with uniqueness checks
 * 
 * Uniqueness Checking:
 * - Checks against stage-specific history (levels played in this stage)
 * - Checks against global generatedLevelHashes (all levels across all game modes)
 * - Uses hash-based comparison (grid size + anchor positions) for fast duplicate detection
 * - Attempts up to 20 times to find a unique level
 * - Adds new unique levels to global hash tracking
 * 
 * @param targetStageId - Specific stage ID to load, or null for current stage
 * @param targetLevelIdx - Specific level index (0-based) to load, or null for current level
 * @param progress - Current game progress state
 * @param setLevelData - Function to set the loaded/generated level data
 * @param setIsGenerating - Function to update generation state
 * @param setGenerationWarning - Optional function to show warning if unique level not found
 * @param setProgress - Optional function to update progress (for global hash tracking)
 */
export const startLevel = (
  targetStageId: number | null,
  targetLevelIdx: number | null,
  progress: GameProgress,
  setLevelData: (data: LevelData | null) => void,
  setIsGenerating: (generating: boolean) => void,
  setGenerationWarning?: (warning: string | null) => void,
  setProgress?: (progress: Partial<GameProgress>) => void,
  setLevelUsedFallback?: (used: boolean) => void,
  setLevelValidationError?: (error: string | null) => void,
  shiftPreGeneratedLevel?: () => LevelData | null,
  addPreGeneratedLevel?: (level: LevelData) => void
) => {
  setIsGenerating(true);
  const stageId = targetStageId || progress.stage;
  const stageConfig = STAGES.find((s) => s.id === stageId) || STAGES[0];
  const historyList = progress.history[stageId] || [];
  const levelIndexToPlay = targetLevelIdx !== null ? targetLevelIdx : Math.max(0, progress.level - 1);

  const recordGeneratedHash = (level: LevelData) => {
    if (!setProgress) {
      return;
    }

    try {
      const hash = generateLevelHash(level);
      const updatedHashes = addLevelHash(hash, progress.generatedLevelHashes || []);
      setProgress({ generatedLevelHashes: updatedHashes });
    } catch (error) {
      console.warn('Failed to record generated level hash:', error);
    }
  };

  const scheduleNextLevelPreGeneration = () => {
    if (!addPreGeneratedLevel) {
      return;
    }

    const nextLevelIndex = levelIndexToPlay + 1;
    const nextStageId = nextLevelIndex >= LEVELS_PER_STAGE ? stageId + 1 : stageId;
    const nextLevelIdx = nextLevelIndex >= LEVELS_PER_STAGE ? 0 : nextLevelIndex;

    if (nextStageId > STAGES.length) {
      return;
    }

    // Give the UI a short moment to settle before generating in the background
    setTimeout(() => {
      preGenerateCampaignLevel(nextStageId, nextLevelIdx, progress, (level) => {
        if (level) {
          addPreGeneratedLevel(level);
        }
      });
    }, 500);
  };

  const finalizeLevelLoad = (level: LevelData | null, resetWarnings: boolean = true) => {
    setLevelData(level);

    if (level) {
      if (resetWarnings && setGenerationWarning) {
        setGenerationWarning(null);
      }
      scheduleNextLevelPreGeneration();
    }

    setIsGenerating(false);
  };

  const tryLoadHistoryLevel = (): boolean => {
    if (!historyList[levelIndexToPlay]) {
      return false;
    }

    const loadedLevel = decompressLevel(historyList[levelIndexToPlay]);
    if (!loadedLevel || loadedLevel.width !== stageConfig.w || loadedLevel.height !== stageConfig.h) {
      return false;
    }

    if (setLevelValidationError) {
      setLevelValidationError(null);
    }
    if (setLevelUsedFallback) {
      setLevelUsedFallback(false);
    }

    finalizeLevelLoad(loadedLevel);
    return true;
  };

  // Prefer using levels generated while the previous puzzle was being played
  if (shiftPreGeneratedLevel) {
    const preGenerated = shiftPreGeneratedLevel();
    if (preGenerated && preGenerated.width === stageConfig.w && preGenerated.height === stageConfig.h) {
      recordGeneratedHash(preGenerated);

      if (setLevelValidationError) {
        setLevelValidationError(null);
      }
      if (setLevelUsedFallback) {
        setLevelUsedFallback(false);
      }

      finalizeLevelLoad(preGenerated);
      return;
    }
  }

  // History acts as a replay cache to keep campaign progress deterministic
  if (tryLoadHistoryLevel()) {
    return;
  }

  const clientSideGeneration = () => {
    setTimeout(() => {
      try {
        if (tryLoadHistoryLevel()) {
          return;
        }

        let newLevel: LevelData | null = null;
        let isUnique = false;
        let attempts = 0;
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
        const palette = getCurrentPalette(progress);
        const { minC, maxC } = calculateColorCounts(stageConfig.w, stageConfig.h, palette.length);

        const scheduleNextAttempt = (callback: () => void) => {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(callback, { timeout: 50 });
          } else {
            setTimeout(callback, 0);
          }
        };

        const completeGeneration = (level: LevelData | null, wasUnique: boolean) => {
          if (level && wasUnique) {
            recordGeneratedHash(level);
          }
          finalizeLevelLoad(level, wasUnique);
        };

        const tryGenerate = () => {
          if (isUnique || attempts >= 20) {
            if (!isUnique && setGenerationWarning) {
              setGenerationWarning('Replaying random level.');
            }

            if (newLevel && !isUnique && setLevelValidationError) {
              const finalValidation = validateNumberlinkRules(newLevel);
              if (!finalValidation.isValid) {
                setLevelValidationError(finalValidation.error || 'Level validation failed');
                if (setGenerationWarning) {
                  setGenerationWarning('Generated level may have issues. Consider regenerating.');
                }
              }
            }

            completeGeneration(newLevel, isUnique);
            return;
          }

          const result = generateLevel(stageConfig.w, stageConfig.h, minC, maxC, palette);
          newLevel = result.level;

          const validation = validateNumberlinkRules(newLevel);
          if (!validation.isValid) {
            if (setLevelValidationError) {
              setLevelValidationError(validation.error || 'Level validation failed');
            }
            attempts++;
            scheduleNextAttempt(tryGenerate);
            return;
          }

          const hash = generateLevelHash(newLevel);
          if (!allExistingHashes.has(hash)) {
            isUnique = true;
            if (setLevelUsedFallback) {
              setLevelUsedFallback(result.usedFallback);
            }
            if (setLevelValidationError) {
              setLevelValidationError(null);
            }

            completeGeneration(newLevel, true);
          } else {
            attempts++;
            scheduleNextAttempt(tryGenerate);
          }
        };

        tryGenerate();
      } catch (err) {
        console.error(err);
        const fallbackPalette = getCurrentPalette({ themeId: 'WATER' } as any);
        const { minC, maxC } = calculateColorCounts(5, 5, fallbackPalette.length);
        const result = generateLevel(5, 5, minC, maxC, fallbackPalette);
        finalizeLevelLoad(result.level);
      }
    }, 50);
  };

  clientSideGeneration();
};
