import { LevelData } from '@/types';
import { compressLevel, decompressLevel } from './level-compression';

/**
 * Generates a shareable URL for a level
 * @param levelData - The level data to encode
 * @returns URL with encoded level parameter
 */
export const generateLevelUrl = (levelData: LevelData): string => {
  const compressed = compressLevel(levelData);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/?level=${encodeURIComponent(compressed)}`;
};

/**
 * Extracts level data from URL query parameter
 * @returns Decoded level data or null if invalid/not present
 */
export const extractLevelFromUrl = (): LevelData | null => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const levelParam = params.get('level');
  
  if (!levelParam) return null;
  
  try {
    return decompressLevel(decodeURIComponent(levelParam));
  } catch (error) {
    console.error('Failed to extract level from URL:', error);
    return null;
  }
};

/**
 * Shares level URL via Web Share API or clipboard
 * Falls back to clipboard copy if Web Share is unavailable
 * @param levelData - The level data to share
 * @throws Error if clipboard write fails
 */
export const shareLevelUrl = async (levelData: LevelData): Promise<void> => {
  const url = generateLevelUrl(levelData);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Flow Master Puzzle',
        text: 'Check out this Flow Master puzzle!',
        url,
      });
      return;
    } catch (error) {
    }
  }
  
  try {
    await navigator.clipboard.writeText(url);
  } catch (error) {
    console.error('Failed to copy URL:', error);
    throw new Error('Failed to copy URL to clipboard');
  }
};

