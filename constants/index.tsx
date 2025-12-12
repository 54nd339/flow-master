'use client';

import React from 'react';
import {
  ArrowRight, Grid, Wand2, CheckCircle2,
  Crown, Zap, Waves, Cpu, BrainCircuit,
  Sun, Sparkles, Leaf, Eye
} from 'lucide-react';
import { ThemePreset } from '@/types';

export const THEME_PRESETS: Record<string, ThemePreset> = {
  WATER: {
    id: 'WATER',
    label: 'Ocean Depths',
    ranks: [
      { name: "Stream Walker", color: "from-sky-400 to-blue-500", icon: CheckCircle2 },
      { name: "River Guide", color: "from-blue-500 to-indigo-600", icon: Wand2 },
      { name: "Cascade Surfer", color: "from-indigo-500 to-violet-600", icon: Waves },
      { name: "Torrent Tamer", color: "from-violet-600 to-fuchsia-700", icon: Zap },
      { name: "Superfluid Architect", color: "from-cyan-400 to-blue-600", icon: Crown },
    ],
    palette: [
      { id: 0, hex: '#0ea5e9' }, { id: 1, hex: '#3b82f6' }, { id: 2, hex: '#1d4ed8' },
      { id: 3, hex: '#06b6d4' }, { id: 4, hex: '#6366f1' }, { id: 5, hex: '#8b5cf6' },
      { id: 6, hex: '#a855f7' }, { id: 7, hex: '#2563eb' }, { id: 8, hex: '#0284c7' },
      { id: 9, hex: '#7dd3fc' }, { id: 10, hex: '#818cf8' }, { id: 11, hex: '#1e40af' },
      { id: 12, hex: '#60a5fa' }, { id: 13, hex: '#a78bfa' }, { id: 14, hex: '#22d3ee' },
      { id: 15, hex: '#0c4a6e' }, { id: 16, hex: '#1e3a8a' }, { id: 17, hex: '#3730a3' },
      { id: 18, hex: '#4c1d95' }, { id: 19, hex: '#581c87' },
    ],
    bg: (idx) => (
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0 50 Q 25 60 50 50 T 100 50 V 100 H 0 Z" fill="url(#grad1)" className="animate-wave-slow" />
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <style>{`.animate-wave-slow { animation: wave 10s infinite linear alternate; } @keyframes wave { from { d: path("M0 50 Q 25 40 50 50 T 100 50 V 100 H 0 Z"); } to { d: path("M0 50 Q 25 60 50 50 T 100 50 V 100 H 0 Z"); } }`}</style>
      </svg>
    )
  },
  ELECTRIC: {
    id: 'ELECTRIC',
    label: 'High Voltage',
    ranks: [
      { name: "Live Wire", color: "from-yellow-500 to-orange-600", icon: Zap },
      { name: "Circuit Breaker", color: "from-orange-500 to-red-600", icon: Cpu },
      { name: "Power Grid", color: "from-red-600 to-rose-700", icon: Grid },
      { name: "Fusion Core", color: "from-rose-600 to-purple-800", icon: Sun },
      { name: "Superconductor", color: "from-blue-500 to-cyan-400", icon: Sparkles },
    ],
    palette: [
      { id: 0, hex: '#eab308' }, { id: 1, hex: '#f59e0b' }, { id: 2, hex: '#f97316' },
      { id: 3, hex: '#ef4444' }, { id: 4, hex: '#dc2626' }, { id: 5, hex: '#84cc16' },
      { id: 6, hex: '#10b981' }, { id: 7, hex: '#06b6d4' }, { id: 8, hex: '#3b82f6' },
      { id: 9, hex: '#6366f1' }, { id: 10, hex: '#d946ef' }, { id: 11, hex: '#ec4899' },
      { id: 12, hex: '#f43f5e' }, { id: 13, hex: '#fde047' }, { id: 14, hex: '#ffffff' },
      { id: 15, hex: '#ca8a04' }, { id: 16, hex: '#b45309' }, { id: 17, hex: '#92400e' },
      { id: 18, hex: '#78350f' }, { id: 19, hex: '#fbbf24' },
    ],
    bg: (idx) => (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 0 L 20 40 L 15 45 L 30 100" stroke="currentColor" strokeWidth="0.5" fill="none" className="animate-zap-1" />
        <style>{`.animate-zap-1 { animation: flash 2s infinite; } @keyframes flash { 0%,100% { opacity: 0.1; } 5% { opacity: 1; } 10% { opacity: 0.1; } }`}</style>
      </svg>
    )
  },
  NEURAL: {
    id: 'NEURAL',
    label: 'Neural Net',
    ranks: [
      { name: "New Neuron", color: "from-pink-500 to-rose-600", icon: BrainCircuit },
      { name: "Synapse Spark", color: "from-rose-500 to-purple-600", icon: Zap },
      { name: "Logic Weaver", color: "from-purple-600 to-indigo-700", icon: Wand2 },
      { name: "Deep Mind", color: "from-indigo-600 to-blue-800", icon: Eye },
      { name: "Singularity", color: "from-fuchsia-500 to-white", icon: Crown },
    ],
    palette: [
      { id: 0, hex: '#ec4899' }, { id: 1, hex: '#d946ef' }, { id: 2, hex: '#a855f7' },
      { id: 3, hex: '#8b5cf6' }, { id: 4, hex: '#6366f1' }, { id: 5, hex: '#3b82f6' },
      { id: 6, hex: '#f43f5e' }, { id: 7, hex: '#be123c' }, { id: 8, hex: '#4c1d95' },
      { id: 9, hex: '#1e1b4b' }, { id: 10, hex: '#e879f9' }, { id: 11, hex: '#c084fc' },
      { id: 12, hex: '#818cf8' }, { id: 13, hex: '#22d3ee' }, { id: 14, hex: '#fb7185' },
      { id: 15, hex: '#f472b6' }, { id: 16, hex: '#ec4899' }, { id: 17, hex: '#db2777' },
      { id: 18, hex: '#be185d' }, { id: 19, hex: '#9f1239' },
    ],
    bg: (idx) => (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
        <circle cx="20" cy="20" r="2" fill="currentColor" className="animate-pulse" />
        <circle cx="80" cy="80" r="3" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1s' }} />
        <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.2" />
        <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="0.2" />
      </svg>
    )
  },
  LIGHT: {
    id: 'LIGHT',
    label: 'Prism',
    ranks: [
      { name: "Ray Tracer", color: "from-red-500 to-orange-600", icon: Sun },
      { name: "Spectrum", color: "from-yellow-500 to-green-600", icon: Wand2 },
      { name: "Refractor", color: "from-green-500 to-teal-600", icon: Grid },
      { name: "Laser Focus", color: "from-blue-600 to-indigo-700", icon: Zap },
      { name: "Photon Master", color: "from-violet-500 to-fuchsia-500", icon: Sparkles },
    ],
    palette: [
      { id: 0, hex: '#ff0000' }, { id: 1, hex: '#00ff00' }, { id: 2, hex: '#0000ff' },
      { id: 3, hex: '#ffff00' }, { id: 4, hex: '#ff00ff' }, { id: 5, hex: '#00ffff' },
      { id: 6, hex: '#ff8800' }, { id: 7, hex: '#8800ff' }, { id: 8, hex: '#00ff88' },
      { id: 9, hex: '#ff0088' }, { id: 10, hex: '#88ff00' }, { id: 11, hex: '#0088ff' },
      { id: 12, hex: '#ffffff' }, { id: 13, hex: '#aaaaaa' }, { id: 14, hex: '#444444' },
      { id: 15, hex: '#ff4444' }, { id: 16, hex: '#44ff44' }, { id: 17, hex: '#4444ff' },
      { id: 18, hex: '#ffff44' }, { id: 19, hex: '#ff44ff' },
    ],
    bg: (idx) => (
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
        <rect x="40" y="-50" width="20" height="200" fill="white" opacity="0.1" className="animate-spin-slow" />
        <style>{`.animate-spin-slow { animation: spin 20s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </svg>
    )
  },
  ZEN: {
    id: 'ZEN',
    label: 'Zen Garden',
    ranks: [
      { name: "Seeker", color: "from-emerald-500 to-green-600", icon: Leaf },
      { name: "Wanderer", color: "from-teal-500 to-cyan-600", icon: ArrowRight },
      { name: "Gardener", color: "from-rose-500 to-pink-600", icon: Grid },
      { name: "Sage", color: "from-violet-500 to-purple-600", icon: Eye },
      { name: "Enlightened", color: "from-amber-400 to-orange-500", icon: Sun },
    ],
    palette: [
      { id: 0, hex: '#f472b6' }, { id: 1, hex: '#22c55e' }, { id: 2, hex: '#06b6d4' },
      { id: 3, hex: '#f97316' }, { id: 4, hex: '#a855f7' }, { id: 5, hex: '#ef4444' },
      { id: 6, hex: '#84cc16' }, { id: 7, hex: '#0ea5e9' }, { id: 8, hex: '#eab308' },
      { id: 9, hex: '#6366f1' }, { id: 10, hex: '#d946ef' }, { id: 11, hex: '#14b8a6' },
      { id: 12, hex: '#f43f5e' }, { id: 13, hex: '#d97706' }, { id: 14, hex: '#3b82f6' },
      { id: 15, hex: '#ec4899' }, { id: 16, hex: '#10b981' }, { id: 17, hex: '#0891b2' },
      { id: 18, hex: '#ea580c' }, { id: 19, hex: '#9333ea' },
    ],
    bg: (idx) => (
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-ripple" />
        <style>{`.animate-ripple { animation: ripple 6s infinite linear; opacity: 0; } @keyframes ripple { 0% { r: 0; opacity: 0.8; } 100% { r: 40; opacity: 0; } }`}</style>
      </svg>
    )
  }
};

/**
 * Color-blind symbols using numbers 1-40 for better clarity and scalability.
 * Numbers are used instead of symbols for easier recognition, especially on mega grids.
 */
export const COLOR_BLIND_SYMBOLS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
];
