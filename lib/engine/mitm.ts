import { choice, choices,type PRNG } from "./prng";

export const T = 0;
export const L = 1;
export const R = 2;

export class Path {
  readonly steps: number[];

  constructor(steps: number[]) {
    this.steps = steps;
  }

  xys(dx = 0, dy = 1): [number, number][] {
    const result: [number, number][] = [];
    let x = 0;
    let y = 0;
    result.push([x, y]);
    for (const step of this.steps) {
      x += dx;
      y += dy;
      result.push([x, y]);
      if (step === L) {
        ;[dx, dy] = [-dy, dx];
      }
      if (step === R) {
        ;[dx, dy] = [dy, -dx];
      } else if (step === T) {
        x += dx;
        y += dy;
        result.push([x, y]);
      }
    }
    return result;
  }

  testLoop(): boolean {
    const ps = this.xys();
    const seen = new Set<string>();
    for (const [x, y] of ps) {
      seen.add(`${x},${y}`);
    }
    if (ps.length === seen.size) return true;
    const first = ps[0];
    const last = ps[ps.length - 1];
    return (
      ps.length === seen.size + 1 &&
      first[0] === last[0] &&
      first[1] === last[1]
    );
  }

  winding(): number {
    let count = 0;
    for (const s of this.steps) {
      if (s === R) count++;
      else if (s === L) count--;
    }
    return count;
  }
}

function unrotate(
  x: number,
  y: number,
  dx: number,
  dy: number,
): [number, number] {
  let rx = x;
  let ry = y;
  let rdx = dx;
  let rdy = dy;
  while (rdx !== 0 || rdy !== 1) {
    ;[rx, ry, rdx, rdy] = [-ry, rx, -rdy, rdx];
  }
  return [rx, ry];
}

function invKey(x: number, y: number, dx: number, dy: number): string {
  return `${x},${y},${dx},${dy}`;
}

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

interface MitmEntry {
  steps: number[]
  x: number
  y: number
  dx: number
  dy: number
}

export class Mitm {
  private readonly lrPrice: number;
  private readonly tPrice: number;
  private inv: Map<string, number[][]>;
  private list: MitmEntry[];

  constructor(lrPrice: number, tPrice: number) {
    this.lrPrice = lrPrice;
    this.tPrice = tPrice;
    this.inv = new Map();
    this.list = [];
  }

  prepare(budget: number): void {
    this.list = [];
    this.inv = new Map();
    this.collectGoodPaths(0, 0, 0, 1, budget, new Set(), []);
  }

  private collectGoodPaths(
    x: number,
    y: number,
    dx: number,
    dy: number,
    budget: number,
    seen: Set<string>,
    prefix: number[],
  ): void {
    if (budget >= 0) {
      const steps = [...prefix];
      this.list.push({ steps, x, y, dx, dy });
      const ik = invKey(x, y, dx, dy);
      let bucket = this.inv.get(ik);
      if (!bucket) {
        bucket = [];
        this.inv.set(ik, bucket);
      }
      bucket.push(steps);
    }
    if (budget <= 0) return;

    const pk = posKey(x, y);
    seen.add(pk);
    const x1 = x + dx;
    const y1 = y + dy;
    const pk1 = posKey(x1, y1);

    if (!seen.has(pk1)) {
      prefix.push(L);
      this.collectGoodPaths(x1, y1, -dy, dx, budget - this.lrPrice, seen, prefix);
      prefix.pop();

      prefix.push(R);
      this.collectGoodPaths(x1, y1, dy, -dx, budget - this.lrPrice, seen, prefix);
      prefix.pop();

      seen.add(pk1);
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      if (!seen.has(posKey(x2, y2))) {
        prefix.push(T);
        this.collectGoodPaths(x2, y2, dx, dy, budget - this.tPrice, seen, prefix);
        prefix.pop();
      }
      seen.delete(pk1);
    }
    seen.delete(pk);
  }

  private lookup(
    dx: number,
    dy: number,
    xn: number,
    yn: number,
    dxn: number,
    dyn: number,
  ): number[][] {
    const [xt, yt] = unrotate(xn, yn, dx, dy);
    const [dxt, dyt] = unrotate(dxn, dyn, dx, dy);
    return this.inv.get(invKey(xt, yt, dxt, dyt)) ?? [];
  }

  randPath2(
    xn: number,
    yn: number,
    dxn: number,
    dyn: number,
    random: PRNG,
  ): Path {
    const seen = new Set<string>();
    const path: number[] = [];
    const steps = [L, R, T] as const;
    const weights = [
      1 / this.lrPrice,
      1 / this.lrPrice,
      2 / this.tPrice,
    ];
    const maxIter = 2 * (Math.abs(xn) + Math.abs(yn));

    for (;;) {
      seen.clear();
      path.length = 0;
      let x = 0;
      let y = 0;
      let dx = 0;
      let dy = 1;
      seen.add(posKey(x, y));

      let broke = false;
      for (let i = 0; i < maxIter; i++) {
        const step = choices(steps, weights, random);
        path.push(step);
        x += dx;
        y += dy;
        if (seen.has(posKey(x, y))) {
          broke = true;
          break;
        }
        seen.add(posKey(x, y));

        if (step === L) {
          ;[dx, dy] = [-dy, dx];
        }
        if (step === R) {
          ;[dx, dy] = [dy, -dx];
        } else if (step === T) {
          x += dx;
          y += dy;
          if (seen.has(posKey(x, y))) {
            broke = true;
            break;
          }
          seen.add(posKey(x, y));
        }

        if (x === xn && y === yn) {
          return new Path([...path]);
        }
        const ends = this.lookup(dx, dy, xn - x, yn - y, dxn, dyn);
        if (ends.length > 0) {
          return new Path([...path, ...choice(ends, random)]);
        }
      }
      if (broke) continue;
    }
  }

  randLoop(clock: number, random: PRNG): Path {
    for (;;) {
      const entry = choice(this.list, random);
      const path2s = this.lookup(entry.dx, entry.dy, -entry.x, -entry.y, 0, 1);
      if (path2s.length > 0) {
        const path2 = choice(path2s, random);
        const joined = new Path([...entry.steps, ...path2]);
        if (clock && joined.winding() !== clock * 4) {
          continue;
        }
        if (joined.testLoop()) {
          return joined;
        }
      }
    }
  }
}
