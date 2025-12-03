# Technical Documentation

This document contains detailed technical information about the Flow Master codebase architecture, design patterns, implementation details, and development guidelines.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5 (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5.0.8 (with persistence and migrations)
- **Animations**: Framer Motion 12
- **Icons**: Lucide React 0.554
- **Audio**: Web Audio API (procedural synthesis)
- **Build Tools**: ESLint 9 (Next.js config), PostCSS
- **Node Version**: 20+

## 🏗️ Architecture Overview

Flow Master uses a modern, modular architecture with clear separation of concerns:

### Application Structure

```
Client Layer (React 19 + Next.js 16)
  ↓
State Management (Zustand Slices)
  ↓
Business Logic (lib/ + utils/)
  ↓
API Layer (Next.js Server Actions)
  ↓
Server Layer (Background Generator + Pool)
```

### Key Design Decisions

1. **Hybrid Client-Server Generation**: Client generates instantly (zero lag), server builds cache in background
2. **Slice Pattern**: Zustand state split into logical domains for maintainability
3. **Primitive Selectors**: Avoid object selectors to prevent infinite re-render loops
4. **Server-Only Modules**: Background generator and pool use Node.js APIs, guarded against client imports
5. **Type Safety First**: No `any` types, full TypeScript coverage with proper generics

## 🏗️ State Management Architecture

Flow Master uses **Zustand 5** with a **modular slice pattern** for scalable state management.

### Slice Structure

Each slice is a separate module that returns a partial state object:

```typescript
// Example: game-state-store.ts
export interface GameStateSlice {
  levelData: LevelData | null;
  userPaths: Record<number, number[]>;
  // ... other state
  setLevelData: (data: LevelData | null) => void;
  setUserPaths: (paths: Record<number, number[]>) => void;
}

export const createGameStateSlice = (set: SetState, get: GetState): GameStateSlice => ({
  levelData: null,
  userPaths: {},
  setLevelData: (data) => set({ levelData: data }),
  setUserPaths: (paths) => set({ userPaths: paths }),
});
```

### Store Composition

The main store combines all slices:

```typescript
// game-store.ts
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...createGameStateSlice(set, get),
      ...createUIStateSlice(set),
      ...createCreatorStateSlice(set),
      ...createCurrencyStateSlice(set, get),
      ...createAchievementStateSlice(set, get),
      // Additional state specific to main store
      progress: defaultProgress,
      timeAttack: null,
    }),
    {
      name: 'flowMaster_v19',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ progress: state.progress }), // Only persist progress
    }
  )
);
```

### Store Slices

#### 1. **game-state-store.ts** - Core Game State
Manages the current game session state:
- `levelData`: Current level configuration (anchors, dimensions)
- `userPaths`: Player's drawn paths per color
- `activeColor`: Currently selected color for drawing
- `isLevelComplete`: Completion flag
- `moveHistory`: History for undo functionality
- `moveCount`: Total moves in current level
- `perfectScore`: Scoring metrics (stars, efficiency)
- `isGenerating`: Loading state for level generation
- `generationWarning`: Error messages from generation
- `levelUsedFallback`: Flag if fallback algorithm was used
- `levelValidationError`: Validation error messages

#### 2. **ui-store.ts** - UI State
Manages transient UI state (not persisted):
- `viewMode`: Current view ('PLAY', 'CREATE', 'DAILY', 'TIME_ATTACK', 'ZEN', 'PROFILE', 'ACHIEVEMENTS', 'SETTINGS')
- `showStageSelect`: Stage selection modal visibility
- `showThemeSelect`: Theme shop modal visibility
- `showLevelComplete`: Completion modal visibility
- `rankUp`: Rank-up modal data (`{ old: ThemeRank, new: ThemeRank }`)

#### 3. **creator-store.ts** - Level Creator State
Manages level creator mode:
- `creatorAnchors`: Anchor placement in creator
- `creatorGrid`: Grid dimensions
- `creatorColorCount`: Number of colors

#### 4. **currency-store.ts** - Economy State
Manages in-game currency and purchases:
- `addFlows(amount)`: Add currency
- `spendFlows(amount)`: Deduct currency (returns success boolean)
- `unlockTheme(themeId)`: Purchase theme unlock

#### 5. **achievement-store.ts** - Achievement Logic
Manages achievement checking and unlocking:
- `checkAchievements()`: Evaluates all achievements against current progress
- `unlockAchievement(id)`: Unlocks specific achievement and awards flows

#### 6. **progress-store.ts** - Default Values
Defines initial progress state structure.

### Selector Optimization Strategy

**❌ Avoid Object Selectors** (causes infinite loops):
```typescript
// DON'T DO THIS
const { levelData, userPaths } = useGameStore((state) => ({
  levelData: state.levelData,
  userPaths: state.userPaths,
}));
```

**✅ Use Primitive Selectors**:
```typescript
// DO THIS
const levelData = useGameStore((state) => state.levelData);
const userPaths = useGameStore((state) => state.userPaths);
```

**Why?** Object selectors create new object references on every render, triggering unnecessary re-renders. Primitive selectors use referential equality.

### Persistence Strategy

Only `progress` is persisted to localStorage:
- **Persisted**: progress (stage, level, history, stats, currencies)
- **Not Persisted**: levelData, userPaths, UI state, temporary flags

This ensures clean state on page reload while maintaining player progression.

### Migration System

Versioned storage key (`flowMaster_v19`) with migration logic:
```typescript
// On breaking changes, increment version and add migration
const saved = localStorage.getItem('flowMaster_v19_stable_restore');
if (saved) {
  const parsed = JSON.parse(saved);
  if (parsed.state?.progress) {
    setProgress(parsed.state.progress);
  }
}
```

## 🎨 Component Architecture

### Design Principles

1. **Separation of Concerns**: UI components separate from game logic
2. **Composition**: Complex components built from smaller, reusable pieces
3. **Type Safety**: All props fully typed with TypeScript interfaces
4. **Client Components**: Explicit `'use client'` directive for interactive components
5. **Performance**: Strategic use of `React.memo`, `useMemo`, `useCallback`

### Component Hierarchy

```
app/page.tsx (Main Game Component)
  ├── GameHeader (top bar with stats)
  ├── ViewModeRenderer (routes to appropriate view)
  │   ├── GameBoard + GameControls (PLAY mode)
  │   ├── DailyChallenge (DAILY mode)
  │   ├── TimeAttackMode (TIME_ATTACK mode)
  │   ├── ZenMode (ZEN mode)
  │   ├── CreatorMode (CREATE mode)
  │   ├── Profile (PROFILE mode)
  │   ├── Achievements (ACHIEVEMENTS mode)
  │   └── SettingsView (SETTINGS mode)
  └── BottomNav (mode navigation)
```

### UI Components (`components/ui/`)

Reusable, primitive UI components:

- **Button**: Styled button with variants (primary, secondary, danger)
- **Card**: Container with consistent styling
- **Modal**: Overlay dialog with backdrop
- **Toast**: Temporary notification system
- **Dropdown**: Menu component with keyboard navigation

### Game Components (`components/game/`)

#### Core Game Components

**GameBoard** (`game-board.tsx`):
- Renders grid cells and SVG path overlays
- Handles touch/mouse interactions for path drawing
- Manages path validation and anchor connections
- Displays loading overlay and warning banners
- Sub-components: `WarningBanner`, `LoadingOverlay`, `PathSVG`

**GameControls** (`game-controls.tsx`):
- Action buttons: Undo, Reset, Hint, Next Level
- Displays current move count and stage/level info
- Conditional rendering based on game state

**GameHeader** (`game-header.tsx`):
- Displays flows (currency), current rank
- Shows theme preview and stage progress
- Memoized for stable rendering

**BottomNav** (`bottom-nav.tsx`):
- Navigation between game modes
- Highlights active mode
- Responsive icon buttons

#### Mode-Specific Components

**DailyChallenge**: Daily challenge view with streak tracking
**TimeAttackMode**: Timer-based puzzle mode with configuration
**ZenMode**: Infinite random puzzle generator
**CreatorMode**: Level editor with anchor placement and validation
**Profile**: Player stats and time tracking
**Achievements**: Achievement list with unlock status
**SettingsView**: Theme shop, sound/music toggles, colorblind mode

#### Modal Components (`modals/`)

**LevelCompleteModal**: 
- Displays completion stats (moves, stars, time)
- Share buttons (URL, snapshot)
- Next level / Continue actions

**RankUpModal**: 
- Celebration for rank progression
- Shows old vs. new rank with animations

**StageSelectModal**: 
- Grid of all 25 stages
- Shows completion status per stage
- Locked/unlocked state based on progression

**ThemeSelectModal**: 
- Theme shop for purchasing unlocks
- Displays prices and purchase buttons
- Theme preview

### Performance Optimizations

**React.memo Usage**:
```typescript
export const ViewModeRenderer: React.FC = React.memo(() => {
  // Component only re-renders when viewMode changes
});
```

**useMemo for Expensive Calculations**:
```typescript
const gridCells = useMemo(() => {
  return Array.from({ length: size }, (_, i) => i);
}, [size]);

const currentPalette = useMemo(() => {
  return getCurrentPalette(progress);
}, [progress.themeId, progress.stage]);
```

**useCallback for Handlers**:
```typescript
const handleCellClick = useCallback((idx: number) => {
  if (!levelData) return;
  // ... logic
}, [levelData, activeColor, userPaths]);
```

**Constant Extraction**:
```typescript
// Outside component - computed once
const MODE_MAP = {
  PLAY: { icon: Grid3x3, label: 'Campaign' },
  DAILY: { icon: Calendar, label: 'Daily' },
  // ...
} as const;
```

### Error Handling

**ErrorBoundary** (`error-boundary.tsx`):
- Global error boundary wrapping entire app
- Catches React errors and displays fallback UI
- Logs errors to error-logger.ts
- Provides reset functionality

## 🎵 Audio System Architecture

Flow Master features a sophisticated procedural audio system using the **Web Audio API**.

### Audio Engine (`lib/audio-engine.ts`)

**Core Features**:
- Real-time sound synthesis (no audio files)
- Color-to-note mapping using C major scale
- Independent volume control via master gain node
- Graceful degradation if AudioContext unavailable

**Color-to-Note Mapping**:
```typescript
const COLOR_NOTES: Record<number, number> = {
  0: 261.63,  // C4
  1: 293.66,  // D4
  2: 329.63,  // E4
  3: 349.23,  // F4
  4: 392.00,  // G4
  5: 440.00,  // A4
  6: 493.88,  // B4
  7: 523.25,  // C5
  8: 587.33,  // D5
  9: 659.25,  // E5
};
```

**Sound Types**:

1. **Pop Sound** (`playPopSound`):
   - Triggered when connecting dots
   - Uses oscillator (sine wave) at color-specific frequency
   - Attack/release envelope (0.01s attack, 0.1s release)
   - Gain: 0.3

2. **Glissando** (`playGlissando`):
   - Triggered on level completion
   - Sweeps from lowest to highest color frequency
   - Duration: 0.5s
   - Creates satisfying "level cleared" sound

**Architecture**:
```typescript
class AudioEngine {
  private audioContext: AudioContext | null;
  private masterGain: GainNode | null;
  
  async ensureAudioContext() {
    // Resume context if suspended (browser autoplay policy)
  }
  
  playPopSound(colorId: number) {
    // Create oscillator → gain → masterGain → destination
  }
  
  playGlissando(colorIds: number[]) {
    // Sweep frequencies with exponentialRampToValueAtTime
  }
}
```

### Background Music (`lib/background-music.ts`)

**Features**:
- Zen-like ambient procedural music
- Uses pentatonic scale (C, D, E, G, A)
- Soft pad sounds with long decay
- Random note triggering for organic feel
- Independent start/stop control

**Implementation**:
```typescript
class BackgroundMusic {
  private context: AudioContext | null;
  private gainNode: GainNode | null;
  private isPlaying: boolean;
  
  start() {
    // Start note loop with random intervals
  }
  
  stop() {
    // Stop loop and disconnect nodes
  }
  
  playNote(frequency: number) {
    // Sine wave with slow attack/release
  }
}
```

### Haptic Feedback (`lib/haptic-feedback.ts`)

Provides device vibration for tactile feedback:

**Patterns**:
- **Dot Connection**: Short vibration (10ms)
- **Level Complete**: Success pattern (50ms, 50ms pause, 100ms)
- **Error**: Quick pulse (30ms)

**Implementation**:
```typescript
class HapticFeedback {
  vibrate(duration: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }
  
  dotConnection() { this.vibrate(10); }
  levelComplete() { this.vibrate([50, 50, 100]); }
  error() { this.vibrate(30); }
}
```

### User Controls

Audio and haptics are controlled via settings:
- `progress.sound`: Enable/disable sound effects (pop, glissando)
- `progress.music`: Enable/disable background music
- Haptics: Always enabled if device supports (no toggle)

### Level Generation

- **Procedural Algorithm**: Generates unique, solvable levels
- **Difficulty Scaling**: Levels get more complex with stages
- **Global Uniqueness**: Hash-based tracking ensures no level appears twice across any game mode (Campaign, Zen, Time Attack, Daily)
- **Time-Based Generation**: Uses time limits (1s for small grids, 2s for large) instead of retry counts
- **Sophisticated Fallback**: Distributed DFS with snake patterns and Hamiltonian-like traversal for challenging fallback levels
- **Daily Challenges**: Deterministic generation based on date (same level for all players on same day)
- **Compression**: Level data compressed for URL sharing
- **Hash System**: `generateLevelHash()` creates unique identifiers based on grid size and anchor positions

## 🔄 Game Logic & Mechanics

### Move Tracking & Scoring

**Move Count**:
- Increments on each path modification
- Resets when level changes
- Displayed in GameControls and completion modal

**Perfect Score Calculation** (`lib/perfect-score.ts`):

```typescript
interface PerfectScore {
  moves: number;      // User's total moves
  minMoves: number;   // Optimal solution moves
  stars: number;      // 0-3 stars
  perfect: boolean;   // No backtracking, no line breaks
}
```

**Star Rating Algorithm**:
- **3 stars**: Perfect play OR ≤1.5× optimal moves
- **2 stars**: ≤2× optimal moves
- **1 star**: ≤3× optimal moves
- **0 stars**: >3× optimal moves

**Backtracking Detection**:
- Compares move history to detect path retracing
- Flags `perfect: false` if backtracking detected

**Line Break Detection**:
- Compares user path to solution path
- Flags `perfect: false` if path doesn't match solution order

### Path Validation (`lib/game-logic.ts`)

**isValidMove**:
```typescript
isValidMove(
  idx: number,           // Target cell index
  colorId: number,       // Active color
  userPaths: Record<number, number[]>,
  levelData: LevelData
): boolean
```

Validates if a cell can be added to the current path:
1. Cell must be empty or an anchor of the same color
2. Cell must be adjacent to the last path cell (Manhattan distance = 1)
3. Path cannot cross itself (except at anchors)

**handlePathMovement**:
```typescript
handlePathMovement(
  idx: number,
  colorId: number,
  userPaths: Record<number, number[]>,
  levelData: LevelData
): Record<number, number[]>
```

Returns updated paths after user interaction:
- If clicking on existing path: Remove path segments after that point
- If clicking on adjacent empty cell: Extend path
- If clicking on matching anchor: Complete path

### Level Completion Detection (`hooks/use-level-completion.ts`)

Checks if puzzle is solved:
1. All cells must be filled
2. Each color must connect both anchors
3. No gaps or overlaps in paths

Triggers:
- Celebration animation
- Audio glissando
- Haptic feedback
- Score calculation
- Flow rewards
- Achievement checks
- Progress saving

### Hint System (`lib/hint-logic.ts`)

**Earning Hints**:
- Gain 1 hint per level completed (`LEVELS_FOR_HINT = 1`)
- Tracked via `progress.hints` and `progress.levelsSinceHint`

**Using Hints**:
- Reveals one step of the optimal solution path
- Deducts 1 hint from count
- Shows visual indicator on grid

### Time Tracking

**Per-Level Timing**:
```typescript
levelStartTime: number;      // Timestamp when level starts
levelCompletionTime: number; // Duration in seconds
```

**Total Time Played**:
- Accumulated across all sessions
- Stored in `progress.totalTimePlayed` (seconds)
- Displayed in Profile view

### Undo System

**Move History**:
```typescript
interface MoveHistory {
  paths: Record<number, number[]>;
  timestamp: number;
}
```

**Undo Behavior**:
- Stores snapshot of paths before each move
- Undo button restores previous state
- Decrements move count
- Limited to current level session (cleared on level change)

### Currency & Rewards (`config/game.ts`)

```typescript
export const FLOW_REWARDS = {
  LEVEL_COMPLETE: 10,      // Every level
  PERFECT_CLEAR: 50,       // 3-star completion
  DAILY_CHALLENGE: 25,     // Daily completion
  TIME_ATTACK_PUZZLE: 5,   // Per time attack puzzle
  STREAK_BONUS: 10,        // Daily streak maintenance
};
```

**Flow Economy**:
- Earned through gameplay
- Spent on theme unlocks (500-1500 flows)
- Achievement bonuses (varies per achievement)
- Displayed in header

## 🚀 Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Consistent file naming (kebab-case for files, PascalCase for components)
- Clear separation between client and server components
- Comments only for complex/non-intuitive logic (industry standard)
- No `any` types (proper Zustand `StoreApi` types used)


## 🎨 Theming System

Flow Master features 5 distinct visual themes with progressive unlocking.

### Theme Structure

Each theme (`constants/index.tsx`) contains:
```typescript
interface ThemePreset {
  id: string;              // 'WATER', 'ELECTRIC', etc.
  label: string;           // Display name
  ranks: ThemeRank[];      // 5 ranks with names, colors, icons
  palette: ColorPalette[]; // Color hex codes for puzzles
  bg: (idx: number) => ReactNode; // Background gradient function
}
```

### Available Themes

1. **Water** (default, free):
   - Ranks: Drop → Stream → River → Ocean → Tsunami
   - Colors: Blue gradient palette
   - Icon: Droplet

2. **Electric** (500 flows):
   - Ranks: Spark → Bolt → Storm → Voltage → Plasma
   - Colors: Yellow/purple electric palette
   - Icon: Zap

3. **Neural** (750 flows):
   - Ranks: Synapse → Neuron → Network → Brain → Cortex
   - Colors: Pink/purple neural palette
   - Icon: Brain

4. **Light** (1000 flows):
   - Ranks: Photon → Beam → Ray → Prism → Aurora
   - Colors: Rainbow gradient palette
   - Icon: Sun

5. **Zen** (1500 flows):
   - Ranks: Lotus → Bamboo → Stone → Garden → Temple
   - Colors: Green/earth tone palette
   - Icon: Sparkles

### Rank Progression

Ranks unlock as players complete stages:
- **5 ranks per theme**
- **5 stages per rank** (matches LEVELS_PER_STAGE)
- Rank-up modal displays on stage completion
- Current rank shown in header with themed icon

### Theme Shop Integration

Themes are purchased in the Settings view:
- Displays price in flows
- Shows locked/unlocked state
- Preview of theme colors
- Purchase button (if sufficient flows)

### Dynamic Styling

Themes affect:
- **Puzzle colors**: Dots and paths use theme palette
- **Background gradients**: Page backgrounds use theme.bg()
- **Rank badges**: Header displays current rank with theme icon
- **UI accents**: Subtle theme hints in modals and cards

## 🎯 Design Patterns

### 1. Slice Pattern (State Management)
Zustand store split into logical slices for maintainability. Each slice is a separate module returning partial state.

```typescript
// Slice definition
export const createGameStateSlice = (set, get) => ({
  state: initialState,
  actions: () => set({ ... }),
});

// Composition in main store
export const useGameStore = create()(
  persist((set, get) => ({
    ...createGameStateSlice(set, get),
    ...createUIStateSlice(set),
  }))
);
```

### 2. Custom Hooks Pattern
Game logic extracted to reusable hooks for better testability and composition.

**Examples**:
- `useGameInitialization`: Handles initial setup, URL parsing, localStorage restore
- `useLevelCompletion`: Detects completion, calculates scores, awards flows
- `useTimeAttackTimer`: Countdown timer logic for time attack mode
- `useZenAutoGeneration`: Auto-generates next puzzle in zen mode
- `useUniqueLeveGenerator`: Ensures level uniqueness across modes

### 3. Container/Presenter Pattern
Logic separated from presentation (though not strictly enforced).

**Example**: GameBoard handles game logic, GridCell handles rendering.

### 4. Factory Pattern
Level generation uses factory functions with different strategies.

```typescript
// Main factory
generateLevel(width, height, minC, maxC, palette, seed)

// Specialized factories
generateDailyChallenge() // Deterministic seed
generateUniqueLevelSync() // With uniqueness check
```

### 5. Observer Pattern
Zustand store notifies components of state changes via subscriptions.

```typescript
// Components automatically re-render on state changes
const levelData = useGameStore((state) => state.levelData);
```

### 6. Strategy Pattern
Different themes implement same interface with different visual strategies.

### 7. Singleton Pattern
Audio engine and haptic feedback instantiated once and exported.

```typescript
// lib/audio-engine.ts
const audioEngine = new AudioEngine();
export { audioEngine };
```

### 8. Index File Pattern
Centralized exports for cleaner imports and better tree-shaking.

```typescript
// hooks/index.ts
export * from './use-game-initialization';
export * from './use-level-completion';

// Usage
import { useGameInitialization, useLevelCompletion } from '@/hooks';
```

### 9. Composition Pattern
Complex components built from smaller, reusable pieces.

```typescript
<GameBoard>
  <WarningBanner />
  <LoadingOverlay />
  <PathSVG />
  <GridCell />
</GameBoard>
```

### 10. Module Pattern
Server-only modules with runtime guards.

```typescript
// lib/server/level-pool.ts
if (typeof window !== 'undefined') {
  throw new Error('level-pool is server-only');
}
```

---

## 🏗️ Level Generation Architecture

### Overview

Flow Master uses a **Hybrid Lazy + Background Pool Architecture** for level generation that ensures zero lag while maintaining a cache of pre-generated levels.

### Design Principles

1. **✅ Zero Lag**: Client always generates levels immediately on-demand
2. **✅ Background Optimization**: Server continuously builds a pool in the background
3. **✅ Non-Blocking**: Background generation never blocks requests or startup
4. **✅ Continuous Replenishment**: Pool is refilled as levels are consumed
5. **✅ Efficient Resource Usage**: Small target pool size (10 levels per grid size)

### Request Flow

```
USER REQUEST FOR LEVEL
        ↓
API checks pool first (/api/generate-level)
        ↓
   Pool Empty?
    ↙     ↘
  YES     NO
   ↓       ↓
   │   Return pool level (deduped)
   │           ↓
   │      [LEVEL SERVED]
   ↓
API returns clientShouldGenerate: true
   ↓
Client generates immediately (Zero lag)
   ↓
[LEVEL SERVED]
```

### Background Generation Loop

The background generator runs continuously in a non-blocking loop:

1. **Round-Robin Processing**: Cycles through all grid sizes (5x5, 6x6, ..., 12x12)
2. **Batch-Based**: Generates 5 levels at a time per grid size
3. **Self-Regulating**: Only generates when pool is below target (10 levels)
4. **Non-Blocking**: Uses `setTimeout` and `setImmediate` for async breaks
5. **Error-Resilient**: Continues even if individual generation fails

**Configuration** (`config/game.ts`):
```typescript
export const BACKGROUND_GENERATION = {
  TARGET_POOL_SIZE: 10,        // Target: 10 levels per grid size
  LEVELS_PER_BATCH: 5,         // Generate 5 levels at a time
  MAX_ATTEMPTS_PER_LEVEL: 2000,
  BATCH_DELAY_MS: 100,         // Delay between batches
  CYCLE_DELAY_MS: 5000,        // Delay when all pools full
};
```

### Key Files

#### `/lib/server/background-generator.ts` - Background Worker
**Purpose**: Continuous background level generation

**Key Functions:**
- `startBackgroundGeneration()`: Main infinite loop
- `startBackgroundGenerationAsync()`: Non-blocking starter (called on server startup)
- `stopBackgroundGeneration()`: Graceful shutdown
- `generateLevelsForGridSize()`: Batch generator

**Algorithm:**
1. Loop forever while `__backgroundGeneratorRunning` is true
2. For each grid size in round-robin:
   - Check current pool count
   - If pool < TARGET_POOL_SIZE, generate one batch (5 levels)
   - Wait 100ms between grid sizes
3. If all pools full, wait 5 seconds before next cycle

#### `/lib/server/level-pool.ts` - Storage Layer
**Purpose**: File-based pool management

**Storage Location**: `/data/levels/{width}x{height}.json`

**Key Functions:**
- `getRandomLevelFromPool()`: Returns random level from pool
- `addLevelToPool()`: Adds generated level to pool
- `getPoolCount()`: Returns current count for grid size
- `getAllPoolHashes()`: Returns all existing level hashes (for deduplication)

#### `/app/api/generate-level/route.ts` - API Endpoint
**Purpose**: Serves level requests

**Strategy:**
1. **Try pool first** (for campaign mode)
2. **Check uniqueness** against client history
3. **Fallback to client generation** if pool empty or duplicate found

**Response Types:**
```typescript
// Pool hit (unique level found)
{ success: true, level: {...}, hash: "...", fromPool: true }

// Pool miss (tell client to generate)
{ success: false, error: "Pool empty", clientShouldGenerate: true }
```

#### `/lib/level-generator.ts` - Core Algorithm
**Purpose**: Stable path-based level generation algorithm

**Status**: ⚠️ **DO NOT MODIFY** - This algorithm is proven stable up to 12×12

**Algorithm Overview:**
1. Initialize grid with predefined anchor patterns
2. Use recursive path filling with dead-end prevention
3. Validate solution ensures level is solvable
4. Fallback generation for failure cases

### Performance Characteristics

#### Target Pool Size
- **10 levels per grid size** (2 rounds × 5 levels)
- Reasonable cache without over-generating
- Total: ~70 levels across all grid sizes (5x5 to 12x12)

#### Generation Rate
- **5 levels per batch** per grid size
- **100ms delay** between batches
- **5 second wait** when all pools full
- Efficient use of server resources

#### Client Experience
- **Zero lag**: Client always generates immediately
- **Occasional pool hit**: Faster than client generation
- **Seamless fallback**: No visible difference to user

### Benefits Over Previous Architecture

| Aspect | ❌ Old Architecture | ✅ New Architecture |
|--------|-------------------|-------------------|
| **Server Startup** | Blocks while generating 100 levels | Starts immediately, generates in background |
| **Initial Request** | May wait for pool to complete | Always instant (client generates) |
| **Pool Size** | 100 levels per grid (excessive) | 10 levels per grid (efficient) |
| **Generation Pattern** | All upfront (blocking) | Continuous round-robin (non-blocking) |
| **Resource Usage** | High (100 levels × 8 grid sizes) | Low (10 levels × 8 grid sizes) |
| **Responsiveness** | Occasional lag | Always responsive |
| **Error Resilience** | Fails entire batch | Continues with next grid size |

### Configuration Tuning

**Increase Pool Size:**
```typescript
export const BACKGROUND_GENERATION = {
  TARGET_POOL_SIZE: 20, // Increase to 20 levels per grid
  // ...
};
```

**Adjust Generation Speed:**
```typescript
export const BACKGROUND_GENERATION = {
  BATCH_DELAY_MS: 50,   // Faster generation (more CPU)
  CYCLE_DELAY_MS: 10000, // Slower cycle when idle (less CPU)
  // ...
};
```

**Increase Batch Size:**
```typescript
export const BACKGROUND_GENERATION = {
  LEVELS_PER_BATCH: 10, // Generate 10 at a time (more blocking)
  // ...
};
```

### Monitoring Background Generation

Watch server logs for:
```
[Background Generator] Starting continuous background generation...
[Background Generator] 5x5: 3/10 levels, generating 5...
[Background Generator] 5x5: Generated 5 levels, pool now has 8
[Background Generator] All pools at target size, waiting...
```

### Error Handling

**Background Generator Errors:**
- **Consecutive Failures**: Stops batch after 3 consecutive failures
- **Loop Errors**: Waits 5 seconds and retries
- **Fatal Errors**: Logs and stops gracefully

**Pool Errors:**
- **File System Errors**: Logged, API falls back to client generation
- **Parse Errors**: Skips invalid levels, continues

**API Errors:**
- **Pool Miss**: Returns `clientShouldGenerate: true`
- **Generation Failure**: Client handles with retry logic

