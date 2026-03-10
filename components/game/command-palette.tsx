"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";

import { type CommandGroup, getCommandGroups } from "@/lib/command-configs";
import { cn } from "@/lib/utils";
import { usePlayGame } from "@/hooks/use-play-game";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-muted";
const GROUP_CLASS = "px-2 py-1.5 text-xs font-medium text-muted-foreground";
const ICON_CLASS = "h-4 w-4 text-muted-foreground";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatrixEasterEgg: () => void;
  onSpeedEasterEgg: () => void;
  onOpenThemes: () => void;
  onWatchSolve?: () => void;
  mode?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  onMatrixEasterEgg,
  onSpeedEasterEgg,
  onOpenThemes,
  onWatchSolve,
  mode,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setTheme } = useTheme();
  const game = usePlayGame({ effectsEnabled: false });

  const close = () => onOpenChange(false);
  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  const fullProps = {
    open,
    onOpenChange,
    onGenerate: game.handleGenerate,
    onToggleSolution: game.toggleSolution,
    onSetGridSize: game.handleSetGridSize,
    onSetDifficulty: game.setDifficulty,
    onUndo: game.handleUndo,
    onReset: game.handleReset,
    onNextPuzzle: game.handleNextPuzzle,
    onToggleMute: game.toggleMuted,
    onToggleMinimalHud: game.toggleMinimalHud,
    onShowSeed: game.handleShowSeed,
    onMatrixEasterEgg,
    onSpeedEasterEgg,
    onSharePuzzle: game.handleSharePuzzle,
    onCopySeed: game.handleCopySeed,
    onNavigate: (path: string) => router.push(path),
    onSetTheme: setTheme,
    onToggleHighContrast: game.toggleHighContrast,
    onToggleLeftHanded: game.toggleLeftHanded,
    onToggleColorblind: game.toggleColorblind,
    onToggleReducedMotion: game.toggleReducedMotion,
    onExportSaveData: game.handleExportSaveData,
    onImportSaveData: game.handleImportSaveData,
    onHint: game.handleHint,
    onSkipPuzzle: game.handleSkipPuzzle,
    onOpenThemes,
    onWatchSolve,
    onExportProfileCard: game.handleExportProfileCard,
    onViewRanks: game.handleViewRanks,
    onPrestige: game.handlePrestige,
    canPrestige: game.canPrestige(),
    showSolution: game.showSolution,
    difficulty: game.difficulty,
    hasPuzzle: !!game.puzzle,
    muted: game.muted,
    minimalHud: game.minimalHud,
    highContrast: game.highContrast,
    leftHanded: game.leftHanded,
    colorblindMode: game.colorblindMode,
    reducedMotion: game.reducedMotion,
    currencyBalance: game.currencyBalance,
    mode,
  };

  const groups = getCommandGroups(fullProps);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-[20vh]",
        "bg-black/50 backdrop-blur-sm",
      )}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
        <Command.Input
          ref={inputRef}
          placeholder="Type a command..."
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {groups.map((group: CommandGroup, gIdx: number) => (
            <div key={group.heading}>
              <Command.Group heading={group.heading} className={GROUP_CLASS}>
                {group.items
                  .filter((item) => !item.show || item.show(fullProps))
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.value || item.label}
                      onSelect={run(() => item.onSelect(fullProps))}
                      className={ITEM_CLASS}
                    >
                      <item.icon className={ICON_CLASS} />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.badge(fullProps)}
                        </span>
                      )}
                      {item.active && item.active(fullProps) && (
                        <span className="ml-auto text-xs text-accent">Active</span>
                      )}
                    </Command.Item>
                  ))}
              </Command.Group>
              {gIdx < groups.length - 1 && (
                <Command.Separator className="my-1 h-px bg-border" />
              )}
            </div>
          ))}
        </Command.List>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>Navigate with &uarr;&darr;</span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              esc
            </kbd>{" "}
            to close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
