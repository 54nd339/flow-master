/**
 * Server-safe palette data (without React components).
 * Extracted to avoid duplication across files.
 */

export const SERVER_PALETTES: Record<string, Array<{ id: number; hex: string }>> = {
  WATER: [
    { id: 0, hex: '#0ea5e9' }, { id: 1, hex: '#3b82f6' }, { id: 2, hex: '#1d4ed8' },
    { id: 3, hex: '#06b6d4' }, { id: 4, hex: '#6366f1' }, { id: 5, hex: '#8b5cf6' },
    { id: 6, hex: '#a855f7' }, { id: 7, hex: '#2563eb' }, { id: 8, hex: '#0284c7' },
    { id: 9, hex: '#7dd3fc' }, { id: 10, hex: '#818cf8' }, { id: 11, hex: '#1e40af' },
    { id: 12, hex: '#60a5fa' }, { id: 13, hex: '#a78bfa' }, { id: 14, hex: '#22d3ee' },
    { id: 15, hex: '#0c4a6e' }, { id: 16, hex: '#1e3a8a' }, { id: 17, hex: '#3730a3' },
    { id: 18, hex: '#4c1d95' }, { id: 19, hex: '#581c87' },
  ],
  ELECTRIC: [
    { id: 0, hex: '#fbbf24' }, { id: 1, hex: '#f59e0b' }, { id: 2, hex: '#d97706' },
    { id: 3, hex: '#f97316' }, { id: 4, hex: '#ea580c' }, { id: 5, hex: '#dc2626' },
    { id: 6, hex: '#ef4444' }, { id: 7, hex: '#f87171' }, { id: 8, hex: '#fbbf24' },
    { id: 9, hex: '#fcd34d' }, { id: 10, hex: '#fde047' }, { id: 11, hex: '#facc15' },
    { id: 12, hex: '#eab308' }, { id: 13, hex: '#ca8a04' }, { id: 14, hex: '#a16207' },
    { id: 15, hex: '#854d0e' }, { id: 16, hex: '#713f12' }, { id: 17, hex: '#422006' },
    { id: 18, hex: '#7c2d12' }, { id: 19, hex: '#991b1b' },
  ],
  NATURE: [
    { id: 0, hex: '#22c55e' }, { id: 1, hex: '#16a34a' }, { id: 2, hex: '#15803d' },
    { id: 3, hex: '#10b981' }, { id: 4, hex: '#059669' }, { id: 5, hex: '#047857' },
    { id: 6, hex: '#34d399' }, { id: 7, hex: '#6ee7b7' }, { id: 8, hex: '#a7f3d0' },
    { id: 9, hex: '#d1fae5' }, { id: 10, hex: '#86efac' }, { id: 11, hex: '#4ade80' },
    { id: 12, hex: '#22c55e' }, { id: 13, hex: '#16a34a' }, { id: 14, hex: '#15803d' },
    { id: 15, hex: '#166534' }, { id: 16, hex: '#14532d' }, { id: 17, hex: '#064e3b' },
    { id: 18, hex: '#065f46' }, { id: 19, hex: '#047857' },
  ],
};

/**
 * Gets server-safe palette for a theme
 */
export function getServerPalette(themeId: string = 'WATER'): Array<{ id: number; hex: string }> {
  return SERVER_PALETTES[themeId] || SERVER_PALETTES.WATER;
}

