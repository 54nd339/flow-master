import { deflateSync, inflateSync } from "fflate";

export interface Point {
  x: number;
  y: number;
}

export interface Endpoint {
  x: number;
  y: number;
  label: string;
  flowId: string;
}

export interface SolutionPath {
  flowId: string;
  points: Point[];
}

const FORMAT_VERSION = 1;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export class PuzzleData {
  constructor(
    public width: number,
    public height: number,
    public endpoints: Endpoint[],
    public solution: SolutionPath[],
    public generatedAt: number,
    public seed?: number,
    public blockedCells?: Point[],
  ) { }

  /**
   * Serialize this PuzzleData to a base64url string.
   */
  serialize(): string {
    const json = JSON.stringify({
      v: FORMAT_VERSION,
      w: this.width,
      h: this.height,
      ep: this.endpoints.map((e) => [e.x, e.y, e.label, e.flowId]),
      sol: this.solution.map((s) => ({
        f: s.flowId,
        p: s.points.map((pt) => [pt.x, pt.y]),
      })),
      s: this.seed,
      t: this.generatedAt,
    });
    const compressed = deflateSync(new TextEncoder().encode(json));
    return toBase64Url(compressed);
  }

  /**
   * Deserialize a base64url string into a PuzzleData instance.
   */
  static deserialize(s: string): PuzzleData | null {
    try {
      const compressed = fromBase64Url(s);
      const json = new TextDecoder().decode(inflateSync(compressed));
      const data = JSON.parse(json);
      if (data.v !== FORMAT_VERSION) return null;
      return new PuzzleData(
        data.w,
        data.h,
        data.ep.map((e: [number, number, string, string]) => ({
          x: e[0],
          y: e[1],
          label: e[2],
          flowId: e[3],
        })),
        data.sol.map((s: { f: string; p: [number, number][] }) => ({
          flowId: s.f,
          points: s.p.map((pt) => ({ x: pt[0], y: pt[1] })),
        })),
        data.t,
        data.s,
      );
    } catch {
      return null;
    }
  }
}

export type GameActionType = "draw" | "erase" | "complete";

export interface GameAction {
  type: GameActionType;
  flowId: string;
  path: Point[];
}

export type StarRating = 1 | 2 | 3;

export interface GameState {
  moveHistory: GameAction[];
  redoStack: GameAction[];
  currentFlows: Map<string, Point[]>;
  activeFlowId: string | null;
  totalCells: number;
  timerSeconds: number;
  timerRunning: boolean;
  isComplete: boolean;
  moveCount: number;
  pipePercent: number;
  starRating: StarRating | null;
  completedAt: number | null;
}

export interface GameActions {
  initPuzzle: (puzzle: PuzzleData) => void;
  pushAction: (action: GameAction, puzzle: PuzzleData) => void;
  undo: () => void;
  redo: () => void;
  clearFlow: (flowId: string) => void;
  setActiveFlow: (flowId: string | null) => void;
  startTimer: () => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tick: () => void;
  reset: () => void;
}

export type GameStore = GameState & GameActions;
