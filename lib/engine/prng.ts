export type PRNG = () => number

export function createPRNG(seed?: number): PRNG {
  let s = seed ?? (Math.random() * 2 ** 32) >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function choice<T>(arr: readonly T[], random: PRNG): T {
  return arr[Math.floor(random() * arr.length)];
}

export function choices<T>(
  arr: readonly T[],
  weights: readonly number[],
  random: PRNG,
): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

export function randRange(n: number, random: PRNG): number {
  return Math.floor(random() * n);
}
