import type { Path } from "./mitm";

function sign(x: number): number {
  if (x === 0) return 0;
  return x < 0 ? -1 : 1;
}

/**
 * UnionFind optimized with Int32Array.
 */
export class UnionFind {
  private parent: Int32Array;

  constructor(size: number) {
    this.parent = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      this.parent[i] = i;
    }
  }

  union(a: number, b: number): void {
    const aRoot = this.find(a);
    const bRoot = this.find(b);
    if (aRoot !== bRoot) {
      this.parent[aRoot] = bRoot;
    }
  }

  find(a: number): number {
    if (this.parent[a] === a) return a;
    return (this.parent[a] = this.find(this.parent[a]));
  }
}

const CHAR_CODE: Record<string, number> = {
  " ": 0,
  "x": 1,
  "\\": 2,
  "/": 3,
  "v": 4,
  "^": 5,
  "<": 6,
  ">": 7,
  "-": 8,
  "|": 9,
  "┌": 10,
  "┐": 11,
  "└": 12,
  "┘": 13,
};

const CODE_TO_CHAR: string[] = [" ", "x", "\\", "/", "v", "^", "<", ">", "-", "|", "┌", "┐", "└", "┘"];

const SHAPE_MAP: Record<string, string> = {
  "1,1,1": "<",
  "-1,-1,-1": "<",
  "1,1,-1": ">",
  "-1,-1,1": ">",
  "-1,1,1": "v",
  "1,-1,-1": "v",
  "-1,1,-1": "^",
  "1,-1,1": "^",
  "0,2,0": "\\",
  "0,-2,0": "\\",
  "2,0,0": "/",
  "-2,0,0": "/",
};

const UNION_DIRS: Record<string, [number, number][]> = {
  "/-": [[0, 1]],
  "\\-": [[1, 0], [0, 1]],
  "/|": [[1, 0]],
  " -": [[1, 0]],
  " |": [[0, 1]],
  "v|": [[0, 1]],
  ">|": [[1, 0]],
  "v-": [[0, 1]],
  ">-": [[1, 0]],
};

const TUBE_CHAR: Record<string, string> = {
  "/-": "┐",
  "\\-": "┌",
  "/|": "└",
  "\\|": "┘",
  " -": "-",
  " |": "|",
};

export class Grid {
  readonly w: number;
  readonly h: number;
  private data: Uint8Array;

  constructor(w: number, h: number, data?: Uint8Array) {
    this.w = w;
    this.h = h;
    this.data = data || new Uint8Array(w * h);
  }

  set(x: number, y: number, val: string): void {
    const code = CHAR_CODE[val] ?? 0;
    this.data[y * this.w + x] = code;
  }

  get(x: number, y: number): string {
    const code = this.data[y * this.w + x];
    return CODE_TO_CHAR[code] ?? " ";
  }

  has(x: number, y: number): boolean {
    return this.data[y * this.w + x] !== 0;
  }

  delete(x: number, y: number): void {
    this.data[y * this.w + x] = 0;
  }

  clear(): void {
    this.data.fill(0);
  }

  *values(): Generator<string> {
    for (let i = 0; i < this.data.length; i++) {
      yield CODE_TO_CHAR[this.data[i]];
    }
  }

  *entries(): Generator<[number, number, string]> {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const code = this.data[y * this.w + x];
        if (code !== 0) {
          yield [x, y, CODE_TO_CHAR[code]];
        }
      }
    }
  }

  countEmpty(): number {
    let count = 0;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] === 0) count++;
    }
    return count;
  }

  countX(): number {
    let count = 0;
    const xCode = CHAR_CODE["x"];
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] === xCode) count++;
    }
    return count;
  }

  shrink(): Grid {
    const sw = Math.floor(this.w / 2);
    const sh = Math.floor(this.h / 2);
    const small = new Grid(sw, sh);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        small.set(x, y, this.get(2 * x + 1, 2 * y + 1));
      }
    }
    return small;
  }

  testPath(
    path: Path,
    x0: number,
    y0: number,
    dx0 = 0,
    dy0 = 1,
  ): boolean {
    for (const [px, py] of path.xys(dx0, dy0)) {
      const gx = x0 - px + py;
      const gy = y0 + px + py;
      if (gx < 0 || gx >= this.w || gy < 0 || gy >= this.h || this.has(gx, gy)) {
        return false;
      }
    }
    return true;
  }

  drawPath(
    path: Path,
    x0: number,
    y0: number,
    dx0 = 0,
    dy0 = 1,
    loop = false,
  ): void {
    const ps = path.xys(dx0, dy0);
    if (loop) {
      ps.push(ps[1]);
    }
    for (let i = 1; i < ps.length - 1; i++) {
      const [xp, yp] = ps[i - 1];
      const [x, y] = ps[i];
      const [xn, yn] = ps[i + 1];
      const dx = xn - xp;
      const dy = yn - yp;
      const cross = (x - xp) * (yn - y) - (xn - x) * (y - yp);
      const s = sign(cross);
      const char = SHAPE_MAP[`${dx},${dy},${s}`];
      if (char) {
        this.set(x0 - x + y, y0 + x + y, char);
      }
    }
  }

  makeTubes(): [Grid, UnionFind] {
    const uf = new UnionFind(this.w * this.h);
    const tubeGrid = new Grid(this.w, this.h);
    for (let x = 0; x < this.w; x++) {
      let d = "-";
      for (let y = 0; y < this.h; y++) {
        const cell = this.get(x, y);
        const lookup = cell + d;
        const dirs = UNION_DIRS[lookup];
        if (dirs) {
          for (const [ddx, ddy] of dirs) {
            const nx = x + ddx;
            const ny = y + ddy;
            if (nx >= 0 && nx < this.w && ny >= 0 && ny < this.h) {
              uf.union(y * this.w + x, ny * this.w + nx);
            }
          }
        }
        tubeGrid.set(x, y, TUBE_CHAR[lookup] ?? "x");
        if (cell === "\\" || cell === "/" || cell === "v" || cell === "^") {
          d = d === "-" ? "|" : "-";
        }
      }
    }
    return [tubeGrid, uf];
  }

  clearPath(path: Path, x: number, y: number): void {
    const pathGrid = new Grid(this.w, this.h);
    pathGrid.drawPath(path, x, y, 0, 1, true);
    const [tubeGrid] = pathGrid.makeTubes();
    for (const [tx, ty, val] of tubeGrid.entries()) {
      if (val === "|") {
        this.delete(tx, ty);
      }
    }
  }
}
