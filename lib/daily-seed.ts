function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function getDailySeed(date: Date = new Date()): number {
  const dateStr = date.toISOString().slice(0, 10);
  return djb2(dateStr);
}

export function getDailyDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

const DAY_GRID_SIZES = [7, 8, 9, 10, 11, 12, 7] as const;

export function getDailyGridSize(date: Date = new Date()): number {
  const day = date.getDay();
  return DAY_GRID_SIZES[day];
}

const FEATURED_SIZES = [5, 7, 9, 12, 15, 20, 25] as const;

export function getWeeklyFeaturedSize(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86400000,
  );
  const weekNumber = Math.floor(daysSinceStart / 7);
  return FEATURED_SIZES[weekNumber % FEATURED_SIZES.length];
}
