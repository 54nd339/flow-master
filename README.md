# Flow Master

A modern, beautifully designed Flow puzzle game built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## 🎮 Features

### Core Gameplay
- **Procedural Level Generation**: Unique levels generated algorithmically with global uniqueness tracking across all game modes
- **Multiple Game Modes**: Campaign, Daily Challenge, Time Attack, Zen Mode, and Level Creator
- **Progressive Difficulty**: 25 stages with increasing complexity
- **Perfect Score System**: Track moves vs minimum moves with star ratings (displayed in completion modal)
- **Undo System**: Undo your last move instead of resetting the board
- **Level Uniqueness**: Ensures no level appears twice across any game mode

### Visual & Audio
- **5 Distinct Themes**: Water, Electric, Neural, Light, and Zen (unlockable)
- **Procedural Audio**: Real-time sound synthesis using Web Audio API
  - Each color has a unique musical note
  - "Pop" sounds when connecting dots
  - Glissando (sliding notes) when clearing levels
- **Visual Celebrations**: Particle effects using puzzle colors on completion
- **Haptic Feedback**: Vibration patterns for mobile devices
- **Colorblind Mode**: Unique symbols inside dots for accessibility

### Progression & Rewards
- **Currency System (Flows)**: Earn flows by completing levels, maintaining streaks, and perfect clears
- **Theme Shop**: Unlock new themes using earned flows (integrated in Settings)
- **Achievements**: Dedicated achievements view to track milestones and earn bonus flows
- **Daily Streaks**: Maintain daily challenge streaks for bonus rewards
- **Rank System**: Unlock new ranks as you progress through stages
- **Profile Stats**: View comprehensive stats including time played, time attack high scores, and achievements

### Sharing & Social
- **URL Sharing**: Generate shareable URLs for custom levels
- **Snapshot Sharing**: Create beautiful PNG images of solved boards
- **Level Creator**: Build and share custom levels with compression

### Technical Features
- **Persistent Progress**: Save your progress locally with versioned migrations
- **Hint System**: Earn hints by completing levels
- **Time Attack Mode**: Race against the clock with configurable grid sizes and time limits
- **Zen Mode**: Infinite random puzzles without constraints
- **Time Tracking**: Tracks time spent per level and total time played
- **Performance Optimized**: Memoized components, optimized Zustand selectors, and efficient re-renders

## 🏗️ Project Structure

```
flow-master/
├── app/                  # Next.js App Router
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   └── game/            # Game-specific components
├── stores/               # Zustand state management
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── utils/                # Extracted utility functions
├── config/               # Configuration files
├── types/                # TypeScript definitions
└── constants/            # Constants and themes
```

See [TECH.md](./TECH.md) for detailed technical documentation.

## 🛠️ Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion

## 📦 Installation

```bash
npm install
npm run dev
```

## 📝 License

This project is open source and available for personal and commercial use.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for maintainability, performance, and user experience.
