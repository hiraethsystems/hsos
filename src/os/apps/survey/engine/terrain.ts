/**
 * The estate: a 64 by 64 tile landscape that wraps round at the edges, so the survey never
 * ends. Heights live on the tile corners (vertices). Anything at or below sea level is sea.
 * Built once from fixed noise, so every employee surveys the same estate.
 */
export const N = 64;
export const SEA = 0;

/** Landing pads, as the tile in their bottom left corner. Each is 3 by 3 tiles. */
export const PADS = [
  { name: 'Pad A', i: 0, j: 0 },
  { name: 'Pad B', i: 22, j: 38 },
  { name: 'Pad C', i: 44, j: 14 },
] as const;
export const PAD_SIZE = 3;

const wrap = (n: number) => ((n % N) + N) % N;

/** Repeatable pseudo random value for a lattice point. */
function hash(i: number, j: number, seed: number): number {
  let h = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise that repeats every N tiles. */
function noise(x: number, z: number, cell: number, seed: number): number {
  const period = N / cell;
  const gx = x / cell;
  const gz = z / cell;
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const s = (t: number) => t * t * (3 - 2 * t);
  const at = (a: number, b: number) => hash(((a % period) + period) % period, ((b % period) + period) % period, seed);
  const top = at(i, j) + (at(i + 1, j) - at(i, j)) * s(fx);
  const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * s(fx);
  return top + (bottom - top) * s(fz);
}

export interface Terrain {
  /** Vertex heights, index i + j * N. */
  heights: Float32Array;
  /** For each tile, 0 or the pad number plus one. */
  pads: Uint8Array;
}

export function buildTerrain(seed = 1987): Terrain {
  const heights = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const h = noise(i, j, 16, seed) * 3.4 + noise(i, j, 8, seed + 1) * 1.5 + noise(i, j, 4, seed + 2) * 0.6 - 2.1;
      heights[i + j * N] = Math.max(SEA, h);
    }
  }
  const pads = new Uint8Array(N * N);
  PADS.forEach((p, k) => {
    // Flatten the pad and blend a ring around it, so it sits in the land.
    let sum = 0;
    for (let dj = 0; dj <= PAD_SIZE; dj++) for (let di = 0; di <= PAD_SIZE; di++) sum += heights[wrap(p.i + di) + wrap(p.j + dj) * N]!;
    const level = Math.max(0.6, sum / (PAD_SIZE + 1) ** 2);
    for (let dj = -2; dj <= PAD_SIZE + 2; dj++) {
      for (let di = -2; di <= PAD_SIZE + 2; di++) {
        const v = wrap(p.i + di) + wrap(p.j + dj) * N;
        const inside = di >= 0 && di <= PAD_SIZE && dj >= 0 && dj <= PAD_SIZE;
        const ring = Math.max(-di, -dj, di - PAD_SIZE, dj - PAD_SIZE, 0);
        heights[v] = inside ? level : heights[v]! + (level - heights[v]!) * (ring === 1 ? 0.6 : 0.25);
      }
    }
    for (let dj = 0; dj < PAD_SIZE; dj++) for (let di = 0; di < PAD_SIZE; di++) pads[wrap(p.i + di) + wrap(p.j + dj) * N] = k + 1;
  });
  return { heights, pads };
}

export const vertex = (t: Terrain, i: number, j: number) => t.heights[wrap(i) + wrap(j) * N]!;
export const padAt = (t: Terrain, i: number, j: number) => t.pads[wrap(i) + wrap(j) * N]!;

/**
 * Ground height under any point. Each tile is two triangles split from its (0,0) corner to its
 * (1,1) corner, the same way the renderer draws it, so what you see is what you land on.
 */
export function groundHeight(t: Terrain, x: number, z: number): number {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const h00 = vertex(t, i, j);
  const h10 = vertex(t, i + 1, j);
  const h01 = vertex(t, i, j + 1);
  const h11 = vertex(t, i + 1, j + 1);
  return fx > fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz;
}

/** How uneven a tile is: the difference between its highest and lowest corner. */
export function tileRoughness(t: Terrain, i: number, j: number): number {
  const hs = [vertex(t, i, j), vertex(t, i + 1, j), vertex(t, i, j + 1), vertex(t, i + 1, j + 1)];
  return Math.max(...hs) - Math.min(...hs);
}

export const isSea = (t: Terrain, i: number, j: number) =>
  vertex(t, i, j) <= SEA && vertex(t, i + 1, j) <= SEA && vertex(t, i, j + 1) <= SEA && vertex(t, i + 1, j + 1) <= SEA;
