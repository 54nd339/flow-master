export const LEVELS_PER_AREA = 50;

export interface CampaignArea {
  id: number
  w: number
  h: number
  minColors: number
  maxColors: number
}

export interface CampaignGroup {
  id: number
  areas: CampaignArea[]
}

export const CAMPAIGN_AREAS: CampaignArea[] = [
  { id: 1, w: 5, h: 5, minColors: 4, maxColors: 5 },
  { id: 2, w: 6, h: 6, minColors: 4, maxColors: 6 },
  { id: 3, w: 7, h: 7, minColors: 5, maxColors: 7 },
  { id: 4, w: 8, h: 8, minColors: 5, maxColors: 8 },
  { id: 5, w: 9, h: 9, minColors: 6, maxColors: 9 },
  { id: 6, w: 8, h: 11, minColors: 6, maxColors: 9 },
  { id: 7, w: 10, h: 10, minColors: 7, maxColors: 10 },
  { id: 8, w: 9, h: 12, minColors: 7, maxColors: 10 },
  { id: 9, w: 11, h: 11, minColors: 8, maxColors: 11 },
  { id: 10, w: 10, h: 13, minColors: 8, maxColors: 11 },
  { id: 11, w: 12, h: 12, minColors: 9, maxColors: 12 },
  { id: 12, w: 11, h: 14, minColors: 9, maxColors: 12 },
  { id: 13, w: 13, h: 13, minColors: 10, maxColors: 13 },
  { id: 14, w: 12, h: 15, minColors: 10, maxColors: 13 },
  { id: 15, w: 14, h: 14, minColors: 11, maxColors: 14 },
  { id: 16, w: 13, h: 16, minColors: 11, maxColors: 14 },
  { id: 17, w: 15, h: 15, minColors: 12, maxColors: 15 },
  { id: 18, w: 14, h: 17, minColors: 12, maxColors: 15 },
  { id: 19, w: 15, h: 18, minColors: 12, maxColors: 15 },
  { id: 20, w: 16, h: 19, minColors: 13, maxColors: 16 },
  { id: 21, w: 20, h: 20, minColors: 17, maxColors: 20 },
  { id: 22, w: 25, h: 25, minColors: 22, maxColors: 25 },
  { id: 23, w: 30, h: 30, minColors: 27, maxColors: 30 },
  { id: 24, w: 35, h: 35, minColors: 32, maxColors: 35 },
  { id: 25, w: 40, h: 40, minColors: 37, maxColors: 40 },
];

export const CAMPAIGN_GROUPS: CampaignGroup[] = [
  { id: 1, areas: CAMPAIGN_AREAS.slice(0, 5) },
  { id: 2, areas: CAMPAIGN_AREAS.slice(5, 10) },
  { id: 3, areas: CAMPAIGN_AREAS.slice(10, 15) },
  { id: 4, areas: CAMPAIGN_AREAS.slice(15, 20) },
  { id: 5, areas: CAMPAIGN_AREAS.slice(20, 25) },
];

export function getArea(id: number): CampaignArea | undefined {
  return CAMPAIGN_AREAS.find((a) => a.id === id);
}


/**
 * Deterministic seed for a specific area + level combination.
 * Guarantees reproducible puzzles across sessions.
 */
export function areaSeed(areaId: number, levelIdx: number): number {
  return 0xCAFE_0000 + areaId * 7919 + levelIdx * 131;
}
