import { LevelData } from '@/types';
import { generateBoardSnapshot, shareSnapshot, downloadSnapshot, shareLevelUrl, generateProfileSnapshot } from '@/lib';
import { GameProgress } from '@/types';
import { ACHIEVEMENTS } from '@/config';

interface ShareImageParams {
  levelData: LevelData;
  userPaths: Record<number, number[]>;
  palette: { hex: string }[];
  themeLabel: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  setIsGenerating: (value: boolean) => void;
}

/**
 * Handles sharing a board snapshot image
 */
export const handleShareImage = async (params: ShareImageParams) => {
  const { levelData, userPaths, palette, themeLabel, onSuccess, onError, setIsGenerating } = params;

  setIsGenerating(true);
  try {
    const snapshotUrl = await generateBoardSnapshot(levelData, userPaths, palette, themeLabel);
    const result = await shareSnapshot(snapshotUrl);
    if (result === 'shared') {
      onSuccess('Image shared successfully!');
    } else if (result === 'copied') {
      onSuccess('Image copied to clipboard!');
    } else {
      onSuccess('Image downloaded!');
    }
  } catch (error) {
    console.error('Error generating snapshot:', error);
    onError('Failed to share image');
  } finally {
    setIsGenerating(false);
  }
};

/**
 * Handles downloading a board snapshot image
 */
export const handleDownloadImage = async (params: ShareImageParams) => {
  const { levelData, userPaths, palette, themeLabel, onSuccess, onError, setIsGenerating } = params;

  setIsGenerating(true);
  try {
    const snapshotUrl = await generateBoardSnapshot(levelData, userPaths, palette, themeLabel);
    downloadSnapshot(snapshotUrl);
    onSuccess('Image downloaded!');
  } catch (error) {
    console.error('Error generating snapshot:', error);
    onError('Failed to download image');
  } finally {
    setIsGenerating(false);
  }
};

/**
 * Handles sharing a level URL
 */
export const handleShareUrl = async (
  levelData: LevelData,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) => {
  try {
    await shareLevelUrl(levelData);
    onSuccess('Level URL copied to clipboard!');
  } catch (error) {
    console.error('Error sharing URL:', error);
    onError('Failed to share URL');
  }
};

/**
 * Handles sharing profile stats
 */
export const handleShareStats = async (
  progress: GameProgress,
  unlockedAchievements: typeof ACHIEVEMENTS,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  setIsGenerating: (value: boolean) => void
) => {
  setIsGenerating(true);
  try {
    const snapshotUrl = await generateProfileSnapshot(progress, unlockedAchievements);
    const result = await shareSnapshot(snapshotUrl);
    if (result === 'shared') {
      onSuccess('Stats shared successfully!');
    } else if (result === 'copied') {
      onSuccess('Stats image copied to clipboard!');
    } else {
      onSuccess('Stats image downloaded!');
    }
  } catch (error) {
    console.error('Error generating stats snapshot:', error);
    onError('Failed to share stats');
  } finally {
    setIsGenerating(false);
  }
};
