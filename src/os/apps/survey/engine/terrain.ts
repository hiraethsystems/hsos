/**
 * The estate: a 64 by 64 tile landscape that wraps round at the edges. Every new game makes a
 * new one from a random seed: lowlands and rolling hills, mountain ridges, the sea, lakes in
 * the hills, woods, and three landing pads. Heights live on the tile corners (vertices).
 */
import { MATERIALS, shade } from './materials';

export const N = 64;
export const SEA = 0;
export const PAD_SIZE = 3;
export const PAD_NAMES = ['Pad A', 'Pad B', 'Pad C'] as const;

/** Height bands for the ground's materials (sand at the shore, snow on the peaks). */
export const BANDS = { sand: 0.22, grass: 2.2, rock: 3.7 };

const wrap = (n: number) => ((n % N) + N) % N;
const idx = (i: number, j: number) => wrap(i) + wrap(j) * N;

/** Repeatable pseudo random value for a lattice point. */
function hash(i: number, j: number, seed: number): number {
  let h = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise, 0 to 1, that repeats every N tiles. `cell` must divide N. */
function noise(x: number, z: number, cell: number, seed: number): number {
  const period = N / cell;
  const gx = x / cell;
  const gz = z / cell;
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const s = (t: number) => t * t * (3 - 2 * t);
  const fx = s(gx - i);
  const fz = s(gz - j);
  const at = (a: number, b: number) => hash(((a % period) + period) % period, ((b % period) + period) % period, seed);
  const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
  const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
  return top + (bottom - top) * fz;
}

/** A small seeded random number source, for placing things. */
function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Tree {
  x: number;
  z: number;
  /** Ground height at the trunk. */
  y: number;
  height: number;
}

export interface Pad {
  name: string;
  i: number;
  j: number;
}

export interface Terrain {
  seed: number;
  /** Vertex heights, index i + j * N. */
  heights: Float32Array;
  /** For each tile, 1 if it is water (sea or lake). */
  water: Uint8Array;
  /** For each tile, 0 or the pad number plus one. */
  pads: Uint8Array;
  padList: Pad[];
  /** Trees by tile, at most one per tile. */
  trees: (Tree | null)[];
  /** The minimap: one palette slot per tile. */
  mini: Uint8Array;
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function buildTerrain(seed: number): Terrain {
  const rand = rng(seed);
  const heights = new Float32Array(N * N);

  // 1. Land: broad lowlands and hills, then mountain ridges where a slow mask allows them.
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const base = noise(i, j, 32, seed) * 2.6 + noise(i, j, 16, seed + 1) * 2.2 + noise(i, j, 8, seed + 2) * 1.0 + noise(i, j, 4, seed + 3) * 0.45;
      const ridge = 1 - Math.abs(noise(i, j, 16, seed + 4) * 2 - 1);
      const mask = Math.max(0, noise(i, j, 32, seed + 5) * 1.8 - 0.75);
      // Stretched so lowlands sink into sea and hills stand up, then ridges on top.
      heights[idx(i, j)] = (base - 3.1) * 1.35 + ridge * ridge * mask * 5;
    }
  }

  // 2. Lakes: bowls carved into the hills, filled to a level of their own.
  const lakeLevel = new Float32Array(N * N).fill(Number.NaN);
  const lakes = 3 + Math.floor(rand() * 3);
  for (let k = 0, tries = 0; k < lakes && tries < 200; tries++) {
    const ci = Math.floor(rand() * N);
    const cj = Math.floor(rand() * N);
    const h = heights[idx(ci, cj)]!;
    if (h < 0.7) continue;
    k++;
    const r = 2.5 + rand() * 3;
    const level = h - 0.25;
    const R = Math.ceil(r) + 1;
    for (let dj = -R; dj <= R; dj++) {
      for (let di = -R; di <= R; di++) {
        const d = Math.hypot(di, dj) / r;
        if (d >= 1.25) continue;
        const v = idx(ci + di, cj + dj);
        const bowl = level - 0.7 * (1 - d) + Math.max(0, d - 0.8) * 1.2;
        heights[v] = Math.min(heights[v]!, bowl);
        if (d < 1) lakeLevel[v] = level;
      }
    }
  }

  // 3. Water: sea at level 0; lake vertices below their level become the lake's flat surface.
  for (let v = 0; v < N * N; v++) {
    const level = lakeLevel[v]!;
    if (!Number.isNaN(level) && heights[v]! < level) heights[v] = level;
    if (heights[v]! < SEA) heights[v] = SEA;
  }
  const water = new Uint8Array(N * N);
  const vertex = (i: number, j: number) => heights[idx(i, j)]!;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const hs = [vertex(i, j), vertex(i + 1, j), vertex(i, j + 1), vertex(i + 1, j + 1)];
      const flat = Math.max(...hs) - Math.min(...hs) < 1e-4;
      const sea = hs.every((h) => h <= SEA);
      const lake = flat && !Number.isNaN(lakeLevel[idx(i, j)]!) && Math.abs(hs[0]! - lakeLevel[idx(i, j)]!) < 1e-4;
      if (sea || lake) water[idx(i, j)] = 1;
    }
  }

  // 4. Pads: on dry, fairly gentle ground, well apart from each other.
  const pads = new Uint8Array(N * N);
  const padList: Pad[] = [];
  const apart = (i: number, j: number) =>
    padList.every((p) => {
      const di = Math.abs(wrap(i - p.i + N / 2) - N / 2);
      const dj = Math.abs(wrap(j - p.j + N / 2) - N / 2);
      return Math.hypot(di, dj) >= 16;
    });
  for (let tries = 0; padList.length < PAD_NAMES.length && tries < 2000; tries++) {
    const i = Math.floor(rand() * N);
    const j = Math.floor(rand() * N);
    let wet = 0;
    let sum = 0;
    for (let dj = -1; dj <= PAD_SIZE; dj++) for (let di = -1; di <= PAD_SIZE; di++) {
      wet += water[idx(i + di, j + dj)]!;
      sum += vertex(i + di, j + dj);
    }
    const avg = sum / (PAD_SIZE + 2) ** 2;
    const relaxed = tries > 1500;
    if ((wet > 0 || avg < 0.4 || avg > 2.4) && !relaxed) continue;
    if (!apart(i, j) && !relaxed) continue;
    // Flatten the pad and blend a ring around it into the land.
    const level = Math.max(0.6, avg);
    for (let dj = -2; dj <= PAD_SIZE + 2; dj++) {
      for (let di = -2; di <= PAD_SIZE + 2; di++) {
        const v = idx(i + di, j + dj);
        const inside = di >= 0 && di <= PAD_SIZE && dj >= 0 && dj <= PAD_SIZE;
        const ring = Math.max(-di, -dj, di - PAD_SIZE, dj - PAD_SIZE, 0);
        heights[v] = inside ? level : heights[v]! + (level - heights[v]!) * (ring === 1 ? 0.6 : 0.25);
      }
    }
    for (let dj = -1; dj <= PAD_SIZE; dj++) for (let di = -1; di <= PAD_SIZE; di++) water[idx(i + di, j + dj)] = 0;
    for (let dj = 0; dj < PAD_SIZE; dj++) for (let di = 0; di < PAD_SIZE; di++) pads[idx(i + di, j + dj)] = padList.length + 1;
    padList.push({ name: PAD_NAMES[padList.length]!, i, j });
  }

  // 5. Woods: trees on grass, in clumps where a forest mask is high. None on or by the pads.
  const trees: (Tree | null)[] = new Array(N * N).fill(null);
  const nearPad = (i: number, j: number) => {
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (pads[idx(i + di, j + dj)]) return true;
    return false;
  };
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const t = idx(i, j);
      if (water[t] || nearPad(i, j)) continue;
      const hs = [vertex(i, j), vertex(i + 1, j), vertex(i, j + 1), vertex(i + 1, j + 1)];
      const avg = (hs[0]! + hs[1]! + hs[2]! + hs[3]!) / 4;
      if (avg < BANDS.sand + 0.1 || avg > BANDS.grass) continue;
      const forest = noise(i, j, 8, seed + 6) * 0.7 + noise(i, j, 4, seed + 7) * 0.3;
      if (rand() > (forest - 0.45) * 2.2) continue;
      const x = i + 0.3 + rand() * 0.4;
      const z = j + 0.3 + rand() * 0.4;
      trees[t] = { x, z, y: 0, height: 0.55 + rand() * 0.45 };
    }
  }

  const terrain: Terrain = { seed, heights, water, pads, padList, trees, mini: new Uint8Array(N * N) };
  for (const tree of trees) if (tree) tree.y = groundHeight(terrain, tree.x, tree.z);

  // 6. The minimap: each tile's material in its middle shade.
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const t = idx(i, j);
      let slot: number;
      if (pads[t]) slot = MATERIALS.pad[1]!;
      else if (water[t]) slot = MATERIALS.sea[heights[t]! > SEA ? 5 : 3]!;
      else if (trees[t]) slot = MATERIALS.grass[0]!;
      else slot = shade(materialFor((vertex(i, j) + vertex(i + 1, j) + vertex(i, j + 1) + vertex(i + 1, j + 1)) / 4), 0.6);
      terrain.mini[t] = slot;
    }
  }
  return terrain;
}

/** The ground material for an average tile height. */
export function materialFor(avg: number): readonly number[] {
  return avg < BANDS.sand ? MATERIALS.sand : avg < BANDS.grass ? MATERIALS.grass : avg < BANDS.rock ? MATERIALS.rock : MATERIALS.snow;
}

export const vertex = (t: Terrain, i: number, j: number) => t.heights[idx(i, j)]!;
export const padAt = (t: Terrain, i: number, j: number) => t.pads[idx(i, j)]!;
export const treeAt = (t: Terrain, i: number, j: number) => t.trees[idx(i, j)] ?? null;
export const isWater = (t: Terrain, i: number, j: number) => t.water[idx(i, j)] === 1;

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
