"use client";

import * as Slider from "@radix-ui/react-slider";
import { Eye, EyeOff, Loader2, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Difficulty, DIFFICULTY_OPTIONS } from "@/lib/engine/level-config";
import { cn } from "@/lib/utils";

interface ControlsPanelProps {
  gridWidth: number
  gridHeight: number
  difficulty: Difficulty
  onGridSizeChange: (w: number, h: number) => void
  onDifficultyChange: (d: Difficulty) => void
  onGenerate: () => void
  onCancel: () => void
  onToggleSolution: () => void
  isGenerating: boolean
  isSolving?: boolean
  showSolution: boolean
  generationTimeMs: number
  pairCount: number
}

export function ControlsPanel({
  gridWidth,
  gridHeight,
  difficulty,
  onGridSizeChange,
  onDifficultyChange,
  onGenerate,
  onCancel,
  onToggleSolution,
  isGenerating,
  isSolving = false,
  showSolution,
  generationTimeMs,
  pairCount,
}: ControlsPanelProps) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-xl border border-border bg-background p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Grid Size
          </label>
          <span className="font-mono text-sm text-muted-foreground">
            {gridWidth} &times; {gridHeight}
          </span>
        </div>
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={[gridWidth]}
          min={5}
          max={50}
          step={1}
          onValueChange={([v]) => onGridSizeChange(v, v)}
        >
          <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
            <Slider.Range className="absolute h-full rounded-full bg-accent" />
          </Slider.Track>
          <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </Slider.Root>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Difficulty
        </label>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onDifficultyChange(value)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                difficulty === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {isGenerating ? (
          <Button onClick={onCancel} variant="destructive" size="md" className="flex-1">
            <Square className="h-4 w-4" />
            Cancel
          </Button>
        ) : (
          <Button onClick={onGenerate} variant="primary" size="md" className="flex-1">
            <Play className="h-4 w-4" />
            Generate
          </Button>
        )}
        <Button
          onClick={onToggleSolution}
          variant="outline"
          size="md"
          disabled={isSolving}
          className={cn(
            showSolution
              ? "bg-accent/10 text-accent"
              : "",
          )}
        >
          {isSolving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : showSolution ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {isSolving ? "Solving..." : "Solution"}
        </Button>
      </div>

      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </div>
      )}

      {generationTimeMs > 0 && !isGenerating && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Time</span>
            <span className="font-mono text-foreground">
              {generationTimeMs < 1000
                ? `${generationTimeMs}ms`
                : `${(generationTimeMs / 1000).toFixed(2)}s`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Grid</span>
            <span className="font-mono text-foreground">
              {gridWidth} &times; {gridHeight}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pairs</span>
            <span className="font-mono text-foreground">{pairCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Difficulty</span>
            <span className="font-mono capitalize text-foreground">{difficulty}</span>
          </div>
        </div>
      )}
    </div>
  );
}
