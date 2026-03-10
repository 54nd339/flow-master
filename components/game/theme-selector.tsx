"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Lock, Palette, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GAME_THEMES, type GameTheme, getVisibleThemes } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useBalance, useHasTheme, usePurchaseTheme } from "@/stores/currency-store";

interface ThemeSelectorProps {
  open: boolean
  onClose: () => void
  activeThemeId: string
  onSelectTheme: (themeId: string) => void
  retroUnlocked: boolean
}

function ThemeCard({
  theme,
  owned,
  active,
  onSelect,
  onPurchase,
  balance,
}: {
  theme: GameTheme
  owned: boolean
  active: boolean
  onSelect: () => void
  onPurchase: () => void
  balance: number
}) {
  return (
    <button
      onClick={owned ? onSelect : onPurchase}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 transition-all",
        active
          ? "border-accent bg-accent/5"
          : owned
            ? "border-border bg-background hover:bg-muted"
            : "border-border/50 bg-muted/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{theme.name}</span>
        {active && <Check className="h-4 w-4 text-accent" />}
        {!owned && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>

      {/* Color preview */}
      <div className="flex gap-1">
        {theme.colors.flows.slice(0, 8).map((color, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-full bg-[var(--flow-color)]"
            style={{ "--flow-color": color } as React.CSSProperties}
          />
        ))}
      </div>

      <div
        className="h-12 w-full rounded-lg border bg-[var(--theme-bg)] border-[var(--theme-border)]"
        style={{
          "--theme-bg": theme.colors.bg,
          "--theme-border": theme.colors.gridBorder,
        } as React.CSSProperties}
      >
        <div className="flex h-full items-center justify-center gap-1">
          {theme.colors.flows.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="h-2 w-6 rounded-full bg-[var(--flow-color)] opacity-80"
              style={{ "--flow-color": color } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {!owned && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{theme.cost} flows</span>
          <span
            className={cn(
              "font-medium",
              balance >= theme.cost ? "text-green-500" : "text-red-400",
            )}
          >
            {balance >= theme.cost ? "Buy" : "Need more"}
          </span>
        </div>
      )}
    </button>
  );
}

export function ThemeSelector({
  open,
  onClose,
  activeThemeId,
  onSelectTheme,
  retroUnlocked,
}: ThemeSelectorProps) {
  const balance = useBalance();
  const hasTheme = useHasTheme();
  const purchaseTheme = usePurchaseTheme();

  const visible = getVisibleThemes();
  const retro = GAME_THEMES.find((t) => t.id === "retro");
  const allThemes = retroUnlocked && retro ? [...visible, retro] : visible;

  const handlePurchase = (theme: GameTheme) => {
    if (hasTheme(theme.id)) {
      onSelectTheme(theme.id);
      return;
    }
    if (purchaseTheme(theme.id, theme.cost)) {
      toast.success(`Unlocked ${theme.name} theme!`);
      onSelectTheme(theme.id);
    } else {
      toast.error(`Need ${theme.cost} flows to unlock ${theme.name}`);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 mx-4 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            "data-[state=open]:animate-[modal-in_300ms_ease-out]",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <Dialog.Title className="text-lg font-semibold text-foreground">Themes</Dialog.Title>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{balance} flows</span>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </Dialog.Close>
            </div>
          </div>
          <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-4">
            {allThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                owned={hasTheme(theme.id)}
                active={activeThemeId === theme.id}
                balance={balance}
                onSelect={() => onSelectTheme(theme.id)}
                onPurchase={() => handlePurchase(theme)}
              />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
