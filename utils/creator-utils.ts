import { compressLevel } from '@/lib';

interface CreatorAnchors {
  [key: number]: { colorId: number; type: 'endpoint' };
}

/**
 * Validates creator anchors and exports level code for sharing.
 * 
 * Validation Rules:
 * - Must have at least 2 different colors
 * - Each color must have exactly 2 anchors (start and end points)
 * 
 * If validation passes, compresses the level data into a URL-friendly string format.
 * 
 * @param creatorW - Grid width
 * @param creatorH - Grid height
 * @param creatorAnchors - Object mapping cell indices to anchor data
 * @returns Object with success flag, level string (if valid), or error message
 */
export const validateAndExportCreator = (
  creatorW: number,
  creatorH: number,
  creatorAnchors: CreatorAnchors
): { success: boolean; levelString?: string; error?: string } => {
  const colorCounts: Record<number, number> = {};
  Object.values(creatorAnchors).forEach((a) => {
    colorCounts[a.colorId] = (colorCounts[a.colorId] || 0) + 1;
  });

  if (Object.keys(colorCounts).length < 2) {
    return { success: false, error: 'Use 2+ colors.' };
  }

  for (const [cId, count] of Object.entries(colorCounts)) {
    if (count !== 2) {
      return { success: false, error: `Color ${cId} needs 2 anchors.` };
    }
  }

  const levelString = compressLevel({
    width: creatorW,
    height: creatorH,
    anchors: creatorAnchors,
    solvedPaths: [],
    difficulty: Object.keys(creatorAnchors).length / 2,
  });

  return { success: true, levelString };
};

