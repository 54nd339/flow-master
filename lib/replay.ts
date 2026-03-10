import { get as idbGet, set as idbSet } from "idb-keyval";

import type { GameAction } from "@/lib/engine/types";

export interface ReplayFrame {
  t: number
  action: GameAction
}

export interface ReplayData {
  puzzleSeed: number | undefined
  gridWidth: number
  gridHeight: number
  totalTimeMs: number
  frames: ReplayFrame[]
  recordedAt: number
}

const IDB_PB_GHOST_PREFIX = "flow-master-pb-ghost-";

function replayKey(width: number, height: number, difficulty: string): string {
  return `${width}x${height}-${difficulty}`;
}

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private startTime = 0;
  private recording = false;

  start(): void {
    this.frames = [];
    this.startTime = performance.now();
    this.recording = true;
  }

  record(action: GameAction): void {
    if (!this.recording) return;
    this.frames.push({
      t: performance.now() - this.startTime,
      action,
    });
  }

  stop(): ReplayFrame[] {
    this.recording = false;
    return [...this.frames];
  }
}

export async function savePBGhost(
  width: number,
  height: number,
  difficulty: string,
  replay: ReplayData,
): Promise<void> {
  const key = replayKey(width, height, difficulty);
  const existing = await loadPBGhost(width, height, difficulty);
  if (!existing || replay.totalTimeMs < existing.totalTimeMs) {
    await idbSet(`${IDB_PB_GHOST_PREFIX}${key}`, replay);
  }
}

export async function loadPBGhost(
  width: number,
  height: number,
  difficulty: string,
): Promise<ReplayData | null> {
  const key = replayKey(width, height, difficulty);
  const data = await idbGet<ReplayData>(`${IDB_PB_GHOST_PREFIX}${key}`);
  return data ?? null;
}
