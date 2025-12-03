# Flow Master

A modern, beautifully designed Flow puzzle game built with Next.js 16, React 19, TypeScript, and Tailwind CSS. Features hybrid client-server level generation, procedural audio synthesis, and extensive progression systems.

## 🎮 Features

### Core Gameplay
- **Hybrid Level Generation**: 
  - Client-side: Instant zero-lag generation for all modes
  - Server-side: Background pool system with continuous replenishment
  - Global uniqueness tracking across all game modes via hash-based deduplication
- **Multiple Game Modes**: 
  - Campaign (25 stages with progressive difficulty)
  - Daily Challenge (deterministic seed-based levels)
  - Time Attack (configurable grid sizes: 5-9, time limits: 30s-4min)
  - Zen Mode (infinite random puzzles, grid sizes 5-12)
  - Level Creator (build and share custom puzzles)
- **Sophisticated Difficulty Scaling**: 25 stages from 5×5 to 40×40 grids
- **Perfect Score System**: 
  - Real-time move tracking vs. optimal solution
  - Star ratings (1-3 stars based on efficiency)
  - Detects backtracking and line breaks
  - Visual feedback in completion modal
- **Smart Undo System**: Step back through move history without full reset
- **Time-Based Generation**: Uses time limits (1-2s) instead of retry counts for reliability

### Visual & Audio
- **5 Distinct Themes**: Water (default), Electric, Neural, Light, and Zen (unlockable with flows)
- **Procedural Audio System** (Web Audio API):
  - Color-to-note mapping (C major scale, C4-E5)
  - "Pop" sounds when connecting dots
  - Glissando (pitch slides) on level completion
  - Separate volume controls for SFX and background music
  - Zen-like ambient music using pentatonic scale
- **Visual Celebrations**: Particle effects using puzzle colors on completion
- **Haptic Feedback**: Device vibration patterns for actions (mobile support)
- **Accessibility**: Colorblind mode with unique symbols on dots

### Progression & Rewards
- **Flow Currency System**: 
  - Earn flows: Level completion (10), perfect clear (50), daily challenge (25), time attack (5/puzzle), streak bonus (10)
  - Spend flows: Unlock themes (500-1500 flows each)
- **Theme Shop**: Integrated in Settings view with purchase system
- **Achievement System**: 
  - Dedicated achievements view with progress tracking
  - Earn bonus flows for milestone achievements
  - Track completion percentage
- **Daily Streaks**: Maintain consecutive daily challenge streaks for multiplier bonuses
- **Rank Progression**: Unlock ranks within each theme as you advance through stages
- **Comprehensive Stats**: 
  - Total time played (tracked per-level and cumulative)
  - Time Attack high scores per grid-size/time-limit combo
  - Perfect clears, campaign completion, puzzle counts

### Sharing & Social
- **URL Sharing**: Compressed level data in shareable URLs
- **Snapshot Generator**: Create 800×800px PNG images of solved boards with branding
- **Level Import**: Paste shareable URLs to play custom levels
- **Level Creator**: Full-featured editor with validation and compression

### Technical Features
- **Persistent Progress**: LocalStorage with versioned migrations and data validation
- **Hint System**: Earn 1 hint per level completed, use hints for guidance
- **Performance Optimized**: 
  - React.memo for stable components
  - Zustand primitive selectors (no shallow comparison needed)
  - Memoized expensive calculations (palette, grid cells, hashes)
  - Efficient path rendering with SVG
- **Error Handling**: Global error boundary with graceful degradation
- **Server-Side Pool**: Non-blocking background generation with round-robin processing

## 🏗️ Project Structure

```
flow-master/
├── app/                      # Next.js App Router
│   ├── api/                 # Server-side API routes
│   │   └── generate-level/  # Level generation endpoint with pool management
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main game component with view routing
├── components/               # React components
│   ├── ui/                  # Reusable UI primitives (Button, Card, Modal, Toast, Dropdown)
│   └── game/                # Game-specific components
│       ├── modals/          # Modal dialogs (level complete, rank up, stage select)
│       ├── game-board.tsx   # Core board rendering with SVG paths
│       ├── game-controls.tsx # Action buttons (undo, reset, hint)
│       ├── game-header.tsx  # Top bar with stats
│       ├── bottom-nav.tsx   # Mode navigation
│       └── [mode views]     # View components per game mode
├── stores/                   # Zustand state management (slice pattern)
│   ├── game-store.ts        # Main store combining all slices
│   ├── game-state-store.ts  # Core game state (levelData, paths, moves)
│   ├── ui-store.ts          # UI state (viewMode, modals, warnings)
│   ├── creator-store.ts     # Level creator state
│   ├── currency-store.ts    # Flows, themes, streaks
│   ├── achievement-store.ts # Achievement checking logic
│   └── progress-store.ts    # Default progress values
├── lib/                      # Core utility functions and logic
│   ├── server/              # Server-only modules (background generator, level pool)
│   ├── level-generator.ts   # ⚠️ Stable path-based generation algorithm (DO NOT MODIFY)
│   ├── level-validator.ts   # Solution validation
│   ├── level-compression.ts # Level encoding/decoding for URLs
│   ├── audio-engine.ts      # Web Audio API procedural synthesis
│   ├── background-music.ts  # Ambient music generator
│   ├── daily-challenge.ts   # Deterministic daily level generation
│   ├── game-logic.ts        # Path validation and movement
│   ├── hint-logic.ts        # Hint generation algorithm
│   └── [other libs]         # Haptics, error logging, PRNG, etc.
├── hooks/                    # Custom React hooks
│   ├── use-game-initialization.ts
│   ├── use-level-completion.ts
│   ├── use-game-progress.ts
│   ├── use-time-attack-timer.ts
│   ├── use-zen-auto-generation.ts
│   └── use-unique-level-generator.ts
├── utils/                    # Extracted utility functions
│   ├── grid-utils.ts        # Grid calculations and neighbors
│   ├── path-utils.ts        # Path manipulation
│   ├── level-generation-utils.ts # Generation helpers
│   ├── color-calculation.ts # Palette and color logic
│   ├── theme-utils.ts       # Theme helpers
│   └── [other utils]        # Various domain-specific utilities
├── config/                   # Configuration files
│   ├── game.ts              # Game constants (stages, rewards, generation config)
│   ├── achievements.ts      # Achievement definitions
│   └── ui.ts                # UI constants
├── types/                    # TypeScript definitions
│   └── index.ts             # All type definitions
├── constants/                # Theme presets and constants
│   └── index.tsx            # Theme definitions with ranks and palettes
├── data/                     # Server-side data storage
│   └── levels/              # Pre-generated level pools (JSON files per grid size)
└── public/                   # Static assets
```

See [TECH.md](./TECH.md) for detailed technical documentation.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with server actions)
- **UI Library**: React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5 (with persistence middleware and slice pattern)
- **Animations**: Framer Motion 12
- **Icons**: Lucide React
- **Audio**: Web Audio API (procedural synthesis)

## 📦 Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to play the game.

## 🏗️ Architecture Highlights

### Hybrid Level Generation
- **Client-First**: Always generates immediately for zero lag
- **Server Pool**: Background generator continuously builds cache (10 levels per grid size)
- **API Endpoint**: `/api/generate-level` serves pool levels with uniqueness checks
- **Non-Blocking**: Server generation uses round-robin with delays to prevent blocking
- **Fallback System**: Sophisticated DFS + Hamiltonian-like traversal when time limits exceeded

### State Management
- **Slice Pattern**: Modular Zustand slices (game-state, ui, creator, currency, achievement)
- **Primitive Selectors**: Avoids infinite loops by subscribing to individual fields
- **Persistence**: Only progress data persisted (not transient UI state)
- **Type-Safe**: Full TypeScript with proper `StoreApi<GameState>` types

### Performance
- **React.memo**: Applied to stable components (ViewModeRenderer, GameBoard, etc.)
- **useMemo/useCallback**: Memoize expensive calculations and handlers
- **Constant Extraction**: Move static data outside components
- **Index Files**: Centralized exports for better tree-shaking

## 📝 License

This project is open source and available for personal and commercial use.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for maintainability, performance, and user experience. Features sophisticated algorithms for level generation, procedural audio synthesis, and state management.
