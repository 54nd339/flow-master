import {
  Atom,
  Brain,
  CircuitBoard,
  Cloud,
  Compass,
  Cpu,
  Droplets,
  Eye,
  Flame,
  Flower2,
  Focus,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Mountain,
  Rainbow,
  Shell,
  Sparkles,
  Star,
  SunDim,
  Trees,
  Waves,
  Zap,
  ZapOff,
} from "lucide-react";

export interface ThemeRank {
  name: string
  color: string
  icon: LucideIcon
}

export interface GameTheme {
  id: string
  name: string
  cost: number
  hidden?: boolean
  ranks: ThemeRank[]
  colors: {
    flows: string[]
    bg: string
    grid: string
    gridBorder: string
    endpoint: string
    endpointStroke: string
    text: string
    textMuted: string
  }
}

export const GAME_THEMES: GameTheme[] = [
  {
    id: "water",
    name: "Water",
    cost: 0,
    ranks: [
      { name: "Stream Walker", color: "from-sky-300 to-blue-400", icon: Droplets },
      { name: "River Guide", color: "from-blue-400 to-cyan-500", icon: Waves },
      { name: "Cascade Surfer", color: "from-cyan-400 to-teal-500", icon: Cloud },
      { name: "Torrent Tamer", color: "from-teal-400 to-blue-600", icon: Shell },
      { name: "Superfluid Architect", color: "from-blue-500 to-indigo-600", icon: Mountain },
    ],
    colors: {
      flows: [
        "#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#A855F7",
        "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6366F1",
        "#14B8A6", "#E11D48", "#8B5CF6", "#D946EF", "#0EA5E9",
      ],
      bg: "#0F172A",
      grid: "#1E293B",
      gridBorder: "#334155",
      endpoint: "#F8FAFC",
      endpointStroke: "#94A3B8",
      text: "#F8FAFC",
      textMuted: "#64748B",
    },
  },
  {
    id: "electric",
    name: "Electric",
    cost: 500,
    ranks: [
      { name: "Live Wire", color: "from-yellow-300 to-amber-400", icon: Zap },
      { name: "Circuit Breaker", color: "from-amber-400 to-orange-500", icon: ZapOff },
      { name: "Power Grid", color: "from-orange-400 to-red-500", icon: CircuitBoard },
      { name: "Fusion Core", color: "from-red-400 to-pink-500", icon: Cpu },
      { name: "Superconductor", color: "from-pink-400 to-purple-600", icon: Atom },
    ],
    colors: {
      flows: [
        "#00FFFF", "#FF0080", "#00FF41", "#FFE100", "#BF00FF",
        "#FF6B35", "#00D4FF", "#FF2D2D", "#7FFF00", "#FF00FF",
        "#00FFA3", "#FF4081", "#FFAB00", "#651FFF", "#1DE9B6",
      ],
      bg: "#0A0A0A",
      grid: "#1A1A2E",
      gridBorder: "#16213E",
      endpoint: "#FFFFFF",
      endpointStroke: "#00FFFF",
      text: "#FFFFFF",
      textMuted: "#555577",
    },
  },
  {
    id: "neural",
    name: "Neural",
    cost: 750,
    ranks: [
      { name: "New Neuron", color: "from-rose-300 to-pink-400", icon: Sparkles },
      { name: "Synapse Spark", color: "from-pink-400 to-fuchsia-500", icon: Flame },
      { name: "Logic Weaver", color: "from-fuchsia-400 to-purple-500", icon: Brain },
      { name: "Deep Mind", color: "from-purple-400 to-violet-500", icon: Eye },
      { name: "Singularity", color: "from-violet-500 to-indigo-600", icon: Atom },
    ],
    colors: {
      flows: [
        "#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8B94",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
        "#F1948A", "#76D7C4", "#F0B27A", "#AED6F1", "#D7BDE2",
      ],
      bg: "#1A1A2E",
      grid: "#16213E",
      gridBorder: "#0F3460",
      endpoint: "#E8E8E8",
      endpointStroke: "#4ECDC4",
      text: "#EAEAEA",
      textMuted: "#5C6B80",
    },
  },
  {
    id: "light",
    name: "Light",
    cost: 1000,
    ranks: [
      { name: "Ray Tracer", color: "from-amber-200 to-yellow-300", icon: Lightbulb },
      { name: "Spectrum", color: "from-yellow-300 to-lime-400", icon: Rainbow },
      { name: "Refractor", color: "from-lime-300 to-emerald-400", icon: SunDim },
      { name: "Laser Focus", color: "from-emerald-300 to-teal-400", icon: Focus },
      { name: "Photon Master", color: "from-teal-300 to-cyan-400", icon: Star },
    ],
    colors: {
      flows: [
        "#2563EB", "#DC2626", "#16A34A", "#CA8A04", "#9333EA",
        "#DB2777", "#0891B2", "#EA580C", "#65A30D", "#4F46E5",
        "#0D9488", "#BE123C", "#7C3AED", "#C026D3", "#0284C7",
      ],
      bg: "#FFFFFF",
      grid: "#F1F5F9",
      gridBorder: "#E2E8F0",
      endpoint: "#1E293B",
      endpointStroke: "#475569",
      text: "#0F172A",
      textMuted: "#94A3B8",
    },
  },
  {
    id: "zen-garden",
    name: "Zen",
    cost: 1500,
    ranks: [
      { name: "Seeker", color: "from-lime-200 to-green-300", icon: Leaf },
      { name: "Wanderer", color: "from-green-300 to-emerald-400", icon: Compass },
      { name: "Gardener", color: "from-emerald-300 to-teal-400", icon: Flower2 },
      { name: "Sage", color: "from-teal-300 to-cyan-400", icon: Trees },
      { name: "Enlightened", color: "from-cyan-300 to-sky-400", icon: Leaf },
    ],
    colors: {
      flows: [
        "#8B7355", "#6B8E23", "#CD853F", "#556B2F", "#D2691E",
        "#BDB76B", "#8FBC8F", "#DAA520", "#BC8F8F", "#9ACD32",
        "#A0522D", "#778899", "#DEB887", "#808000", "#C4A882",
      ],
      bg: "#F5F0E8",
      grid: "#E8DFD0",
      gridBorder: "#D4C5B0",
      endpoint: "#4A3728",
      endpointStroke: "#8B7355",
      text: "#3C2F1E",
      textMuted: "#8B7D6B",
    },
  },
  {
    id: "retro",
    name: "Retro",
    cost: 0,
    hidden: true,
    ranks: [
      { name: "Pixel", color: "from-green-400 to-lime-500", icon: Sparkles },
      { name: "Sprite", color: "from-lime-400 to-yellow-500", icon: Zap },
      { name: "Bitmap", color: "from-yellow-400 to-amber-500", icon: Cpu },
      { name: "Vector", color: "from-amber-400 to-orange-500", icon: CircuitBoard },
      { name: "Shader", color: "from-orange-400 to-red-500", icon: Star },
    ],
    colors: {
      flows: [
        "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF",
        "#00FFFF", "#FF8000", "#80FF00", "#0080FF", "#FF0080",
        "#80FF80", "#8080FF", "#FF8080", "#FFFF80", "#80FFFF",
      ],
      bg: "#000000",
      grid: "#001100",
      gridBorder: "#003300",
      endpoint: "#33FF33",
      endpointStroke: "#00FF00",
      text: "#33FF33",
      textMuted: "#006600",
    },
  },
];

export function getVisibleThemes(): GameTheme[] {
  return GAME_THEMES.filter((t) => !t.hidden);
}

export function getThemeById(id: string): GameTheme | undefined {
  return GAME_THEMES.find((t) => t.id === id);
}
