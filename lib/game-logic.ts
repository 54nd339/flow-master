import { GameProgress, LevelData } from '@/types';
import { STAGES, LEVELS_PER_STAGE } from '@/config';
import { generateLevel } from './level-generator';
import { decompressLevel, generateLevelHash, isLevelHashGenerated, addLevelHash } from './level-compression';
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
  
  // Check for pre-generated level first
  if (shiftPreGeneratedLevel) {
    const preGenerated = shiftPreGeneratedLevel();
    if (preGenerated && preGenerated.width === stageConfig.w && preGenerated.height === stageConfig.h) {
      setLevelData(preGenerated);
      setIsGenerating(false);
      
      // Pre-generate only 1 level in background, with delay to avoid blocking UI
      if (addPreGeneratedLevel && setProgress) {
        // Wait 2 seconds before starting pre-generation to let UI settle
        setTimeout(() => {
          const nextLevelIndex = levelIndexToPlay + 1;
          const nextStageId = nextLevelIndex >= LEVELS_PER_STAGE ? stageId + 1 : stageId;
          const nextLevelIdx = nextLevelIndex >= LEVELS_PER_STAGE ? 0 : nextLevelIndex;
          
          if (nextStageId <= STAGES.length) {
            // Pre-generate only next level (reduced from 2 to 1)
            preGenerateCampaignLevel(nextStageId, nextLevelIdx, progress, (level) => {
              if (level && addPreGeneratedLevel) {
                addPreGeneratedLevel(level);
              }
            });
          }
        }, 2000);
      }
      return;
    }
  }

  // Try server-side generation first, fallback to client-side
  const tryServerGeneration = async () => {
    try {
      // Try to load existing level from history first (for replay consistency)
      if (historyList[levelIndexToPlay]) {
        const loadedLevel = decompressLevel(historyList[levelIndexToPlay]);
        if (loadedLevel && loadedLevel.width === stageConfig.w && loadedLevel.height === stageConfig.h) {
          setLevelData(loadedLevel);
          setIsGenerating(false);
          return;
        }
      }

      // Try server-side generation
      const response = await fetch('/api/generate-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId,
          levelIndex: levelIndexToPlay,
          progress,
          generatedLevelHashes: progress.generatedLevelHashes || [],
          history: progress.history || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.level) {
          // Add hash to progress
          if (setProgress && data.hash) {
            const updatedHashes = addLevelHash(data.hash, progress.generatedLevelHashes || []);
            setProgress({ generatedLevelHashes: updatedHashes });
          }
          
          if (setLevelValidationError) {
            setLevelValidationError(null);
          }
          
          setLevelData(data.level);
          
          // Pre-generate only 1 level in background, with delay to avoid blocking UI
          if (addPreGeneratedLevel && setProgress) {
            setTimeout(() => {
              const nextLevelIndex = levelIndexToPlay + 1;
              const nextStageId = nextLevelIndex >= LEVELS_PER_STAGE ? stageId + 1 : stageId;
              const nextLevelIdx = nextLevelIndex >= LEVELS_PER_STAGE ? 0 : nextLevelIndex;
              
              if (nextStageId <= STAGES.length) {
                preGenerateCampaignLevel(nextStageId, nextLevelIdx, progress, (level) => {
                  if (level && addPreGeneratedLevel) {
                    addPreGeneratedLevel(level);
                  }
                });
              }
            }, 2000);
          }
          
          setIsGenerating(false);
          return;
        } else if (data.clientShouldGenerate) {
          // Pool is empty or error - client should generate
          clientSideGeneration();
          return;
        }
      }
    } catch (error) {
      console.warn('Server generation failed, falling back to client-side:', error);
    }

    // Fallback to client-side generation
    clientSideGeneration();
  };

  // Client-side generation (original implementation with async chunks)
  const clientSideGeneration = () => {
    setTimeout(() => {
    try {
      // Try to load existing level from history (for replay consistency)
      if (historyList[levelIndexToPlay]) {
        const loadedLevel = decompressLevel(historyList[levelIndexToPlay]);
        if (loadedLevel && loadedLevel.width === stageConfig.w && loadedLevel.height === stageConfig.h) {
          setLevelData(loadedLevel);
          setIsGenerating(false);
          return;
        }
      }

      // Generate new unique level: avoid duplicates by comparing anchor positions
      // Check against both stage history and global generated levels across all game modes
      let newLevel: LevelData | null = null;
      let isUnique = false;
      let attempts = 0;
      const stageHashes = new Set(
        historyList.map((str) => {
          const lvl = decompressLevel(str);
          return lvl ? generateLevelHash(lvl) : null;
        }).filter((h): h is string => h !== null)
      );
      const globalHashes = new Set(progress.generatedLevelHashes || []);
      const allExistingHashes = new Set([...stageHashes, ...globalHashes]);
      const pal = getCurrentPalette(progress);
      
      // Calculate dynamic color counts based on grid size
      const { minC, maxC } = calculateColorCounts(stageConfig.w, stageConfig.h, pal.length);

      // Use requestIdleCallback with setTimeout fallback to yield control between attempts
      const scheduleNextAttempt = (callback: () => void) => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(callback, { timeout: 50 });
        } else {
          setTimeout(callback, 0);
        }
      };

      const tryGenerate = () => {
        if (isUnique || attempts >= 20) {
          if (!isUnique && setGenerationWarning) {
            setGenerationWarning('Replaying random level.');
          }
          
          // If level was found but validation failed, show warning
          if (newLevel && !isUnique && setLevelValidationError) {
            const finalValidation = validateNumberlinkRules(newLevel);
            if (!finalValidation.isValid) {
              setLevelValidationError(finalValidation.error || 'Level validation failed');
              if (setGenerationWarning) {
                setGenerationWarning('Generated level may have issues. Consider regenerating.');
              }
            }
          }
          
          setLevelData(newLevel);
          
          // Pre-generate only 1 level in background, with delay to avoid blocking UI
          if (addPreGeneratedLevel && setProgress) {
            // Wait 2 seconds before starting pre-generation to let UI settle
            setTimeout(() => {
              const nextLevelIndex = levelIndexToPlay + 1;
              const nextStageId = nextLevelIndex >= LEVELS_PER_STAGE ? stageId + 1 : stageId;
              const nextLevelIdx = nextLevelIndex >= LEVELS_PER_STAGE ? 0 : nextLevelIndex;
              
              if (nextStageId <= STAGES.length) {
                // Pre-generate only next level (reduced from 2 to 1)
                preGenerateCampaignLevel(nextStageId, nextLevelIdx, progress, (level) => {
                  if (level && addPreGeneratedLevel) {
                    addPreGeneratedLevel(level);
                  }
                });
              }
            }, 2000);
          }
          
          setIsGenerating(false);
          return;
        }

        // Generate one attempt
        const result = generateLevel(stageConfig.w, stageConfig.h, minC, maxC, pal);
        newLevel = result.level;
        
        // Validate the level against Numberlink rules
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
          if (setProgress) {
            const updatedHashes = addLevelHash(hash, progress.generatedLevelHashes || []);
            setProgress({ generatedLevelHashes: updatedHashes });
          }
          
          if (setLevelUsedFallback) {
            setLevelUsedFallback(result.usedFallback);
          }
          if (setLevelValidationError) {
            setLevelValidationError(null);
          }
          
          setLevelData(newLevel);
          
          // Pre-generate only 1 level in background, with delay to avoid blocking UI
          if (addPreGeneratedLevel && setProgress) {
            // Wait 2 seconds before starting pre-generation to let UI settle
            setTimeout(() => {
              const nextLevelIndex = levelIndexToPlay + 1;
              const nextStageId = nextLevelIndex >= LEVELS_PER_STAGE ? stageId + 1 : stageId;
              const nextLevelIdx = nextLevelIndex >= LEVELS_PER_STAGE ? 0 : nextLevelIndex;
              
              if (nextStageId <= STAGES.length) {
                // Pre-generate only next level (reduced from 2 to 1)
                preGenerateCampaignLevel(nextStageId, nextLevelIdx, progress, (level) => {
                  if (level && addPreGeneratedLevel) {
                    addPreGeneratedLevel(level);
                  }
                });
              }
            }, 2000);
          }
          
          setIsGenerating(false);
        } else {
          attempts++;
          scheduleNextAttempt(tryGenerate);
        }
      };

      // Start the async generation loop
      tryGenerate();
    } catch (err) {
      console.error(err);
      const fallbackPalette = getCurrentPalette({ themeId: 'WATER' } as any);
      const { minC, maxC } = calculateColorCounts(5, 5, fallbackPalette.length);
      const result = generateLevel(5, 5, minC, maxC, fallbackPalette);
      setLevelData(result.level);
      setIsGenerating(false);
    }
    }, 50);
  };

  // Start with server-side generation
  tryServerGeneration();
};

