import { handleTabNavigation, handleGameNavigation } from './keyboard-navigation';

/**
 * Sets up global keyboard controls for the game.
 * 
 * Registers a single keydown event listener that routes to:
 * 1. Tab navigation (handleTabNavigation) - for switching views
 * 2. Game navigation (handleGameNavigation) - for color selection and path movement
 * 
 * Priority: Tab navigation is checked first, but returns false in game modes
 * to allow color selection to take priority.
 * 
 * @returns Cleanup function to remove event listeners, or undefined if window is not available
 */
export const setupKeyboardControls = (): (() => void) | undefined => {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Try tab navigation first
    if (handleTabNavigation(e)) {
      return;
    }

    // Then try game navigation
    handleGameNavigation(e);
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

