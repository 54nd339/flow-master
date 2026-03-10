"use client";

import { Component, type ErrorInfo, type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { toast, Toaster } from "sonner";

import { ThemeSelector } from "@/components/game/theme-selector";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { decodePuzzle } from "@/lib/serialization";
import { getGameState } from "@/stores/game-store";
import { usePuzzle } from "@/stores/puzzle-store";
import { useGameThemeId, useLeftHanded, useSetGameThemeId, useShakeToUndo } from "@/stores/settings-store";
import { useEasterEggs } from "@/hooks/use-easter-eggs";
import { useSaveData } from "@/hooks/use-save-data";
import { useWatchSolve } from "@/hooks/use-watch-solve";

const CommandPalette = dynamic(
  () => import("@/components/game/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

interface ErrorBoundaryState {
  hasError: boolean
}

class GameErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("FlowMaster crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. Your progress has been saved.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Return Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShakeToUndo() {
  const enabled = useShakeToUndo();

  useEffect(() => {
    if (!enabled || typeof DeviceMotionEvent === "undefined") return;

    let lastShake = 0;
    const THRESHOLD = 25;
    const COOLDOWN = 1000;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(
        (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2,
      );
      const now = Date.now();
      if (magnitude > THRESHOLD && now - lastShake > COOLDOWN) {
        lastShake = now;
        getGameState().undo();
        toast.info("Shake undo!", { duration: 1500 });
      }
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled]);

  return null;
}

function ClipboardPasteImport() {
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      const hashMatch = text.match(/#puzzle=(.+)/);
      if (!hashMatch) return;

      const imported = decodePuzzle(hashMatch[1]);
      if (imported) {
        e.preventDefault();
        getGameState().reset();
        getGameState().initPuzzle(imported);
        toast.success("Imported puzzle from clipboard!");
      }
    };

    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, []);

  return null;
}

function deriveMode(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return segment || "home";
}

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getRetroSnapshot(): boolean {
  try { return localStorage.getItem("flow-master-retro-unlocked") === "true"; }
  catch { return false; }
}

function getRetroServerSnapshot(): boolean {
  return false;
}

export default function GameLayout({ children }: { children: ReactNode }) {
  const leftHanded = useLeftHanded();
  const puzzle = usePuzzle();
  const saveData = useSaveData();
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const activeGameTheme = useGameThemeId();
  const setActiveGameTheme = useSetGameThemeId();
  const retroUnlocked = useSyncExternalStore(subscribeStorage, getRetroSnapshot, getRetroServerSnapshot);
  const pathname = usePathname();
  const mode = deriveMode(pathname);

  const {
    matrixCanvasRef,
    handleMatrixEasterEgg,
    handleSpeedEasterEgg,
  } = useEasterEggs(puzzle);

  const { startWatchSolve } = useWatchSolve(puzzle);

  return (
    <GameErrorBoundary>
      <KeyboardShortcuts
        onOpenCommandPalette={() => setCmdkOpen(true)}
        onWatchSolve={startWatchSolve}
      >
        <div
          data-left-handed={leftHanded || undefined}
          data-save-data={saveData || undefined}
        >
          {children}
          <ShakeToUndo />
          <ClipboardPasteImport />
          <Toaster position="bottom-right" richColors />
        </div>

        <CommandPalette
          open={cmdkOpen}
          onOpenChange={setCmdkOpen}
          onMatrixEasterEgg={handleMatrixEasterEgg}
          onSpeedEasterEgg={handleSpeedEasterEgg}
          onOpenThemes={() => { setCmdkOpen(false); setThemeOpen(true); }}
          onWatchSolve={startWatchSolve}
          mode={mode}
        />

        <ThemeSelector
          open={themeOpen}
          onClose={() => setThemeOpen(false)}
          activeThemeId={activeGameTheme}
          onSelectTheme={(id: string) => { setActiveGameTheme(id); setThemeOpen(false); }}
          retroUnlocked={retroUnlocked}
        />

        <canvas
          ref={matrixCanvasRef}
          className="pointer-events-none fixed inset-0 z-[100] hidden"
        />
      </KeyboardShortcuts>
    </GameErrorBoundary>
  );
}
