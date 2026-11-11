/**
 * Draws the estate. The camera always faces north and follows the ship from behind and above,
 * so the land scrolls beneath it. Tiles are drawn far to near (the painter's method); the
 * ship and its shadow are drawn in among them at the ship's row, so hills in front of it hide
 * it as they should. Everything lands in the indexed framebuffer as palette slots.
 */
import { MATERIALS, shade } from './materials';
import type { Frame } from './raster';
import { bob, type Boat, type BoatKind } from './boats';
import { groundHeight, isWater, materialFor, N, padAt, PAD_SIZE, SEA, treeAt, vertex } from './terrain';
import { FOOT, upAxis, type World } from './world';

type V3 = [number, number, number];

/** Light from the upper left, a little behind the viewer. */
const LIGHT: V3 = (() => {
  const v: V3 = [-0.55, 0.75, -0.35];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const m = Math.hypot(...a) || 1;
  return [a[0] / m, a[1] / m, a[2] / m];
};
/** Light falling on a face with this normal, 0 to 1. */
const lit = (n: V3) => 0.15 + 0.85 * Math.max(0, dot(norm(n), LIGHT));

/** The ship: a flat arrowhead with a raised spine. Local axes: x right, y up, z nose. */
const SHIP_V: V3[] = [
  [0, 0.03, 0.55], // 0 nose
  [-0.42, 0, -0.32], // 1 left wing
  [0.42, 0, -0.32], // 2 right wing
  [0, 0.2, -0.16], // 3 spine
  [0, -0.1, -0.12], // 4 keel
  [0, 0.06, -0.3], // 5 tail
];
/** Faces, with which colour set they use. */
const SHIP_F: { v: [number, number, number]; trim: boolean }[] = [
  { v: [0, 1, 3], trim: false },
  { v: [0, 3, 2], trim: false },
  { v: [1, 5, 3], trim: true },
  { v: [3, 5, 2], trim: true },
  { v: [0, 4, 1], trim: false },
  { v: [0, 2, 4], trim: false },
  { v: [1, 4, 5], trim: true },
  { v: [5, 4, 2], trim: true },
];
const SHIP_MID: V3 = [0, 0.02, -0.08];

/** One face of a model: three or four corners, a material, and the middle of its part. */
interface Face {
  pts: V3[];
  mat: readonly number[];
  /** The middle of the part it belongs to, so its outside can be told from its inside. */
  c: V3;
  /** Thin things (sails, masts) are seen from both sides. */
  two?: boolean;
}

/** A boat hull: pointed bow, square stern, open deck. Local axes: x right, y up, z bow. */
function hull(L: number, B: number, D: number, side: readonly number[], deck: readonly number[]): Face[] {
  const c: V3 = [0, D / 2, 0];
  const bow: V3 = [0, D * 1.25, L / 2];
  const p1: V3 = [-B, D, 0];
  const s1: V3 = [B, D, 0];
  const p2: V3 = [-B * 0.85, D, -L / 2];
  const s2: V3 = [B * 0.85, D, -L / 2];
  const wb: V3 = [0, 0, L * 0.43];
  const wp1: V3 = [-B * 0.8, 0, 0];
  const ws1: V3 = [B * 0.8, 0, 0];
  const wp2: V3 = [-B * 0.7, 0, -L * 0.47];
  const ws2: V3 = [B * 0.7, 0, -L * 0.47];
  return [
    { pts: [bow, p1, wp1, wb], mat: side, c },
    { pts: [bow, wb, ws1, s1], mat: side, c },
    { pts: [p1, p2, wp2, wp1], mat: side, c },
    { pts: [s1, ws1, ws2, s2], mat: side, c },
    { pts: [p2, s2, ws2, wp2], mat: side, c },
    { pts: [bow, s1, p1], mat: deck, c: [0, 0, 0] },
    { pts: [p1, s1, s2, p2], mat: deck, c: [0, 0, 0] },
  ];
}

/** A box with no bottom. */
function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: readonly number[]): Face[] {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  return [
    { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], mat, c },
    { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], mat, c },
    { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], mat, c },
    { pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], mat, c },
    { pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], mat, c },
  ];
}

/** A thin upright pole, as two crossed planes. */
function pole(x: number, z: number, y0: number, y1: number, r: number, mat: readonly number[]): Face[] {
  const c: V3 = [x, (y0 + y1) / 2, z];
  return [
    { pts: [[x - r, y0, z], [x + r, y0, z], [x + r, y1, z], [x - r, y1, z]], mat, c, two: true },
    { pts: [[x, y0, z - r], [x, y0, z + r], [x, y1, z + r], [x, y1, z - r]], mat, c, two: true },
  ];
}

const BOAT_MODELS: Record<BoatKind, Face[]> = {
  // A rowing dinghy with someone from Accounts at the oars.
  dinghy: [
    ...hull(0.46, 0.12, 0.06, MATERIALS.wood, MATERIALS.wood),
    ...box(-0.035, 0.035, 0.06, 0.15, -0.04, 0.02, MATERIALS.sail),
    { pts: [[-0.2, 0.07, -0.02], [0.2, 0.07, -0.02], [0.2, 0.07, 0.02], [-0.2, 0.07, 0.02]], mat: MATERIALS.wood, c: [0, 0, 0], two: true },
  ],
  // A sailing boat flying company red.
  sail: [
    ...hull(0.7, 0.14, 0.07, MATERIALS.canvas, MATERIALS.wood),
    ...pole(0, 0.06, 0.07, 0.69, 0.012, MATERIALS.wood),
    { pts: [[0.01, 0.67, 0.05], [0.01, 0.15, 0.05], [0.11, 0.15, -0.3]], mat: MATERIALS.sail, c: [0, 0.3, 0], two: true },
    { pts: [[0.01, 0.57, 0.08], [0.01, 0.12, 0.34], [0.07, 0.12, 0.1]], mat: MATERIALS.canvas, c: [0, 0.3, 0], two: true },
  ],
  // A tug: red hull, white wheelhouse, yellow funnel with a black top.
  tug: [
    ...hull(0.8, 0.18, 0.09, MATERIALS.sail, MATERIALS.tarmac),
    ...box(-0.11, 0.11, 0.09, 0.24, -0.1, 0.14, MATERIALS.canvas),
    ...box(-0.045, 0.045, 0.09, 0.29, -0.25, -0.15, MATERIALS.funnel),
    ...box(-0.045, 0.045, 0.29, 0.34, -0.25, -0.15, [MATERIALS.shadow, MATERIALS.hull[0]!]),
  ],
};

/**
 * Landing pad markings, in pad coordinates (u east, v north, 0 to PAD_SIZE): yellow and black
 * hazard stripes round the edge and the pad's letter painted large in the middle.
 */
interface Mark {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  slot: number;
}
const LETTERS = [
  ['.#.', '#.#', '###', '#.#', '#.#'],
  ['##.', '#.#', '##.', '#.#', '##.'],
  ['.##', '#..', '#..', '#..', '.##'],
];
const PAD_MARKS: Mark[][] = LETTERS.map((rows) => {
  const marks: Mark[] = [];
  const P = PAD_SIZE;
  const bw = 0.2;
  const seg = P / 8;
  for (let k = 0; k < 8; k++) {
    const slot = MATERIALS.hazard[k & 1]!;
    marks.push({ u0: k * seg, v0: 0, u1: (k + 1) * seg, v1: bw, slot });
    marks.push({ u0: k * seg, v0: P - bw, u1: (k + 1) * seg, v1: P, slot: MATERIALS.hazard[(k + 1) & 1]! });
    marks.push({ u0: 0, v0: k * seg, u1: bw, v1: (k + 1) * seg, slot });
    marks.push({ u0: P - bw, v0: k * seg, u1: P, v1: (k + 1) * seg, slot: MATERIALS.hazard[(k + 1) & 1]! });
  }
  const cell = 0.3;
  const left = P / 2 - cell * 1.5;
  const top = P / 2 + cell * 2.5;
  rows.forEach((row, r) => {
    for (let k = 0; k < 3; k++) {
      if (row[k] !== '#') continue;
      marks.push({ u0: left + k * cell, v0: top - (r + 1) * cell, u1: left + (k + 1) * cell, v1: top - r * cell, slot: MATERIALS.marking[1]! });
    }
  });
  return marks;
});
/** Lamps at the pad's corners, in pad coordinates. */
const PAD_LAMPS: [number, number][] = [
  [0.1, 0.1],
  [PAD_SIZE - 0.1, 0.1],
  [0.1, PAD_SIZE - 0.1],
  [PAD_SIZE - 0.1, PAD_SIZE - 0.1],
];

/**
 * Draw distance in tiles ahead of the camera. It is further than the estate is wide, so far off
 * you see the land repeat, which is true: the estate wraps round.
 */
const DEPTH = 96;
/** Single tiles out to this far ahead, then 2 by 2 blocks out to MEDIUM, then 4 by 4. */
const FINE = 32;
const MEDIUM = 60;
const NEAR = 0.4;

export interface Camera {
  x: number;
  y: number;
  z: number;
  /** Looking down by this many radians. */
  pitch: number;
}

/** Where the camera wants to be for the ship; the game eases towards it. */
export function cameraFor(w: World): Camera {
  const s = w.ship;
  const ground = groundHeight(w.terrain, s.x, s.z);
  // Behind and above the ship, pulling back as it climbs, and aimed between the ship and its
  // shadow so both stay in view at any height.
  const alt = Math.min(20, Math.max(0, s.y - ground));
  const back = 7 + alt * 0.3;
  const up = 3.6 + alt * 0.3;
  const toShip = Math.atan2(up, back);
  const toShadow = Math.atan2(up + alt, back);
  return { x: s.x, y: s.y + up, z: s.z - back, pitch: (toShip + toShadow) / 2 - 0.1 };
}

/** The shortest way round the wrapping estate, from `from` to `to`. */
const near = (to: number, from: number) => to + Math.round((from - to) / N) * N;

export interface RenderOptions {
  /** Things may blink (the pad lamps). Off under reduced motion. */
  blink: boolean;
}

export function render(f: Frame, w: World, cam: Camera, opts: RenderOptions = { blink: true }): void {
  const W = f.w;
  const H = f.h;
  // The narrower side sets the field of view, so tall phone screens see more land, not less.
  const focal = Math.min(H, W * 0.8) * 1.15;
  const horizon = H * 0.18;
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);

  // Project a world point. Returns null when it is too close to (or behind) the camera.
  const px = new Float64Array(2);
  const project = (x: number, y: number, z: number): boolean => {
    const dx = x - cam.x;
    const dy = y - cam.y;
    const dz = z - cam.z;
    const depth = dz * cp - dy * sp;
    if (depth < NEAR) return false;
    const up = dy * cp + dz * sp;
    px[0] = W / 2 + (focal * dx) / depth;
    px[1] = horizon + H * 0.32 - (focal * up) / depth;
    return true;
  };
  const tri = (a: V3, b: V3, c: V3, slot: number) => {
    if (!project(...a)) return;
    const [ax, ay] = px;
    if (!project(...b)) return;
    const [bx, by] = px;
    if (!project(...c)) return;
    f.tri(ax!, ay!, bx!, by!, px[0]!, px[1]!, slot);
  };

  // Sky: the HSOS sunset in stepped bands, reaching down to where the land runs out, so the
  // edge of the estate meets the sunset rather than a gap.
  const farEdge = project(cam.x, 0.8, cam.z + DEPTH) ? px[1]! : horizon;
  f.bands(MATERIALS.sky, Math.max(1, Math.ceil(Math.max(horizon, farEdge + 2) / MATERIALS.sky.length)), MATERIALS.night);

  const s = w.ship;
  const sx = near(s.x, cam.x);
  const sz = near(s.z, cam.z);
  const shipRow = Math.floor(sz);
  // Looking down, rows a little behind the camera can still be in view.
  const j0 = Math.floor(cam.z) - 6;
  const four = (n: number) => Math.floor(n / 4) * 4;
  const j1 = four(cam.z + DEPTH) + 4;
  const t = w.terrain;

  // Boats, filed by the row they sit in, so each is drawn in among the land like the trees.
  const boatRows = new Map<number, Boat[]>();
  for (const b of w.boats) {
    const row = Math.floor(near(b.z, cam.z));
    boatRows.set(row, [...(boatRows.get(row) ?? []), b]);
  }

  // Far land is drawn in bigger blocks: single tiles close by, 2 by 2 further out, 4 by 4 at
  // the far end. The block edges are multiples of 4, so blocks always line up with each other.
  const b1 = four(cam.z + FINE);
  const b2 = four(cam.z + MEDIUM);
  for (let top = j1; top > j0; ) {
    const step = top > b2 ? 4 : top > b1 ? 2 : 1;
    const j = top - step;
    top = j;
    // How far away this row's ground roughly is, to know how wide it spreads on screen.
    const rowDepth = Math.max(1, (j + step - cam.z) * cp + cam.y * sp);
    const half = Math.ceil(rowDepth * (W / focal) * 0.62) + 3 + step;
    const i0 = Math.floor((Math.floor(cam.x) - half) / step) * step;
    const i1 = Math.floor(cam.x) + half;
    for (let i = i0; i <= i1; i += step) {
      const h00 = vertex(t, i, j);
      const h10 = vertex(t, i + step, j);
      const h01 = vertex(t, i, j + step);
      const h11 = vertex(t, i + step, j + step);
      const a: V3 = [i, h00, j];
      const b: V3 = [i + step, h10, j];
      const c: V3 = [i, h01, j + step];
      const d: V3 = [i + step, h11, j + step];
      const parity = ((i + j) / step) & 1;
      // A block takes its character from the tile in its middle.
      const mi = i + (step >> 1);
      const mj = j + (step >> 1);
      if (isWater(t, mi, mj)) {
        // Lakes sit higher and read a little lighter than the sea.
        const level = vertex(t, mi, mj);
        const slot = MATERIALS.sea[(level > SEA ? 4 : 3) + parity]!;
        const flat = (v: V3): V3 => [v[0], level, v[2]];
        tri(flat(a), flat(b), flat(d), slot);
        tri(flat(a), flat(d), flat(c), slot);
        continue;
      }
      const pad = padAt(t, mi, mj);
      if (pad && step === 1) {
        drawPadTile(pad - 1, i, j, h00, parity);
        continue;
      }
      if (pad) {
        const slot = MATERIALS.tarmac[1 + parity]!;
        tri(a, b, d, slot);
        tri(a, d, c, slot);
        continue;
      }
      const avg = (h00 + h10 + h01 + h11) / 4;
      const mat = materialFor(avg);
      // Two triangles, split the same way as groundHeight, each lit by its own slope.
      tri(a, b, d, shade(mat, lit(cross(sub(d, a), sub(b, a))), parity));
      tri(a, d, c, shade(mat, lit(cross(sub(c, a), sub(d, a))), parity));
    }
    // What stands on these rows goes in after their ground and before the nearer rows.
    for (let r = j + step - 1; r >= j; r--) {
      if (step < 4) {
        for (let i = i0; i <= i1 + step; i++) {
          const tree = treeAt(t, i, r);
          if (tree) drawTree(i + (tree.x - Math.floor(tree.x)), tree.y, r + (tree.z - Math.floor(tree.z)), tree.height);
          const pad = padAt(t, i, r);
          if (pad) drawPadLamps(pad - 1, i, r, vertex(t, i, r));
        }
      }
      for (const b of boatRows.get(r) ?? []) drawBoat(b);
      if (r === shipRow) drawShip(sx, sz);
    }
  }
  if (shipRow < j0 || shipRow > j1) drawShip(sx, sz);

  /** A pad tile: tarmac, then whichever of the pad's markings fall on this tile. */
  function drawPadTile(k: number, i: number, j: number, h: number, parity: number) {
    const p = t.padList[k]!;
    const du = (((i - p.i) % N) + N) % N;
    const dv = (((j - p.j) % N) + N) % N;
    const slot = MATERIALS.tarmac[1 + parity]!;
    tri([i, h, j], [i + 1, h, j], [i + 1, h, j + 1], slot);
    tri([i, h, j], [i + 1, h, j + 1], [i, h, j + 1], slot);
    for (const m of PAD_MARKS[k % PAD_MARKS.length]!) {
      const u0 = Math.max(m.u0, du);
      const u1 = Math.min(m.u1, du + 1);
      const v0 = Math.max(m.v0, dv);
      const v1 = Math.min(m.v1, dv + 1);
      if (u1 <= u0 || v1 <= v0) continue;
      const x0 = i + u0 - du;
      const x1 = i + u1 - du;
      const z0 = j + v0 - dv;
      const z1 = j + v1 - dv;
      tri([x0, h, z0], [x1, h, z0], [x1, h, z1], m.slot);
      tri([x0, h, z0], [x1, h, z1], [x0, h, z1], m.slot);
    }
  }

  /** The pad's corner lamps that stand on this tile: a short post with a green light on top. */
  function drawPadLamps(k: number, i: number, j: number, h: number) {
    const p = t.padList[k]!;
    const du = (((i - p.i) % N) + N) % N;
    const dv = (((j - p.j) % N) + N) % N;
    for (const [u, v] of PAD_LAMPS) {
      if (Math.floor(u) !== du || Math.floor(v) !== dv) continue;
      const x = i + u - du;
      const z = j + v - dv;
      const post = MATERIALS.hull[0]!;
      tri([x - 0.02, h, z], [x + 0.02, h, z], [x + 0.02, h + 0.12, z], post);
      tri([x - 0.02, h, z], [x + 0.02, h + 0.12, z], [x - 0.02, h + 0.12, z], post);
      // On for most of each second and off for the rest: slow enough to be calm, never a flicker.
      const lamp = MATERIALS.lamp[!opts.blink || (w.time + k * 0.25) % 1.2 < 0.8 ? 1 : 0]!;
      tri([x - 0.045, h + 0.1, z], [x + 0.045, h + 0.1, z], [x + 0.045, h + 0.18, z], lamp);
      tri([x - 0.045, h + 0.1, z], [x + 0.045, h + 0.18, z], [x - 0.045, h + 0.18, z], lamp);
    }
  }

  /** A boat, turned to its heading and riding the swell. Faces go far to near. */
  function drawBoat(b: Boat) {
    const bx = near(b.x, cam.x);
    const bz = near(b.z, cam.z);
    const by = bob(b, w.time);
    const ch = Math.cos(b.heading);
    const sh = Math.sin(b.heading);
    const place = (v: V3): V3 => [bx + v[0] * ch + v[2] * sh, by + v[1], bz - v[0] * sh + v[2] * ch];
    const eye: V3 = [cam.x, cam.y, cam.z];
    const faces: { pts: V3[]; slot: number; depth: number }[] = [];
    for (const face of BOAT_MODELS[b.kind]) {
      const pts = face.pts.map(place);
      const c = place(face.c);
      const mid: V3 = [0, 0, 0];
      for (const q of pts) for (let k = 0; k < 3; k++) mid[k] += q[k]! / pts.length;
      let n = cross(sub(pts[1]!, pts[0]!), sub(pts[2]!, pts[0]!));
      if (dot(n, sub(mid, c)) < 0) n = [-n[0], -n[1], -n[2]];
      const toEye = sub(eye, mid);
      if (dot(n, toEye) <= 0) {
        if (!face.two) continue;
        n = [-n[0], -n[1], -n[2]];
      }
      const depth = (mid[2] - cam.z) * cp - (mid[1] - cam.y) * sp;
      faces.push({ pts, slot: shade(face.mat, lit(n)), depth });
    }
    faces.sort((m, k) => k.depth - m.depth);
    for (const f of faces) {
      tri(f.pts[0]!, f.pts[1]!, f.pts[2]!, f.slot);
      if (f.pts.length === 4) tri(f.pts[0]!, f.pts[2]!, f.pts[3]!, f.slot);
    }
  }

  /** A tree: a short trunk under a four sided canopy, lit face by face. */
  function drawTree(x: number, y: number, z: number, h: number) {
    const tw = 0.05;
    const trunkTop = y + h * 0.3;
    tri([x - tw, y, z], [x + tw, y, z], [x + tw, trunkTop, z], MATERIALS.trunk);
    tri([x - tw, y, z], [x + tw, trunkTop, z], [x - tw, trunkTop, z], MATERIALS.trunk);
    const r = 0.24;
    const apex: V3 = [x, y + h, z];
    const nw: V3 = [x - r, trunkTop, z + r];
    const ne: V3 = [x + r, trunkTop, z + r];
    const sw: V3 = [x - r, trunkTop, z - r];
    const se: V3 = [x + r, trunkTop, z - r];
    // The camera always looks north, so the north face is hidden and the south face is
    // nearest. Of the sides, the one further from the camera goes first.
    const face = (a: V3, b: V3, n: V3) => tri(a, b, apex, shade(MATERIALS.canopy, lit(n)));
    const west = () => face(sw, nw, [-1, 0.6, 0]);
    const east = () => face(ne, se, [1, 0.6, 0]);
    if (cam.x < x) {
      east();
      west();
    } else {
      west();
      east();
    }
    face(se, sw, [0, 0.6, -1]);
  }

  function drawShip(x: number, z: number) {
    const ground = groundHeight(t, x, z);
    // Shadow straight below, so you can judge your height.
    if (s.status !== 'crashed' && s.y - ground < 14) {
      const r = 0.3;
      const g = (dx: number, dz: number): V3 => [x + dx, groundHeight(t, x + dx, z + dz) + 0.02, z + dz];
      tri(g(-r, -r), g(r, -r), g(r, r), MATERIALS.shadow);
      tri(g(-r, -r), g(r, r), g(-r, r), MATERIALS.shadow);
    }
    if (s.status !== 'crashed') {
      const u = upAxis(s.tx, s.tz);
      const hd: V3 = [Math.sin(s.heading), 0, Math.cos(s.heading)];
      // Forward is the heading tipped by the tilt; right completes the frame.
      let fwd = norm(sub(hd, [u[0] * dot(hd, u), u[1] * dot(hd, u), u[2] * dot(hd, u)]));
      if (!Number.isFinite(fwd[0])) fwd = [0, 0, 1];
      const right = cross(u, fwd);
      const place = (v: V3): V3 => [
        x + v[0] * right[0] + v[1] * u[0] + v[2] * fwd[0],
        s.y + v[0] * right[1] + v[1] * u[1] + v[2] * fwd[1] - FOOT * 0.2,
        z + v[0] * right[2] + v[1] * u[2] + v[2] * fwd[2],
      ];
      const pts = SHIP_V.map(place);
      const mid = place(SHIP_MID);
      const faces = SHIP_F.map((face) => {
        const [p, q, r] = face.v.map((k) => pts[k]!) as [V3, V3, V3];
        let n = cross(sub(q, p), sub(r, p));
        const centre: V3 = [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3, (p[2] + q[2] + r[2]) / 3];
        if (dot(n, sub(centre, mid)) < 0) n = [-n[0], -n[1], -n[2]];
        const depth = (centre[2] - cam.z) * cp - (centre[1] - cam.y) * sp;
        return { p, q, r, n, depth, trim: face.trim };
      });
      faces.sort((m, k) => k.depth - m.depth);
      for (const fc of faces) tri(fc.p, fc.q, fc.r, shade(fc.trim ? MATERIALS.trim : MATERIALS.hull, lit(fc.n)));
    }
  }

  // Particles: flame from the engine, debris and spray from accidents.
  for (const p of w.particles) {
    if (!project(near(p.x, cam.x), p.y, near(p.z, cam.z))) continue;
    const age = p.life / p.max;
    const mat = p.kind === 'flame' ? MATERIALS.flame : p.kind === 'spray' ? MATERIALS.sea : MATERIALS.flame;
    const slot = mat[Math.min(mat.length - 1, Math.floor(age * mat.length))]!;
    const size = p.kind === 'flame' ? 1 : 2;
    f.dot(px[0]!, px[1]!, Math.max(1, Math.round((size * focal) / 160)), slot);
  }
  drawMinimap(f, w);
}

/**
 * The minimap, top left: the whole estate, one pixel per tile (two on big views), north up,
 * centred on the drone. The drone is a white cross, pads are yellow and boats are red specks.
 */
function drawMinimap(f: Frame, w: World): void {
  const scale = f.h >= 360 ? 2 : 1;
  const size = N * scale;
  const ox = 4;
  const oy = 4;
  const ci = Math.floor(w.ship.x);
  const cj = Math.floor(w.ship.z);
  const border = MATERIALS.shadow;
  for (let y = -1; y <= size; y++) {
    for (let x = -1; x <= size; x++) {
      const px = ox + x;
      const py = oy + y;
      if (px < 0 || py < 0 || px >= f.w || py >= f.h) continue;
      let slot = border;
      if (x >= 0 && y >= 0 && x < size && y < size) {
        // Screen rows go down, the estate's z goes north (up).
        const i = ci - N / 2 + Math.floor(x / scale);
        const j = cj + N / 2 - 1 - Math.floor(y / scale);
        slot = w.terrain.mini[(((i % N) + N) % N) + (((j % N) + N) % N) * N]!;
      }
      f.px[py * f.w + px] = slot;
    }
  }
  // Boats, as a red speck each.
  const red = MATERIALS.sail[MATERIALS.sail.length - 1]!;
  for (const b of w.boats) {
    const bx = ((Math.floor(b.x) - ci + N / 2) % N + N) % N;
    const by = ((cj + N / 2 - 1 - Math.floor(b.z)) % N + N) % N;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) f.px[(oy + by * scale + dy) * f.w + ox + bx * scale + dx] = red;
  }
  if (w.ship.status === 'crashed') return;
  const cx = ox + (N / 2) * scale + Math.floor(scale / 2);
  const cy = oy + (N / 2 - 1) * scale + Math.floor(scale / 2);
  const white = MATERIALS.hull[MATERIALS.hull.length - 1]!;
  for (let d = -2; d <= 2; d++) {
    f.px[cy * f.w + cx + d] = white;
    f.px[(cy + d) * f.w + cx] = white;
  }
}
