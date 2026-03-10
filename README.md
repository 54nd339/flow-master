# FlowMaster

A numberlink puzzle game built with Next.js 16, React 19, and TypeScript. Connect color-coded endpoint pairs with non-overlapping paths to fill the entire grid.

**Live:** [flow.sandeepswain.dev](https://flow.sandeepswain.dev)

## Game Modes


| Mode                | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Free Play**       | Generate puzzles from 5x5 to 50x50 at easy/medium/hard difficulty                  |
| **Campaign**        | 25 areas with 50 procedurally-generated levels each, grouped into 5 thematic tiers |
| **Daily Challenge** | One seed-based puzzle per day, same for all players                                |
| **Daily Gauntlet**  | Five escalating puzzles (5x5 easy to 15x15 hard) against the clock                 |
| **Time Attack**     | Solve as many puzzles as possible within a time limit                              |
| **Zen Mode**        | Relaxed, untimed play on smaller grids                                             |


## Features

- Canvas-based rendering performant up to 50x50 grids
- Puzzle generation in Web Workers via Comlink (never blocks the main thread)
- Undo/redo, hints, show solution, replay solution animation
- Flow currency, 23 achievements, rank progression (Novice to Legend)
- 5 unlockable color themes (Water, Electric, Neural, Light, Zen) plus a secret Retro theme
- Full keyboard shortcuts and command palette (Cmd+K)
- PWA with offline support and service worker caching
- Dark/light mode via system preference or manual toggle
- Accessibility: skip-to-content, focus-visible rings, reduced motion support, ARIA labels
- Puzzle sharing via compressed URL encoding

## Tech Stack


| Layer         | Choice                                 |
| ------------- | -------------------------------------- |
| Framework     | Next.js 16 (App Router, static export) |
| Runtime       | Bun                                    |
| Language      | TypeScript 5 (strict, no `any`)        |
| Styling       | Tailwind CSS v4                        |
| UI Primitives | Radix UI                               |
| State         | Zustand with `zustand/persist`         |
| Workers       | Comlink                                |
| PWA           | @ducanh2912/next-pwa                   |
| Deployment    | Docker (nginx)                         |


## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0

### Development

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
bun run build
bun start
```

The build outputs a static export to `out/` and serves it via `bunx serve`.

### Docker

```bash
docker build -t flowmaster .
docker run -p 8080:80 flowmaster
```

Multi-stage build: Bun builds the static export, nginx serves it with proper caching headers, COOP/COEP for SharedArrayBuffer support, and SPA fallback routing.

The image is published to Docker Hub as `54nd33p/flowfree` on every push to `master` via GitHub Actions.

## Project Structure

```
app/                      Next.js routes, layouts, metadata
  (game)/                 Game route group
    page.tsx              Home / main menu
    play/page.tsx         Free Play
    campaign/page.tsx     Campaign mode
    daily/page.tsx        Daily Challenge
    gauntlet/page.tsx     Daily Gauntlet
    time-attack/page.tsx  Time Attack
    zen/page.tsx          Zen Mode
    stats/page.tsx        Stats & achievements
    layout.tsx            Shared game layout (command palette, shortcuts, themes)
  layout.tsx              Root layout (SEO metadata, theme provider)
  manifest.ts             PWA web manifest
  sitemap.ts              Dynamic sitemap
  robots.ts               Robots.txt
  opengraph-image.tsx     OG image generation
components/
  game/                   Game-specific components (grid canvas, controls, modals)
  ui/                     Primitive UI (button, keyboard shortcuts)
hooks/                    Custom React hooks (16 hooks)
stores/                   Zustand stores (9 stores)
lib/                      Pure business logic
  engine/                 Puzzle generation engine (grid, gen, mitm, colorize, prng)
  canvas/                 Canvas rendering (layout, renderers, endpoints)
workers/                  Web Worker entry points
  puzzle.worker.ts        Puzzle generation worker (Comlink API)
public/                   Static assets (icons, SW output)
```

## Keyboard Shortcuts


| Key           | Action                      |
| ------------- | --------------------------- |
| `N`           | New puzzle                  |
| `R`           | Reset current puzzle        |
| `S`           | Toggle solution overlay     |
| `P` / `Enter` | Pause/resume timer          |
| `Cmd+Z`       | Undo                        |
| `Cmd+Shift+Z` | Redo                        |
| `+` / `-`     | Increase/decrease grid size |
| `0`           | Reset zoom                  |
| `Cmd+K`       | Command palette             |
| `Shift+/`     | Show keyboard shortcuts     |


## Scripts


| Command         | Description                      |
| --------------- | -------------------------------- |
| `bun dev`       | Start dev server with Turbopack  |
| `bun run build` | Production build (static export) |
| `bun start`     | Serve the built output           |
| `bun lint`      | Run ESLint                       |


