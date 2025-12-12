import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/stores/game-store';
import { calculateMinMoves, calculatePerfectScore, getTodayDateString, audioEngine, hapticFeedback } from '@/lib';
import { FLOW_REWARDS } from '@/config';

export const useLevelCompletion = () => {
  const {
    levelData,
    userPaths,
    isLevelComplete,
    setIsLevelComplete,
    progress,
    moveCount,
    moveHistory,
    setPerfectScore,
    levelStartTime,
    setLevelCompletionTime,
    setProgress,
  } = useGameStore();

  const userPathsArray = useMemo(() => Object.values(userPaths), [userPaths]);
  const anchorEntries = useMemo(() => Object.values(levelData?.anchors || {}), [levelData?.anchors]);
  const anchorKeys = useMemo(() => Object.keys(levelData?.anchors || {}), [levelData?.anchors]);

  useEffect(() => {
    if (!levelData || isLevelComplete) return;

    const cellsFilled = new Set<number>();
    userPathsArray.forEach((p) => p.forEach((c) => cellsFilled.add(c)));

    if (cellsFilled.size !== levelData.width * levelData.height) return;

    let allConnected = true;
    const colorAnchors: Record<number, Array<{ colorId: number; type: 'endpoint' }>> = {};
    anchorEntries.forEach((a) => {
      if (!colorAnchors[a.colorId]) colorAnchors[a.colorId] = [];
      colorAnchors[a.colorId].push(a);
    });

    for (const [cId, anchors] of Object.entries(colorAnchors)) {
      const path = userPaths[parseInt(cId)];
      if (!path) {
        allConnected = false;
        break;
      }
      const start = path[0];
      const end = path[path.length - 1];
      const anchorIndices = anchorKeys
        .filter((idx) => levelData.anchors[parseInt(idx)].colorId === parseInt(cId))
        .map(Number);
      // Path must start and end at different anchor positions for this color
      if (!anchorIndices.includes(start) || !anchorIndices.includes(end) || start === end) {
        allConnected = false;
        break;
      }
    }

    if (allConnected) {
      setIsLevelComplete(true);

      // Store moveCount before resetting (needed for perfect score calculation)
      const currentMoveCount = moveCount;

      // Calculate time taken for this level
      const completionTime = levelStartTime ? Math.floor((Date.now() - levelStartTime) / 1000) : 0;
      setLevelCompletionTime(completionTime);

      // Update total time played
      if (completionTime > 0) {
        setProgress({
          totalTimePlayed: (progress.totalTimePlayed || 0) + completionTime,
        });
      }

      // Play celebration audio and haptic
      const colorIds = Object.keys(userPaths).map(Number);
      if (progress.sound) {
        audioEngine.playGlissando(colorIds);
      }
      hapticFeedback.playLevelClear();

      // Calculate perfect score and award flows
      if (levelData) {
        const minMoves = calculateMinMoves(levelData);

        /**
         * Detects backtracking by comparing consecutive move history entries.
         * 
         * Backtracking occurs when a path becomes shorter than its previous state,
         * indicating the player removed cells from a path (undo behavior).
         * 
         * Algorithm: Compare each move with the previous one. If any color's path
         * is shorter in the current move, backtracking occurred.
         */
        const hasBacktracking = moveHistory.length > 0 && moveHistory.some((move, i) => {
          if (i === 0) return false;
          const prevMove = moveHistory[i - 1];
          for (const [cId, path] of Object.entries(move.paths)) {
            const prevPath = prevMove.paths[parseInt(cId)] || [];
            if (path.length < prevPath.length) return true;
          }
          return false;
        });

        /**
         * Detects line breaks by comparing user path to solution path.
         * 
         * A line break occurs when the user path doesn't exactly match the solution,
         * even if it connects the correct endpoints. This penalizes non-optimal paths.
         * 
         * Algorithm: For each solution path, check if the user path:
         * - Has the same length
         * - Has the same cells in the same order
         */
        const hasLineBreaks = levelData.solvedPaths?.some((solPath) => {
          const userPath = userPaths[solPath.colorId] || [];
          return userPath.length > 0 && (
            userPath.length !== solPath.path.length ||
            !userPath.every((cell, idx) => cell === solPath.path[idx])
          );
        }) || false;

        const score = calculatePerfectScore(currentMoveCount, minMoves, hasBacktracking, hasLineBreaks);
        setPerfectScore({
          moves: currentMoveCount,
          minMoves,
          stars: score.stars,
          perfect: score.perfect,
        });

        /**
         * Flow Reward System:
         * 
         * Base Rewards (per game mode):
         * - Campaign (PLAY): FLOW_REWARDS.LEVEL_COMPLETE
         * - Daily Challenge: FLOW_REWARDS.DAILY_CHALLENGE
         * - Time Attack: FLOW_REWARDS.TIME_ATTACK_PUZZLE
         * 
         * Bonus Rewards:
         * - Perfect Clear (3 stars, no backtracking, no line breaks): FLOW_REWARDS.PERFECT_CLEAR
         * - Daily Streak Bonus: FLOW_REWARDS.STREAK_BONUS × min(streak, 10)
         * 
         * All rewards are cumulative - a perfect clear in daily challenge with a streak
         * earns base + perfect + streak bonus.
         */
        const { addFlows, checkAchievements, updateDailyStreak } = useGameStore.getState();
        const currentViewMode = useGameStore.getState().viewMode;

        let flowsEarned = 0;

        if (currentViewMode === 'PLAY') {
          flowsEarned += FLOW_REWARDS.LEVEL_COMPLETE;
        } else if (currentViewMode === 'DAILY') {
          flowsEarned += FLOW_REWARDS.DAILY_CHALLENGE;
          updateDailyStreak();
        } else if (currentViewMode === 'TIME_ATTACK') {
          flowsEarned += FLOW_REWARDS.TIME_ATTACK_PUZZLE;
        }

        if (score.perfect && score.stars === 3) {
          flowsEarned += FLOW_REWARDS.PERFECT_CLEAR;
          setProgress({ perfectClears: progress.perfectClears + 1 });
        }

        if (currentViewMode === 'DAILY' && progress.dailyStreak > 0) {
          flowsEarned += FLOW_REWARDS.STREAK_BONUS * Math.min(progress.dailyStreak, 10);
        }

        if (flowsEarned > 0) {
          addFlows(flowsEarned);
        }

        const newTotalLevels = progress.totalLevelsCompleted + 1;
        const newCampaignLevels = currentViewMode === 'PLAY'
          ? (progress.campaignLevelsCompleted || 0) + 1
          : progress.campaignLevelsCompleted || 0;

        setProgress({
          totalLevelsCompleted: newTotalLevels,
          campaignLevelsCompleted: newCampaignLevels,
        });

        checkAchievements();

        if (currentViewMode === 'DAILY') {
          const today = getTodayDateString();
          setProgress({ dailySolved: today });
        }
      }
    }
  }, [userPathsArray, anchorEntries, anchorKeys, levelData, isLevelComplete, setIsLevelComplete, progress, moveCount, moveHistory, setPerfectScore, levelStartTime, setLevelCompletionTime, setProgress, userPaths]);
};
