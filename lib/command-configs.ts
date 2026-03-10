import {
  Accessibility,
  ArrowRight,
  Award,
  BarChart3,
  Clipboard,
  Coins,
  Contrast,
  Crown,
  Download,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  Grid3x3,
  Hand,
  Hash,
  HelpCircle,
  Home,
  Leaf,
  LucideIcon,
  Minimize2,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  Play,
  RotateCcw,
  Share2,
  Shield,
  SkipForward,
  Sparkles,
  Sun,
  Swords,
  Trophy,
  Undo2,
  Upload,
  User,
  Volume2,
  VolumeOff,
  Zap,
} from "lucide-react";

import { type Difficulty, DIFFICULTY_OPTIONS } from "@/lib/engine/level-config";

export const GRID_PRESETS = [5, 7, 9, 12, 15, 20, 25, 30, 40, 50] as const;

export interface CommandPaletteHandlers {
  onGenerate: () => void;
  onToggleSolution: () => void;
  onSetGridSize: (size: number) => void;
  onSetDifficulty: (d: Difficulty) => void;
  onUndo: () => void;
  onReset: () => void;
  onNextPuzzle: () => void;
  onToggleMute: () => void;
  onToggleMinimalHud: () => void;
  onShowSeed: () => void;
  onMatrixEasterEgg: () => void;
  onSpeedEasterEgg: () => void;
  onSharePuzzle?: () => void;
  onCopySeed?: () => void;
  onNavigate?: (path: string) => void;
  onSetTheme?: (theme: string) => void;
  onToggleHighContrast?: () => void;
  onToggleLeftHanded?: () => void;
  onToggleColorblind?: () => void;
  onToggleReducedMotion?: () => void;
  onExportSaveData?: () => void;
  onImportSaveData?: () => void;
  onHint?: () => void;
  onSkipPuzzle?: () => void;
  onOpenThemes?: () => void;
  onWatchSolve?: () => void;
  onExportProfileCard?: () => void;
  onViewRanks?: () => void;
  onPrestige?: () => void;
}

export interface CommandPaletteState {
  showSolution: boolean;
  difficulty: Difficulty;
  hasPuzzle: boolean;
  muted: boolean;
  minimalHud: boolean;
  highContrast?: boolean;
  leftHanded?: boolean;
  colorblindMode?: boolean;
  reducedMotion?: boolean;
  currencyBalance?: number;
  canPrestige?: boolean;
  mode?: string;
}

export type CommandPaletteProps = CommandPaletteHandlers & CommandPaletteState & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export interface CommandItem {
  id: string;
  label: string;
  value?: string;
  icon: LucideIcon;
  onSelect: (handlers: CommandPaletteHandlers) => void;
  show?: (state: CommandPaletteState) => boolean;
  badge?: (state: CommandPaletteState) => string | null;
  active?: (state: CommandPaletteState) => boolean;
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export function getCommandGroups(props: CommandPaletteProps): CommandGroup[] {
  const isPlay = props.mode === "play";

  const groups: CommandGroup[] = [
    {
      heading: "Navigate",
      items: [
        { id: "nav-home", label: "Home", icon: Home, onSelect: (h) => h.onNavigate?.("/") },
        { id: "nav-daily", label: "Daily Challenge", value: "daily challenge", icon: Flame, onSelect: (h) => h.onNavigate?.("/daily") },
        { id: "nav-zen", label: "Zen Mode", icon: Leaf, onSelect: (h) => h.onNavigate?.("/zen") },
        { id: "nav-play", label: "Free Play", icon: Play, onSelect: (h) => h.onNavigate?.("/play") },
        { id: "nav-campaign", label: "Campaign", value: "campaign mode", icon: Swords, onSelect: (h) => h.onNavigate?.("/campaign") },
        { id: "nav-time-attack", label: "Time Attack", value: "time attack mode", icon: Zap, onSelect: (h) => h.onNavigate?.("/time-attack") },
        { id: "nav-stats", label: "Stats", value: "stats dashboard", icon: BarChart3, onSelect: (h) => h.onNavigate?.("/stats") },
        { id: "nav-gauntlet", label: "Daily Gauntlet", value: "daily gauntlet", icon: Shield, onSelect: (h) => h.onNavigate?.("/gauntlet") },
      ],
    },
  ];

  if (isPlay) {
    groups.push(
      {
        heading: "Generate",
        items: [
          { id: "gen-new", label: "New Puzzle", icon: Play, onSelect: (h) => h.onGenerate() },
          ...GRID_PRESETS.map((size) => ({
            id: `gen-grid-${size}`,
            label: `Set grid to ${size}×${size}`,
            icon: Grid3x3,
            onSelect: (h: CommandPaletteHandlers) => h.onSetGridSize(size),
          })),
        ],
      },
      {
        heading: "Difficulty",
        items: DIFFICULTY_OPTIONS.map((opt) => ({
          id: `difficulty-${opt.value}`,
          label: opt.label,
          icon: Gauge,
          onSelect: (h: CommandPaletteHandlers) => h.onSetDifficulty(opt.value),
          active: (s: CommandPaletteState) => s.difficulty === opt.value,
        })),
      },
    );
  }

  if (props.hasPuzzle) {
    groups.push({
      heading: "Game",
      items: [
        { id: "game-undo", label: "Undo", icon: Undo2, onSelect: (h) => h.onUndo() },
        { id: "game-reset", label: "Reset Puzzle", icon: RotateCcw, onSelect: (h) => h.onReset() },
        { id: "game-next", label: "Next Puzzle", icon: ArrowRight, onSelect: (h) => h.onNextPuzzle() },
        {
          id: "game-hint",
          label: "Use Hint",
          value: "use hint",
          icon: HelpCircle,
          onSelect: (h) => h.onHint?.(),
          show: () => isPlay && !!props.onHint,
          badge: () => "25 flows",
        },
        {
          id: "game-skip",
          label: "Skip Puzzle",
          value: "skip puzzle",
          icon: SkipForward,
          onSelect: (h) => h.onSkipPuzzle?.(),
          show: () => isPlay && !!props.onSkipPuzzle,
          badge: () => "50 flows",
        },
      ],
    });

    if (isPlay && (props.onSharePuzzle || props.onCopySeed)) {
      groups.push({
        heading: "Share",
        items: [
          {
            id: "share-puzzle",
            label: "Share Puzzle",
            icon: Share2,
            onSelect: (h) => h.onSharePuzzle?.(),
            show: () => !!props.onSharePuzzle,
          },
          {
            id: "copy-seed",
            label: "Copy Seed",
            icon: Clipboard,
            onSelect: (h) => h.onCopySeed?.(),
            show: () => !!props.onCopySeed,
          },
        ],
      });
    }
  }

  groups.push({
    heading: "Economy",
    items: [
      {
        id: "view-themes",
        label: "View Themes",
        value: "view themes",
        icon: Palette,
        onSelect: (h) => h.onOpenThemes?.(),
        show: () => !!props.onOpenThemes,
      },
      { id: "view-achs", label: "View Achievements", value: "view achievements", icon: Award, onSelect: (h) => h.onNavigate?.("/stats") },
      {
        id: "val-balance",
        label: `Balance: ${props.currencyBalance} flows`,
        value: "flow balance",
        icon: Coins,
        onSelect: () => { },
        show: () => typeof props.currencyBalance === "number",
      },
    ],
  });

  groups.push({
    heading: "Audio",
    items: [
      {
        id: "toggle-mute",
        label: props.muted ? "Unmute Sound" : "Mute Sound",
        icon: props.muted ? VolumeOff : Volume2,
        onSelect: (h) => h.onToggleMute(),
      },
    ],
  });

  groups.push({
    heading: "View",
    items: [
      {
        id: "toggle-solve",
        label: props.showSolution ? "Hide Solution" : "Show Solution",
        icon: props.showSolution ? EyeOff : Eye,
        onSelect: (h) => h.onToggleSolution(),
      },
      {
        id: "show-seed",
        label: "Show Seed",
        icon: Hash,
        onSelect: (h) => h.onShowSeed(),
        show: (s) => s.hasPuzzle,
      },
      {
        id: "toggle-hud",
        label: props.minimalHud ? "Full HUD" : "Minimal HUD",
        icon: Minimize2,
        onSelect: (h) => h.onToggleMinimalHud(),
      },
    ],
  });

  groups.push({
    heading: "Theme",
    items: [
      { id: "theme-light", label: "Light Theme", icon: Sun, onSelect: (h) => h.onSetTheme?.("light") },
      { id: "theme-dark", label: "Dark Theme", icon: Moon, onSelect: (h) => h.onSetTheme?.("dark") },
      { id: "theme-sys", label: "System Theme", icon: Monitor, onSelect: (h) => h.onSetTheme?.("system") },
    ],
  });

  groups.push({
    heading: "Accessibility",
    items: [
      {
        id: "acc-contrast",
        label: props.highContrast ? "Disable High Contrast" : "High Contrast",
        icon: Contrast,
        onSelect: (h) => h.onToggleHighContrast?.(),
        show: () => !!props.onToggleHighContrast,
        active: (s) => !!s.highContrast,
      },
      {
        id: "acc-lefty",
        label: props.leftHanded ? "Disable Left-Handed Mode" : "Left-Handed Mode",
        icon: PanelLeft,
        onSelect: (h) => h.onToggleLeftHanded?.(),
        show: () => !!props.onToggleLeftHanded,
        active: (s) => !!s.leftHanded,
      },
      {
        id: "acc-colorblind",
        label: props.colorblindMode ? "Disable Colorblind Mode" : "Colorblind Mode",
        icon: Accessibility,
        onSelect: (h) => h.onToggleColorblind?.(),
        show: () => !!props.onToggleColorblind,
        active: (s) => !!s.colorblindMode,
      },
      {
        id: "acc-motion",
        label: props.reducedMotion ? "Disable Reduced Motion" : "Reduced Motion",
        icon: Hand,
        onSelect: (h) => h.onToggleReducedMotion?.(),
        show: () => !!props.onToggleReducedMotion,
        active: (s) => !!s.reducedMotion,
      },
    ],
  });

  groups.push({
    heading: "Data",
    items: [
      {
        id: "data-export",
        label: "Export Save Data",
        icon: Download,
        onSelect: (h) => h.onExportSaveData?.(),
        show: () => !!props.onExportSaveData,
      },
      {
        id: "data-import",
        label: "Import Save Data",
        icon: Upload,
        onSelect: (h) => h.onImportSaveData?.(),
        show: () => !!props.onImportSaveData,
      },
    ],
  });

  groups.push({
    heading: "Profile",
    items: [
      {
        id: "prof-card",
        label: "Export Profile Card",
        value: "export profile card",
        icon: User,
        onSelect: (h) => h.onExportProfileCard?.(),
        show: () => !!props.onExportProfileCard,
      },
      {
        id: "prof-ranks",
        label: "View Ranks",
        value: "view ranks",
        icon: Trophy,
        onSelect: (h) => h.onViewRanks?.(),
        show: () => !!props.onViewRanks,
      },
    ],
  });

  groups.push({
    heading: "Easter Eggs",
    items: [
      {
        id: "ee-max",
        label: "Generate Maximum (50×50)",
        icon: Sparkles,
        onSelect: (h) => { h.onSetGridSize(50); h.onGenerate(); },
      },
      {
        id: "ee-matrix",
        label: "Matrix Rain",
        value: "matrix",
        icon: Sparkles,
        onSelect: (h) => h.onMatrixEasterEgg(),
      },
      {
        id: "ee-speed",
        label: "Speed Solve",
        value: "speed",
        icon: Zap,
        onSelect: (h) => h.onSpeedEasterEgg(),
      },
      {
        id: "ee-answer",
        label: "The Answer (42×42)",
        value: "42",
        icon: Sparkles,
        onSelect: (h) => { h.onSetGridSize(42); h.onGenerate(); },
      },
      {
        id: "ee-rich",
        label: "Get Rich Quick",
        value: "rich",
        icon: Coins,
        onSelect: () => { },
      },
      {
        id: "ee-prestige",
        label: "Prestige Mode",
        value: "prestige mode",
        icon: Crown,
        onSelect: (h) => h.onPrestige?.(),
        show: (s) => !!props.onPrestige && !!s.canPrestige,
      },
    ],
  });

  return groups;
}
