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

/** The most vertices a lake may cover. */
const MAX_LAKE = 140;

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

  // 2. Hollows: bowls pressed into level hilltops and valley floors, so most estates have
  // somewhere for lakes to form.
  // They only lower the ground. How much water each one holds is decided in step 3.
  const hollows = 3 + Math.floor(rand() * 3);
  for (let k = 0, tries = 0; k < hollows && tries < 400; tries++) {
    const ci = Math.floor(rand() * N);
    const cj = Math.floor(rand() * N);
    const h = heights[idx(ci, cj)]!;
    if (h < 0.7) continue;
    const r = 3.5 + rand() * 3;
    // Only where the ground is fairly level across the hollow, or it would just drain downhill.
    let low = Infinity;
    let high = -Infinity;
    for (let a = 0; a < 16; a++) {
      const rim = heights[idx(Math.round(ci + Math.cos(a * 0.3927) * r), Math.round(cj + Math.sin(a * 0.3927) * r))]!;
      low = Math.min(low, rim);
      high = Math.max(high, rim);
    }
    if (high - low > 0.5 || low < h - 0.25) continue;
    k++;
    const R = Math.ceil(r) + 1;
    for (let dj = -R; dj <= R; dj++) {
      for (let di = -R; di <= R; di++) {
        const d = Math.hypot(di, dj) / r;
        if (d >= 1) continue;
        const v = idx(ci + di, cj + dj);
        heights[v] = Math.min(heights[v]!, h - 0.9 * (1 - d * d));
      }
    }
  }

  // 3. Water settles where it really would. A priority flood from the sea finds, for every
  // vertex, the lowest level water there could reach before spilling out to the sea: its
  // spill level. Anywhere the ground is below its spill level is a basin, and a basin that is
  // big and deep enough becomes a lake, flat at the height of its lowest rim. This first look
  // works on a copy, only to keep the pads clear of water; the real filling comes after them.
  const plan = heights.slice();
  const planned = fillLakes(plan, null);
  for (let v = 0; v < N * N; v++) if (plan[v]! < SEA) plan[v] = SEA;
  const planWater = markWater(plan, planned);
  const vertex = (i: number, j: number) => heights[idx(i, j)]!;

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
    for (let dj = -3; dj <= PAD_SIZE + 2; dj++) for (let di = -3; di <= PAD_SIZE + 2; di++) wet += planWater[idx(i + di, j + dj)]!;
    for (let dj = -1; dj <= PAD_SIZE; dj++) for (let di = -1; di <= PAD_SIZE; di++) sum += vertex(i + di, j + dj);
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
    for (let dj = 0; dj < PAD_SIZE; dj++) for (let di = 0; di < PAD_SIZE; di++) pads[idx(i + di, j + dj)] = padList.length + 1;
    padList.push({ name: PAD_NAMES[padList.length]!, i, j });
  }

  // Now the water settles on the finished ground. A basin that would cover a pad stays dry.
  const padVertex = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (pads[idx(i, j)]) {
    padVertex[idx(i, j)] = padVertex[idx(i + 1, j)] = padVertex[idx(i, j + 1)] = padVertex[idx(i + 1, j + 1)] = 1;
  }
  const lakeLevel = fillLakes(heights, padVertex);
  for (let v = 0; v < N * N; v++) if (heights[v]! < SEA) heights[v] = SEA;
  const water = markWater(heights, lakeLevel);
  for (let t = 0; t < N * N; t++) if (pads[t]) water[t] = 0;
  // A speck of sea-level water cut off from the rest is a damp, sandy dip, not a pond.
  const checked = new Uint8Array(N * N);
  for (let t = 0; t < N * N; t++) {
    if (checked[t] || !water[t]) continue;
    const patch = [t];
    checked[t] = 1;
    for (let k = 0; k < patch.length; k++) {
      const i = patch[k]! % N;
      const j = (patch[k]! - i) / N;
      for (const u of [idx(i + 1, j), idx(i - 1, j), idx(i, j + 1), idx(i, j - 1)]) {
        if (checked[u] || !water[u]) continue;
        checked[u] = 1;
        patch.push(u);
      }
    }
    if (patch.length <= 3 && Number.isNaN(lakeLevel[t]!)) for (const u of patch) water[u] = 0;
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

/**
 * Fills every basin big and deep enough to count as a lake, flat at its spill level, and returns
 * each vertex's lake level (NaN where there is no lake). Basins touching `keepDry` are left alone.
 */
function fillLakes(heights: Float32Array, keepDry: Uint8Array | null): Float32Array {
  const level = findSpillLevels(heights);
  const lakeLevel = new Float32Array(N * N).fill(Number.NaN);
  const seen = new Uint8Array(N * N);
  for (let v = 0; v < N * N; v++) {
    if (seen[v] || level[v]! - heights[v]! < 1e-4) continue;
    // Gather this basin: neighbouring vertices below the same spill level.
    const basin = [v];
    seen[v] = 1;
    let deepest = 0;
    for (let k = 0; k < basin.length; k++) {
      const u = basin[k]!;
      deepest = Math.max(deepest, level[u]! - heights[u]!);
      forNeighbours(u, (w) => {
        if (seen[w] || level[w]! - heights[w]! < 1e-4 || Math.abs(level[w]! - level[v]!) > 1e-4) return;
        seen[w] = 1;
        basin.push(w);
      });
    }
    // Puddles stay as dry dips rather than specks of water, and a basin big enough to swallow a
    // valley is taken to be drained by a river we do not draw.
    if (basin.length < 6 || basin.length > MAX_LAKE || deepest < 0.12 || (keepDry && basin.some((u) => keepDry[u]))) continue;
    for (const u of basin) {
      heights[u] = level[v]!;
      lakeLevel[u] = level[v]!;
    }
  }
  return lakeLevel;
}

/** Calls `fn` with each of a vertex's eight neighbours, wrapping round the edges. */
function forNeighbours(v: number, fn: (w: number) => void): void {
  const i = v % N;
  const j = (v - i) / N;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (di || dj) fn(idx(i + di, j + dj));
}

/**
 * For each vertex, the lowest water level it could hold without spilling to the sea. Water
 * drains towards ground below sea level by the lowest route. With no such ground at all, the
 * lowest point of the estate stands in for the sea.
 */
function findSpillLevels(heights: Float32Array): Float32Array {
  const level = new Float32Array(N * N);
  const done = new Uint8Array(N * N);
  // Everything below sea level is open water at sea level, so it is where draining starts.
  let seaPatch: number[] = [];
  for (let v = 0; v < N * N; v++) if (heights[v]! <= SEA) seaPatch.push(v);
  // A small binary heap of [level, vertex], lowest level first.
  const heap: [number, number][] = [];
  const push = (h: number, v: number) => {
    heap.push([h, v]);
    for (let c = heap.length - 1; c > 0; ) {
      const p = (c - 1) >> 1;
      if (heap[p]![0] <= heap[c]![0]) break;
      [heap[p], heap[c]] = [heap[c]!, heap[p]!];
      c = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let p = 0; ; ) {
        const l = p * 2 + 1;
        const r = l + 1;
        let m = p;
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
        if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r;
        if (m === p) break;
        [heap[p], heap[m]] = [heap[m]!, heap[p]!];
        p = m;
      }
    }
    return top;
  };
  for (const v of seaPatch) {
    done[v] = 1;
    level[v] = heights[v]!;
    push(heights[v]!, v);
  }
  while (heap.length) {
    const [h, v] = pop();
    forNeighbours(v, (w) => {
      if (done[w]) return;
      done[w] = 1;
      level[w] = Math.max(heights[w]!, h);
      push(level[w]!, w);
    });
  }
  return level;
}

/** Water tiles: the sea (every corner at sea level) or a lake (every corner on its surface). */
function markWater(heights: Float32Array, lakeLevel: Float32Array): Uint8Array {
  const water = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const corners = [idx(i, j), idx(i + 1, j), idx(i, j + 1), idx(i + 1, j + 1)];
      const hs = corners.map((v) => heights[v]!);
      const sea = hs.every((h) => h <= SEA);
      // Rim corners sitting exactly at the lake's level count as shore, so the lake fills its bowl.
      const lake = corners.find((v) => !Number.isNaN(lakeLevel[v]!));
      const surface = lake === undefined ? Number.NaN : lakeLevel[lake]!;
      const onLake = lake !== undefined && hs.every((h) => Math.abs(h - surface) < 1e-4);
      if (sea || onLake) water[idx(i, j)] = 1;
    }
  }
  return water;
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
