/**
 * Draws the estate. The camera always faces north and follows the ship from behind and above,
 * so the land scrolls beneath it. Tiles are drawn far to near (the painter's method); the
 * ship and its shadow are drawn in among them at the ship's row, so hills in front of it hide
 * it as they should. Everything lands in the indexed framebuffer as palette slots.
 */
import { MATERIALS, shade } from './materials';
import type { Frame } from './raster';
import { groundHeight, isSea, N, padAt, vertex } from './terrain';
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

/** Draw distance in tiles ahead of the camera, and the view's focal length (per pixel row). */
const DEPTH = 30;
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

export function render(f: Frame, w: World, cam: Camera): void {
  const W = f.w;
  const H = f.h;
  const focal = H * 1.15;
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
  const j1 = Math.floor(cam.z + DEPTH);
  const t = w.terrain;

  for (let j = j1; j >= j0; j--) {
    // How far away this row's ground roughly is, to know how wide it spreads on screen.
    const rowDepth = Math.max(1, (j - cam.z) * cp + cam.y * sp);
    const half = Math.ceil(rowDepth * (W / focal) * 0.62) + 3;
    const i0 = Math.floor(cam.x) - half;
    const i1 = Math.floor(cam.x) + half;
    for (let i = i0; i <= i1; i++) {
      const h00 = vertex(t, i, j);
      const h10 = vertex(t, i + 1, j);
      const h01 = vertex(t, i, j + 1);
      const h11 = vertex(t, i + 1, j + 1);
      const a: V3 = [i, h00, j];
      const b: V3 = [i + 1, h10, j];
      const c: V3 = [i, h01, j + 1];
      const d: V3 = [i + 1, h11, j + 1];
      const parity = (i + j) & 1;
      if (isSea(t, i, j)) {
        const slot = MATERIALS.sea[3 + parity]!;
        tri(a, b, d, slot);
        tri(a, d, c, slot);
        continue;
      }
      if (padAt(t, i, j)) {
        const slot = MATERIALS.pad[parity]!;
        tri(a, b, d, slot);
        tri(a, d, c, slot);
        continue;
      }
      const avg = (h00 + h10 + h01 + h11) / 4;
      const mat = avg < 0.22 ? MATERIALS.sand : avg < 1.9 ? MATERIALS.grass : avg < 2.9 ? MATERIALS.rock : MATERIALS.snow;
      // Two triangles, split the same way as groundHeight, each lit by its own slope.
      tri(a, b, d, shade(mat, lit(cross(sub(d, a), sub(b, a))), parity));
      tri(a, d, c, shade(mat, lit(cross(sub(c, a), sub(d, a))), parity));
    }
    if (j === shipRow) drawShip(sx, sz);
  }
  if (shipRow < j0 || shipRow > j1) drawShip(sx, sz);

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
}
