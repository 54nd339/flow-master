/**
 * Reusable style constants for consistent styling across components
 */
export const GRID_STYLES = {
  container: 'relative w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden transition-all duration-300 z-10',
  cell: 'relative border border-white/5 flex items-center justify-center',
  anchor: 'rounded-full z-10 shadow-lg transition-transform duration-300 flex items-center justify-center text-black/50',
  pathOverlay: 'absolute inset-0 opacity-20',
} as const;

export const BUTTON_STYLES = {
  primary: 'bg-white text-black hover:bg-white/90 shadow-lg active:scale-95',
  secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  ghost: 'text-white/50 hover:text-white hover:bg-white/10',
} as const;

export const CARD_STYLES = {
  base: 'bg-black/40 backdrop-blur-sm rounded-2xl ring-1 ring-white/10 shadow-2xl',
  padding: 'p-6',
} as const;

