import { Grid, UnionFind } from "./grid";
import { type Mitm } from "./mitm";
import { type PRNG, randRange } from "./prng";

const LOOP_TRIES = 1000;

function hasLoops(grid: Grid, uf: UnionFind): boolean {
  const groups = new Set<number>();
  let ends = 0;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      groups.add(uf.find(y * grid.w + x));
      const cell = grid.get(x, y);
      if (cell === "v" || cell === "^" || cell === "<" || cell === ">") {
        ends++;
      }
    }
  }
  return ends !== 2 * groups.size;
}

function hasPair(
  tg: Grid,
  uf: UnionFind,
): boolean {
  for (let y = 0; y < tg.h; y++) {
    for (let x = 0; x < tg.w; x++) {
      for (const [ddx, ddy] of [[1, 0], [0, 1]] as const) {
        const x1 = x + ddx;
        const y1 = y + ddy;
        if (x1 < tg.w && y1 < tg.h) {
          if (
            tg.get(x, y) === "x" &&
            tg.get(x1, y1) === "x" &&
            uf.find(y * tg.w + x) === uf.find(y1 * tg.w + x1)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function hasTripple(
  tg: Grid,
  uf: UnionFind,
): boolean {
  for (let y = 0; y < tg.h; y++) {
    for (let x = 0; x < tg.w; x++) {
      const r = uf.find(y * tg.w + x);
      let nbs = 0;
      for (const [ddx, ddy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
        const x1 = x + ddx;
        const y1 = y + ddy;
        if (x1 >= 0 && x1 < tg.w && y1 >= 0 && y1 < tg.h && uf.find(y1 * tg.w + x1) === r) {
          nbs++;
        }
      }
      if (nbs >= 3) return true;
    }
  }
  return false;
}

interface MakeOpts {
  min: number
  max: number
  random: PRNG
  onProgress?: (attempts: number) => void
  maxAttempts?: number
}

export function make(
  w: number,
  h: number,
  mitm: Mitm,
  opts: MakeOpts,
): Grid | null {
  const { min: minNumbers, max: maxNumbers, random, onProgress, maxAttempts } = opts;

  function testReady(grid: Grid): boolean {
    const sg = grid.shrink();
    const [stg, uf] = sg.makeTubes();
    const xCount = stg.countX();
    const emptyCount = stg.countEmpty();
    const numbers = Math.floor(xCount / 2);

    // Basic structural checks
    if (
      numbers < minNumbers ||
      numbers > maxNumbers ||
      hasLoops(sg, uf) ||
      hasPair(stg, uf) ||
      hasTripple(stg, uf)
    ) {
      return false;
    }

    // Density check: avoid puzzles with too many empty cells
    const totalCells = sg.w * sg.h;
    const filledRatio = (totalCells - emptyCount) / totalCells;
    if (filledRatio < 0.85) return false;

    return true;
  }

  const grid = new Grid(2 * w + 1, 2 * h + 1);
  let attempts = 0;

  for (; ;) {
    if (maxAttempts && attempts >= maxAttempts) return null;
    grid.clear();
    attempts++;
    if (onProgress && attempts % 10 === 0) {
      onProgress(attempts);
    }

    const path = mitm.randPath2(h, h, 0, -1, random);
    if (!grid.testPath(path, 0, 0)) continue;
    grid.drawPath(path, 0, 0);
    grid.set(0, 0, "\\");
    grid.set(0, 2 * h, "/");

    const path2 = mitm.randPath2(h, h, 0, -1, random);
    if (!grid.testPath(path2, 2 * w, 2 * h, 0, -1)) continue;
    grid.drawPath(path2, 2 * w, 2 * h, 0, -1);
    grid.set(2 * w, 0, "/");
    grid.set(2 * w, 2 * h, "\\");

    if (testReady(grid)) {
      return grid.shrink();
    }

    const [tg] = grid.makeTubes();

    let finished = false;
    for (let tries = 0; tries < LOOP_TRIES; tries++) {
      const lx = 2 * randRange(w, random);
      const ly = 2 * randRange(h, random);

      const cell = tg.get(lx, ly);
      if (cell !== "-" && cell !== "|") continue;

      const loopPath = mitm.randLoop(cell === "-" ? 1 : -1, random);
      if (grid.testPath(loopPath, lx, ly)) {
        grid.clearPath(loopPath, lx, ly);
        grid.drawPath(loopPath, lx, ly, 0, 1, true);

        const [newTg] = grid.makeTubes();
        // Replace tube grid data for subsequent iterations
        for (let ty = 0; ty < tg.h; ty++) {
          for (let tx = 0; tx < tg.w; tx++) {
            tg.set(tx, ty, newTg.get(tx, ty));
          }
        }

        const sg = grid.shrink();
        const [stg] = sg.makeTubes();
        const xCount = stg.countX();
        const numbers = Math.floor(xCount / 2);
        if (numbers > maxNumbers) break;

        if (testReady(grid)) {
          finished = true;
          break;
        }
      }
    }

    if (finished) {
      return grid.shrink();
    }
  }
}
