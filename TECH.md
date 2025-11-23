# Technical Documentation

This document contains detailed technical information about the Flow Master codebase architecture, design patterns, and implementation details.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (with persistence and migrations)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Audio**: Web Audio API (procedural synthesis)
- **Utilities**: clsx, dom-to-image-more

## 🏗️ Architecture

### State Management (Zustand)

The game uses Zustand with a modular slice pattern for better organization:

- **Modular Slices**: State split into logical slices (game-state, ui, creator, currency, achievement)
- **Main Store**: `game-store.ts` combines all slices into a single store
- **Persistence**: Progress automatically saved to localStorage with versioned migrations
- **Type-Safe**: Full TypeScript support across all slices with proper `StoreApi<GameState>` types
- **Optimized**: Only progress data persisted, not UI state
- **Selector Optimization**: 
  - Uses separate selectors instead of object selectors to prevent infinite loops
  - Each component subscribes only to the specific fields it needs
  - Avoids `shallow` comparison complexity by using primitive selectors
- **Global Level Tracking**: `generatedLevelHashes` array in progress tracks all generated levels across modes

#### Store Slices

- **`game-state-store.ts`**: Core game state (levelData, userPaths, moveCount, etc.)
- **`ui-store.ts`**: UI state (viewMode, modals, rankUp)
- **`creator-store.ts`**: Level creator state
- **`currency-store.ts`**: Flows, themes, daily streaks
- **`achievement-store.ts`**: Achievement checking and unlocking
- **`progress-store.ts`**: Default progress values

### Component Architecture

- **Separation of Concerns**: UI components separate from game logic
- **Reusability**: Shared UI components (Button, Card, Modal, Dropdown, Toast)
- **Composition**: Complex components built from smaller ones
- **Type Safety**: All components fully typed
- **Client Components**: Proper use of 'use client' directive
- **Performance**: `React.memo` for stable components, `useMemo`/`useCallback` for expensive operations

### Theming System

- **Theme Presets**: 5 distinct visual themes with unlockable progression
- **Tailwind Best Practices**: Uses Tailwind's gradient utilities
- **Dynamic Theming**: Theme changes affect entire UI
- **Accessibility**: Colorblind mode with unique symbols
- **Rank System**: Themes unlock ranks as players progress through stages

### Audio System

- **Procedural Synthesis**: Real-time sound generation using Web Audio API
- **Color-to-Note Mapping**: Each color corresponds to a musical note (C major scale)
- **Context-Aware**: Different sounds for different actions (pop, glissando)
- **User Control**: Separate controls for sound effects and background music
- **Background Music**: Zen-like ambient procedural generation with pentatonic scale

### Level Generation

- **Procedural Algorithm**: Generates unique, solvable levels
- **Difficulty Scaling**: Levels get more complex with stages
- **Global Uniqueness**: Hash-based tracking ensures no level appears twice across any game mode (Campaign, Zen, Time Attack, Daily)
- **Time-Based Generation**: Uses time limits (1s for small grids, 2s for large) instead of retry counts
- **Sophisticated Fallback**: Distributed DFS with snake patterns and Hamiltonian-like traversal for challenging fallback levels
- **Daily Challenges**: Deterministic generation based on date (same level for all players on same day)
- **Compression**: Level data compressed for URL sharing
- **Hash System**: `generateLevelHash()` creates unique identifiers based on grid size and anchor positions

## 🎯 Design Patterns

1. **Slice Pattern**: Zustand store split into logical slices for maintainability
2. **Custom Hooks Pattern**: Game logic extracted to reusable hooks
3. **Container/Presenter**: Logic separated from presentation
4. **Factory Pattern**: Level generation uses factory functions
5. **Observer Pattern**: Zustand store notifies components of state changes
6. **Strategy Pattern**: Different themes implement same interface
7. **Singleton Pattern**: Audio engine and haptic feedback as singletons
8. **Index File Pattern**: Centralized exports for cleaner imports

## 🚀 Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Consistent file naming (kebab-case for files, PascalCase for components)
- Clear separation between client and server components
- Comments only for complex/non-intuitive logic (industry standard)
- No `any` types (proper Zustand `StoreApi` types used)

### Keyboard Controls Implementation

The keyboard system uses priority-based handling:

1. **Tab Navigation** (`handleTabNavigation`): 
   - Only works in non-game modes or when no level is loaded
   - Keys 1-8 switch between views
   - Returns `false` in game modes with levelData (allows color selection)

2. **Color Selection** (`handleGameNavigation`):
   - Only works in game modes (PLAY, DAILY, TIME_ATTACK, ZEN)
   - Keys 1-9 select colors
   - Prevents selecting colors with already completed paths (both anchors connected)
   - Arrow keys/WASD for path movement
   - Prevents tracing paths that are already complete

**Path Completion Detection**: Checks if both anchors for a color are connected and different before allowing selection/movement. This prevents unnecessary path redrawing.

This ensures color selection always takes priority in game modes while maintaining game logic integrity.

### Adding New Features

1. **New Theme**: Add to `constants/index.tsx` following existing pattern, update `THEME_PRICES` in `config/game.ts`
2. **New Component**: Create in appropriate `components/` subdirectory, export from `components/game/index.ts`
3. **New State Slice**: Create in `stores/` and combine in `game-store.ts`
4. **New Utility**: Add to `lib/` or `utils/` with proper exports from index files
5. **New Game Mode**: Add view mode to `types/index.ts` and implement component in `view-mode-renderer.tsx`
6. **New Achievement**: Add to `config/achievements.ts` and implement check in `stores/achievement-store.ts`
7. **Level Generation**: Ensure new levels check against `progress.generatedLevelHashes` for uniqueness

### Performance Optimizations

- **React.memo**: Applied to stable components (ViewModeRenderer, BottomNav, GameHeader, etc.)
- **useMemo**: Used for expensive calculations (gridCells, palettes, level hashes, rank calculations)
- **useCallback**: Memoized event handlers to prevent child re-renders
- **Zustand Selectors**: 
  - Separate selectors instead of object selectors to prevent infinite loops
  - Only subscribe to specific fields needed by components
  - Prevents unnecessary re-renders from object reference changes
- **Custom Hooks**: Extracted complex logic to reduce component complexity
- **Index Files**: Centralized exports for better tree-shaking
- **Constant Extraction**: Moved constants outside components (MODE_MAP, NAV_ITEMS, STAR_ARRAY, GAME_MODES)
- **Memoized Arrays**: Replaced `Array.from()` with constant arrays where possible
- **Function Extraction**: Extracted reusable functions (getNeighbors) to module level

### Error Handling

- **Error Boundary**: Global error boundary component
- **Centralized Logging**: `lib/error-logger.ts` for error tracking
- **Graceful Degradation**: Fallbacks for audio, haptics, and sharing APIs

### Move Tracking & Scoring

- **Move Count**: Tracks moves per level, resets when level changes
- **Perfect Score Calculation**: 
  - Uses `calculateMinMoves()` based on solution path lengths
  - Detects backtracking by comparing move history
  - Detects line breaks by comparing user path to solution
  - Star rating based on efficiency (3 stars: perfect or ≤1.5x optimal, 2 stars: ≤2x, 1 star: ≤3x)
- **Display**: Moves shown in level completion modal with star rating
- **Time Tracking**: Tracks `levelStartTime` and `levelCompletionTime` for per-level and total time played

### Type Safety

- All Zustand stores use proper `StoreApi<GameState>` types
- No `any` types in store slices
- Proper type guards for ViewMode validation
- Full TypeScript coverage across codebase

