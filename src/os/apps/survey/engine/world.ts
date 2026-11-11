/**
 * The flight model. Units are tiles and seconds. The ship always thrusts along its own up
 * axis, so tilting it is how you steer: tilt a little to drift, a lot to race, and remember
 * that every bit of tilt is lift you are not getting. Gravity never takes a day off.
 *
 * Input is a tilt vector: x is east, z is north (away from the camera), length 0 to 1.
 */
import { groundHeight, isSea, N, padAt, PAD_SIZE, PADS, tileRoughness, type Terrain } from './terrain';

export const GRAVITY = 4;
export const THRUST = 10;
export const DRAG = 0.15;
export const MAX_TILT = 1.05; // radians, about 60 degrees
export const TILT_RATE = 7; // how fast the ship turns to the tilt asked for
export const FUEL_BURN = 7; // per second of thrust, out of 100
export const REFUEL = 35; // per second, on a pad
export const CEILING = 24;
/** Height of the ship's undercarriage above its centre. */
export const FOOT = 0.14;
/** A landing survives below these. */
export const SAFE = { fall: 2.4, slide: 1.8, tilt: 0.42, rough: 0.3 };
const RESPAWN_AFTER = 1.8;

export type Status = 'landed' | 'flying' | 'crashed';

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  kind: 'flame' | 'debris' | 'spray';
}

export interface Ship {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Current tilt (lags behind the input). */
  tx: number;
  tz: number;
  /** Direction the nose points, kept when the ship is level. */
  heading: number;
  fuel: number;
  thrusting: boolean;
  status: Status;
  /** Seconds since the crash, while crashed. */
  wreck: number;
  /** The pad the ship is resting on, if any. */
  pad: number | null;
}

/** Something worth telling the player. */
export type FlightEvent =
  | { type: 'landed'; pad: string | null }
  | { type: 'crashed'; cause: 'impact' | 'sea' }
  | { type: 'respawned' }
  | { type: 'refuelled' }
  | { type: 'empty' };

export interface World {
  terrain: Terrain;
  ship: Ship;
  particles: Particle[];
  time: number;
}

const home = PADS[0];
const padCentre = (k: number) => ({ x: PADS[k]!.i + PAD_SIZE / 2, z: PADS[k]!.j + PAD_SIZE / 2 });

function freshShip(t: Terrain): Ship {
  const c = padCentre(0);
  return {
    x: c.x,
    y: groundHeight(t, c.x, c.z) + FOOT,
    z: c.z,
    vx: 0,
    vy: 0,
    vz: 0,
    tx: 0,
    tz: 0,
    heading: 0,
    fuel: 100,
    thrusting: false,
    status: 'landed',
    wreck: 0,
    pad: 0,
  };
}

export function newWorld(terrain: Terrain): World {
  return { terrain, ship: freshShip(terrain), particles: [], time: 0 };
}

/** The ship's up axis for a tilt. */
export function upAxis(tx: number, tz: number): [number, number, number] {
  const m = Math.hypot(tx, tz);
  if (m < 1e-6) return [0, 1, 0];
  const a = Math.min(1, m) * MAX_TILT;
  return [(tx / m) * Math.sin(a), Math.cos(a), (tz / m) * Math.sin(a)];
}

export const tiltAngle = (s: Ship) => Math.min(1, Math.hypot(s.tx, s.tz)) * MAX_TILT;
export const altitude = (w: World) => w.ship.y - FOOT - groundHeight(w.terrain, w.ship.x, w.ship.z);
export const speed = (s: Ship) => Math.hypot(s.vx, s.vy, s.vz);

function burst(w: World, kind: Particle['kind'], n: number, power: number): void {
  const s = w.ship;
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2;
    const up = Math.random();
    const life = 0.6 + Math.random() * 1.2;
    w.particles.push({
      x: s.x,
      y: s.y,
      z: s.z,
      vx: Math.cos(a) * power * (0.3 + Math.random()),
      vy: power * (0.5 + up),
      vz: Math.sin(a) * power * (0.3 + Math.random()),
      life,
      max: life,
      kind,
    });
  }
}

/** Advance the world by `dt` seconds. `tilt` and `thrust` are the player's input. */
export function step(w: World, dt: number, tilt: { x: number; z: number }, thrust: boolean, events: FlightEvent[]): void {
  const s = w.ship;
  const t = w.terrain;
  w.time += dt;

  // Particles first, so a crash's debris keeps flying while the ship is gone.
  for (const p of w.particles) {
    p.life -= dt;
    p.vy -= GRAVITY * (p.kind === 'flame' ? 0.2 : 1) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    const g = groundHeight(t, p.x, p.z);
    if (p.y < g) {
      p.y = g;
      p.vy *= -0.3;
      p.vx *= 0.5;
      p.vz *= 0.5;
    }
  }
  w.particles = w.particles.filter((p) => p.life > 0);

  if (s.status === 'crashed') {
    s.wreck += dt;
    if (s.wreck >= RESPAWN_AFTER) {
      Object.assign(s, freshShip(t));
      events.push({ type: 'respawned' });
    }
    return;
  }

  // The ship turns towards the tilt asked for, never instantly.
  const m = Math.hypot(tilt.x, tilt.z);
  const want = m > 1 ? { x: tilt.x / m, z: tilt.z / m } : tilt;
  const k = 1 - Math.exp(-TILT_RATE * dt);
  s.tx += (want.x - s.tx) * k;
  s.tz += (want.z - s.tz) * k;
  if (Math.hypot(s.tx, s.tz) > 0.05) s.heading = Math.atan2(s.tx, s.tz);

  const hadFuel = s.fuel > 0;
  s.thrusting = thrust && s.fuel > 0;
  if (s.thrusting) s.fuel = Math.max(0, s.fuel - FUEL_BURN * dt);
  if (hadFuel && s.fuel === 0) events.push({ type: 'empty' });

  if (s.status === 'landed') {
    if (s.pad !== null && s.fuel < 100 && !thrust) {
      s.fuel = Math.min(100, s.fuel + REFUEL * dt);
      if (s.fuel === 100) events.push({ type: 'refuelled' });
    }
    // Lift off only when the thrust beats gravity.
    if (!s.thrusting || upAxis(s.tx, s.tz)[1] * THRUST <= GRAVITY) return;
    s.status = 'flying';
    s.pad = null;
  }

  const [ux, uy, uz] = upAxis(s.tx, s.tz);
  const a = s.thrusting ? THRUST : 0;
  s.vx += ux * a * dt;
  s.vy += (uy * a - GRAVITY) * dt;
  s.vz += uz * a * dt;
  const drag = 1 - DRAG * dt;
  s.vx *= drag;
  s.vy *= drag;
  s.vz *= drag;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.z += s.vz * dt;
  // Keep coordinates small; the estate repeats every N tiles anyway.
  if (s.x < 0 || s.x >= N) s.x = ((s.x % N) + N) % N;
  if (s.z < 0 || s.z >= N) s.z = ((s.z % N) + N) % N;
  if (s.y > CEILING) {
    s.y = CEILING;
    s.vy = Math.min(0, s.vy);
  }

  if (s.thrusting && Math.random() < 0.9) {
    const life = 0.25 + Math.random() * 0.2;
    w.particles.push({
      x: s.x - ux * 0.15,
      y: s.y - uy * 0.15,
      z: s.z - uz * 0.15,
      vx: s.vx - ux * 4 + (Math.random() - 0.5),
      vy: s.vy - uy * 4 + (Math.random() - 0.5),
      vz: s.vz - uz * 4 + (Math.random() - 0.5),
      life,
      max: life,
      kind: 'flame',
    });
  }

  const g = groundHeight(t, s.x, s.z);
  if (s.y - FOOT > g) return;

  // Touchdown. Gentle, level and on even ground is a landing; anything else is a write-off.
  const i = Math.floor(s.x);
  const j = Math.floor(s.z);
  if (isSea(t, i, j)) {
    crash(w, 'sea', events);
    return;
  }
  const gentle = -s.vy < SAFE.fall && Math.hypot(s.vx, s.vz) < SAFE.slide && tiltAngle(s) < SAFE.tilt && tileRoughness(t, i, j) < SAFE.rough;
  if (!gentle) {
    crash(w, 'impact', events);
    return;
  }
  const pad = padAt(t, i, j);
  s.status = 'landed';
  s.y = g + FOOT;
  s.vx = s.vy = s.vz = 0;
  s.pad = pad ? pad - 1 : null;
  events.push({ type: 'landed', pad: pad ? PADS[pad - 1]!.name : null });
}

function crash(w: World, cause: 'impact' | 'sea', events: FlightEvent[]): void {
  const s = w.ship;
  s.status = 'crashed';
  s.wreck = 0;
  s.thrusting = false;
  s.y = groundHeight(w.terrain, s.x, s.z) + 0.05;
  burst(w, cause === 'sea' ? 'spray' : 'debris', 48, cause === 'sea' ? 2.5 : 3.5);
  events.push({ type: 'crashed', cause });
}

export { home as HOME_PAD };
