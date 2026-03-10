---
description: flow-master — coding conventions and architecture rules
---

# FlowMaster Conventions

## Philosophy

Minimal, modern, zen. Every byte shipped must earn its place. Prefer native
browser APIs over libraries. Ship zero JS where possible (Server Components by
default). Respect the user's system preferences (color scheme, reduced motion,
contrast, Save-Data).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, static export via `output: "export"`) |
| Runtime | Bun |
| Language | TypeScript 5 — strict mode, no `any` |
| Styling | Tailwind CSS v4 utilities only — no inline styles, no CSS modules |
| Class Mgmt | `cva` for variants, `tailwind-merge` for dedup, `clsx` for conditionals. Export a `cn()` helper from `lib/utils.ts` |
| Theme | `next-themes` — `dark:` variant, CSS custom properties in `globals.css`. Theme-aware favicon via `prefers-color-scheme` in SVG. |
| UI Primitives | `@radix-ui/react-*` for accessible, unstyled primitives (dialog, tooltip, dropdown, slider, tabs, toggle, visually-hidden) |
| Icons | `lucide-react` — tree-shake individual imports |
| Animation | CSS transitions/animations + Canvas. No framer-motion. All animations MUST respect `prefers-reduced-motion`. |
| Toasts | `sonner` |
| Command Palette | `cmdk` — universal search, navigation, theme switching, easter-egg launcher |
| Keyboard | `react-hotkeys-hook` for shortcut registration. Action registry pattern (`lib/keyboard-actions.ts`) for mode-specific dispatch. |
| State | Zustand (`zustand/persist`, `useShallow`) — minimal, atomic stores. One concern per store. |
| Workers | `comlink` for typed Web Worker communication |
| Gestures | `@use-gesture/react` for touch/pointer interactions on canvas |
| Charts | `recharts` for stats visualizations |
| Compression | `fflate` for puzzle serialization (JSON -> deflate -> base64url) |
| Storage | `idb-keyval` for IndexedDB persistence (history, game state save/restore) |
| PWA | `@ducanh2912/next-pwa` with Workbox service worker, offline-first caching |
| Deployment | Docker multi-stage (Bun builder -> nginx:stable-alpine), GitHub Actions CI/CD |

## Architecture

- Follow SOLID, DRY, KISS. Prefer minimal diffs.
- Components are **dumb and presentational only**. No business logic in components.
- Business logic belongs in `lib/`, `hooks/`, `stores/`, or `providers/`.
- Default to **Server Components**. Add `'use client'` only on interactive leaf components that need browser APIs, event handlers, or hooks.
- Use `next/link` instead of `<a>`. Use `next/image` instead of `<img>`.
- Avoid prop drilling. Use Zustand stores, React context, or composition (children/render props).

## State Management

- Use Zustand for global state. Keep stores **minimal and atomic** — one concern per store.
- Export individual selector hooks (e.g. `useGridWidth`, `useTimerSeconds`), never the entire store object.
- Components must subscribe to the smallest slice needed to prevent unnecessary re-renders.
- Prefer `useShallow` from `zustand/react/shallow` for multi-field selectors.
- Use `getXxxState()` for imperative access outside React (event handlers, action registry, workers).

### Current Stores (9)

| Store | Concern | Persistence |
|-------|---------|-------------|
| `puzzle-store` | Current puzzle, colors, generation state, mode tag, zoom counter | None (transient) |
| `game-store` | Timer, move history (undo/redo), flows, completion, star rating | None (transient) |
| `settings-store` | Grid size, difficulty, theme, accessibility toggles | `zustand/persist` |
| `currency-store` | Flow balance, earn/spend, theme purchases | `zustand/persist` |
| `achievement-store` | 23 achievements, progress tracking, unlock state | `zustand/persist` |
| `campaign-store` | Area progress, current position, prestige level, XP | `zustand/persist` |
| `history-store` | Recent puzzle completions (IndexedDB via `idb-keyval`) | IndexedDB |
| `records-store` | Personal best times/moves per grid config | `zustand/persist` |
| `streak-store` | Daily streak tracking, multiplier | `zustand/persist` |

## Styling

- Use Tailwind CSS v4 utility classes exclusively. No inline styles or CSS modules.
- Order classes logically: **layout -> box model -> visual -> typography**.
  - Example: `flex items-center gap-2 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-900`
- Use `next-themes` for light/dark mode. Reference theme via `dark:` variant.
- Stick to CSS custom properties defined in `globals.css` for theme tokens.
- Component variants use `cva`. Combine with `cn()` for consumer overrides.

## Animation & Motion

- Use CSS transitions/animations and Canvas-based animations. No framer-motion.
- EVERY animation MUST have a reduced-motion fallback via `prefers-reduced-motion` media query or `matchMedia` check.
- Prefer `transform` and `opacity` for GPU-composited animations. Never animate `width`, `height`, `top`, `left`.
- Keep durations zen-like: 200-400ms for micro-interactions, 500-800ms for section reveals.
- Easing: custom cubic-bezier or spring. No linear unless intentional (e.g. marquee).

## Accessibility

- Radix primitives handle focus management, keyboard nav, ARIA attributes.
- Every interactive element must be keyboard-reachable.
- Icon-only buttons must have `aria-label`.
- Skip-to-content link in root layout.
- Color contrast >= 4.5:1 (AA). Test with both themes.
- All images require meaningful `alt` text or `alt=""` + `aria-hidden` if decorative.
- `sonner` toasts use `role="status"` by default — keep it.
- Respect `prefers-contrast: more` via `@media` query in `globals.css`.
- Focus-visible ring styling: global `focus-visible:ring-2 ring-offset-2`.
- `<noscript>` fallback message in root layout.
- Respect `Save-Data` header — skip heavy animations, serve smaller images.

## Imports & Bundle

- Zero tolerance for unused imports or dead code. Remove them immediately.
- Never keep duplicate imports from the same module. Merge them into a single import statement.
  - Good: `import { Navbar, Sidebar, Footer } from "@/components/layout"`
  - Bad: multiple `import ... from "@/components/layout"` lines in the same file
- Order imports in this **standard grouping** (enforced by `eslint-plugin-simple-import-sort`):
  1. Third-party packages (`react` > `next` > others alphabetically)
  2. Internal aliases (`@/...`)
     - Internal alias precedence: `@/components` > `@/lib` > `@/providers` > `@/stores` > `@/hooks` > `@/types`
  3. Relative imports (`../...`, `./...`)
- Sort paths alphabetically within each group.
- Prefer combining `type` specifiers into existing imports when possible (e.g. `import { foo, type Bar } from "..."`).
- Heavy libraries must be **dynamically imported** via `next/dynamic` or lazy `import()`.
- Prefer tree-shakable named imports over default imports where possible.
- Bundle budget: < 100KB first-load JS (gzipped).

## Imports — No Barrels

Do NOT create or use barrel `index.ts` re-export files. Import each module directly by its own path:
  - Good: `import { useGameStore } from "@/stores/game-store"`
  - Good: `import type { PuzzleData } from "@/lib/engine/types"`
  - Bad:  `import { useGameStore, useSettingsStore } from "@/stores"` (barrel)
This keeps dependency graphs small, avoids circular deps, and improves tree-shaking and HMR speed.
Multiple imports from different modules in the same directory is fine — each on its own line.

## ESLint

Enforced via `eslint.config.mjs` with `eslint-config-next`, `eslint-plugin-simple-import-sort`, and `eslint-plugin-unused-imports`:

- `no-console: error` with `allow: ["warn", "error"]` — no `console.log` or `console.info`
- `unused-imports/no-unused-imports: error` — auto-remove dead imports
- `simple-import-sort/imports: error` — enforced import grouping and ordering
- `simple-import-sort/exports: error` — enforced export ordering
- Semicolons required (`semi: ["error", "always"]`)

## TypeScript

- Strict mode. No `any` unless absolutely unavoidable.
- Co-locate types with domain logic (e.g. `lib/engine/types.ts`, store interfaces above their store).
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `as const` for literal config arrays/objects.

## Comments

- Comments explain **why**, never **what**. If the code needs a "what" comment, refactor for clarity.
- Bad: `// increment counter` Good: `// reset after max retries to avoid infinite loop`

## File Organization

```
app/                      Next.js routes, layouts, metadata
  (game)/                 Game route group
    page.tsx              Home / main menu
    play/page.tsx         Free Play
    campaign/page.tsx     Campaign
    daily/page.tsx        Daily Challenge
    gauntlet/page.tsx     Daily Gauntlet
    time-attack/page.tsx  Time Attack
    zen/page.tsx          Zen Mode
    stats/page.tsx        Stats & achievements
    layout.tsx            Shared game layout (command palette, shortcuts, themes, error boundary)
  layout.tsx              Root layout (SEO metadata, theme provider, skip-to-content)
  manifest.ts             PWA web manifest
  sitemap.ts              Dynamic sitemap
  robots.ts               Robots.txt
  opengraph-image.tsx     OG image (1200x630)
  error.tsx               Themed error boundary
  not-found.tsx           Themed 404
components/
  game/                   Game-specific UI (grid-canvas, controls-panel, completion-modal, game-shell, etc.)
  ui/                     Primitive UI (button, keyboard-shortcuts)
hooks/                    Custom React hooks (16 hooks)
stores/                   Zustand store definitions (9 stores)
providers/                Composed providers (theme-provider)
lib/                      Pure business logic
  engine/                 Puzzle generation engine (gen, grid, mitm, colorize, prng, game-logic, types)
  canvas/                 Canvas rendering (layout, renderers, endpoints, constants)
  audio.ts                Web Audio API + haptics
  campaign.ts             25-area campaign structure
  themes.ts               5 game themes + Retro (hidden)
  ranks.ts                7 rank tiers (Novice to Legend)
  keyboard-actions.ts     Action registry for mode-specific keyboard dispatch
  save-data.ts            Import/export save data
  serialization.ts        Puzzle URL encoding (JSON -> deflate -> base64url)
workers/
  puzzle.worker.ts        Comlink-based puzzle generation worker
public/                   Static assets
  icon.svg                Theme-aware favicon (prefers-color-scheme)
  icon-192.svg            PWA icon 192x192
  icon-512.svg            PWA icon 512x512
  apple-touch-icon.svg    Apple touch icon 180x180
  sw.js                   Generated by next-pwa/Workbox during build
```

## Performance

- Static export (`output: "export"`) served via nginx with immutable cache headers for assets.
- Lazy-load below-fold sections with `next/dynamic` (e.g. CommandPalette).
- Canvas rendering for all grid sizes (consistent, performant at 50x50).
- Web Workers for puzzle generation (never blocks main thread).
- Pre-generation: next puzzle generated in background while current is being solved.
- Service worker pre-caches all routes for offline-first experience.

## Deployment

### Docker

Multi-stage Dockerfile:
1. **Builder** (`oven/bun:latest`): `bun install --frozen-lockfile` + `bun run build` produces static export in `out/`
2. **Server** (`nginx:stable-alpine`): serves `out/` with `nginx.conf`

### nginx

- COOP/COEP headers for SharedArrayBuffer (Web Workers)
- SPA fallback (`try_files $uri $uri/ /index.html`)
- No-cache for `sw.js` and `manifest.webmanifest`
- 1-year immutable cache for hashed assets (JS, CSS, images, fonts)
- No-cache for HTML files

### CI/CD

GitHub Actions workflow (`.github/workflows/docker-merge.yml`):
- Triggers on push to `master`
- Builds multi-arch image (`linux/amd64`, `linux/arm64`) via Docker Buildx
- Pushes to Docker Hub as `54nd33p/flowfree:latest`

## Puzzle Engine (`lib/engine/`)

- Pure TypeScript — zero DOM or browser dependencies.
- All randomness goes through an injectable `PRNG` type: `type PRNG = () => number`.
- Every function that uses randomness accepts `random: PRNG` as a parameter (enables deterministic Daily Challenge seeds and parallel worker isolation).
- Engine modules: `prng.ts`, `grid.ts`, `mitm.ts`, `gen.ts`, `colorize.ts`, `game-logic.ts`, `level-config.ts`, `types.ts`.
- Engine code must run identically in main thread or Web Worker — no globals, no singletons, no ambient state.

## Worker Architecture

- Puzzle generation runs in Web Workers via `comlink`, **never** on the main thread.
- Worker API contract:
  ```ts
  interface GeneratorAPI {
    generate(w: number, h: number, opts: GenerateOpts): Promise<GenerateResult>
  }
  interface GenerateOpts { min?: number; max?: number; maxAttempts?: number; seed?: number }
  ```
- `usePuzzleGenerator` hook manages a worker pool: `navigator.hardwareConcurrency` workers race via `Promise.race()`, losers are terminated. Default concurrency = 1 for small grids, auto-scales for grids >= 20x20.
- MITM table is precomputed once per grid-height and cached within each worker instance.
- Retry logic with difficulty fallback (hard -> easy) after `MAX_RETRIES`.

## Keyboard & Command Palette

- `cmdk` powers a command palette (`Cmd+K`): generate puzzle, set grid size, toggle solution, switch theme, easter eggs.
- Action registry pattern (`lib/keyboard-actions.ts`): game mode pages register their own handlers on mount. `KeyboardShortcuts` dispatches via `fireAction()`. This prevents cross-mode leaking.
- Global shortcuts (always active): `S` (toggle solution), `Cmd+Z` (undo), `Cmd+Shift+Z` (redo), `Shift+/` (help).
- Mode-specific shortcuts (registered per page): `N` (generate), `R` (reset), `Enter` (play again), `H` (hint), `0` (reset zoom), `+`/`-` (grid size).
- Easter egg shortcuts (Konami code) trigger hidden animations or unlock the Retro theme.
- All shortcut registrations live in `components/ui/keyboard-shortcuts.tsx`.

## Canvas Rendering

- Use `<canvas>` for all grid sizes (consistent rendering path, performant at 50x50).
- `requestAnimationFrame` loop for smooth flow-drawing interaction.
- Active game theme colors applied to canvas via `lib/themes.ts` lookup.
- Scale dot radius and font size proportionally: `cellSize = canvasSize / gridSize`.

## Campaign Structure

- 25 areas grouped into 5 tiers of 5 areas each.
- Each area has 50 procedurally-generated levels with deterministic seeds.
- Grid sizes scale from 5x5 (area 1) up to large grids in later tiers.
- Completion unlocks the next area. All 25 areas unlocked enables Prestige (reset for bonus).

## Game Economy

- **Flow Currency**: earned from completions, perfect clears, daily challenges, streaks. Spent on hints (25), skips (50), theme purchases.
- **Themes**: Water (free), Retro (hidden unlock), Electric/Neural/Light/Zen (purchasable). Each theme has 5 rank tiers with unique colors, gradient, and icon.
- **Achievements**: 23 achievements tracking milestones (puzzles solved, streaks, grid sizes, speed, campaign progress, prestige).
- **Ranks**: 7 tiers from Novice (0 XP) to Legend (25,000 XP). XP earned from campaign completions.
- **Streaks**: Daily completion tracking with multiplier bonus.
- **Star Ratings**: 1-3 stars based on move efficiency. Perfect clear (3 stars) gives bonus currency.

## Serialization & Sharing

- `encodePuzzle` / `decodePuzzle` in `lib/serialization.ts`.
- Format: JSON -> deflate (fflate) -> base64url.
- Shared via URL fragment: `/play#puzzle=<encoded>`.
- Clipboard paste import supported via `ClipboardPasteImport` component.
- Seed + grid config also shareable via `copySeed`.

## Routing

```
app/
  (game)/
    page.tsx              Home / main menu
    play/page.tsx         Free Play
    campaign/page.tsx     Campaign (25 areas x 50 levels)
    daily/page.tsx        Daily Challenge (seed-based)
    gauntlet/page.tsx     Daily Gauntlet (5 escalating stages)
    time-attack/page.tsx  Time Attack
    zen/page.tsx          Zen Mode
    stats/page.tsx        Stats, achievements, profile
  layout.tsx              Game layout (command palette, keyboard shortcuts, theme selector, error boundary, service worker registration)
```

All routes are statically exported. Client-side navigation via Next.js Link.
