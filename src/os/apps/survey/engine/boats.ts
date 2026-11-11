/**
 * Little boats pottering about on the sea: rowing dinghies, sailing boats in company colours,
 * and tugs. They drift slowly, bob on the swell, and turn away before they run aground. They
 * keep to the sea (never the lakes), and flying into one counts as a crash.
 */
import { groundHeight, isWater, N, SEA, type Terrain } from './terrain';

export type BoatKind = 'dinghy' | 'sail' | 'tug';
export const BOAT_KINDS: readonly BoatKind[] = ['dinghy', 'sail', 'tug'];

export interface Boat {
  kind: BoatKind;
  x: number;
  z: number;
  /** Direction of travel, radians clockwise from north. */
  heading: number;
  speed: number;
  /** How hard it is turning just now, radians per second. */
  turn: number;
  /** Where it is in its bob, so the fleet does not bob in step. */
  phase: number;
}

/** How wide and tall each kind is, for hitting it. */
export const BOAT_SIZE: Record<BoatKind, { r: number; top: number }> = {
  dinghy: { r: 0.25, top: 0.12 },
  sail: { r: 0.32, top: 0.7 },
  tug: { r: 0.4, top: 0.34 },
};

const CRUISE: Record<BoatKind, number> = { dinghy: 0.15, sail: 0.35, tug: 0.25 };

const wrap = (n: number) => ((n % N) + N) % N;

/** Open sea at a point: a sea tile, not a lake. */
export function openSea(t: Terrain, x: number, z: number): boolean {
  return isWater(t, Math.floor(x), Math.floor(z)) && groundHeight(t, x, z) <= SEA + 1e-4;
}

/** Open sea all round a point, out to `r` tiles. */
function roomy(t: Terrain, x: number, z: number, r: number): boolean {
  for (let a = 0; a < 8; a++) if (!openSea(t, x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r)) return false;
  return openSea(t, x, z);
}

/** Scatters a few boats over the sea: roughly one for every hundred sea tiles, at most ten. */
export function placeBoats(t: Terrain, rand: () => number): Boat[] {
  let sea = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (openSea(t, i + 0.5, j + 0.5)) sea++;
  const want = Math.min(10, Math.round(sea / 100));
  const boats: Boat[] = [];
  for (let tries = 0; boats.length < want && tries < 500; tries++) {
    const x = rand() * N;
    const z = rand() * N;
    if (!roomy(t, x, z, 1.2)) continue;
    if (boats.some((b) => Math.hypot(b.x - x, b.z - z) < 4)) continue;
    const kind = BOAT_KINDS[Math.floor(rand() * BOAT_KINDS.length)]!;
    boats.push({ kind, x, z, heading: rand() * Math.PI * 2, speed: CRUISE[kind], turn: 0, phase: rand() * Math.PI * 2 });
  }
  return boats;
}

/** Moves the boats on by `dt` seconds. */
export function stepBoats(boats: Boat[], t: Terrain, dt: number): void {
  for (const b of boats) {
    // Look ahead; if land is coming, swing round and slow down until the way is clear.
    const ahead = 0.9;
    const clear = openSea(t, b.x + Math.sin(b.heading) * ahead, b.z + Math.cos(b.heading) * ahead);
    if (!clear) {
      if (Math.abs(b.turn) < 0.6) b.turn = Math.random() < 0.5 ? -1.2 : 1.2;
      b.speed = Math.max(0.03, b.speed - dt * 0.3);
    } else {
      // A gentle wander, now and then.
      if (Math.random() < dt * 0.15) b.turn = (Math.random() - 0.5) * 0.5;
      b.speed = Math.min(CRUISE[b.kind], b.speed + dt * 0.1);
    }
    b.heading += b.turn * dt;
    const nx = b.x + Math.sin(b.heading) * b.speed * dt;
    const nz = b.z + Math.cos(b.heading) * b.speed * dt;
    if (openSea(t, nx, nz)) {
      b.x = wrap(nx);
      b.z = wrap(nz);
    }
  }
}

/** How high a boat rides just now. */
export const bob = (b: Boat, time: number) => SEA + 0.015 * Math.sin(time * 1.8 + b.phase);
