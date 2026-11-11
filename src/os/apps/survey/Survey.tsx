/**
 * Estate Survey (working title): free flight over the Hiraeth Systems estate. The mouse tilts
 * the ship (the further from the middle of the view, the harder it tilts) and holding the
 * button thrusts. Keyboard: arrow keys tilt, Space thrusts, Escape pauses. Touch: drag on the
 * view to tilt, hold the Thrust button.
 *
 * The game runs on its own animation frame loop rather than the shared six tick clock: flight
 * needs smooth frames. It only runs while started, focused and visible, and it starts only
 * when the player asks, so it never moves unbidden (CLAUDE.md rule 3).
 */
import type { TargetedKeyboardEvent, TargetedPointerEvent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { AppProps } from '../../types';
import { Frame } from './engine/raster';
import { cameraFor, render, type Camera } from './engine/render';
import { buildTerrain, randomSeed } from './engine/terrain';
import { altitude, newWorld, speed, step, type FlightEvent, type World } from './engine/world';

const STEP = 1 / 120;
/** Biggest frame gap simulated; longer gaps (a stall, a background tab) are skipped. */
const MAX_GAP = 0.1;
/** Target size of the picture in game pixels; the window scales it up by whole numbers. */
const BASE_W = 320;
const MAX_W = 420;
/** Touch: dragging this many CSS pixels gives full tilt. */
const TOUCH_RANGE = 70;

const newEstate = () => newWorld(buildTerrain(randomSeed()));

interface Hud {
  fuel: number;
  alt: number;
  spd: number;
  status: string;
}

const MESSAGES: Record<FlightEvent['type'], (e: FlightEvent) => string> = {
  landed: (e) => (e.type === 'landed' && e.pad ? `Landed on ${e.pad}. Refuelling at company expense.` : 'Landed. No fuel out here, only scenery.'),
  crashed: (e) =>
    e.type !== 'crashed'
      ? ''
      : e.cause === 'water'
        ? 'Lost in the water. Water is not on the asset register.'
        : e.cause === 'tree'
          ? 'Crashed into a tree. The tree has been asked to submit a statement.'
          : e.cause === 'boat'
            ? 'Hit a boat. Marine Division has opened a ticket.'
            : 'Crashed. Damage has been billed to your department.',
  respawned: () => 'A replacement drone has been issued from Pad A.',
  refuelled: () => 'Tank full. Try to bring it back this time.',
  empty: () => 'Fuel exhausted. Gravity has taken over the project.',
};

export function Survey({ clock }: AppProps) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newEstate());
  const cam = useRef<Camera>(cameraFor(world.current));
  const frame = useRef<{ f: Frame; img: ImageData; ctx: CanvasRenderingContext2D } | null>(null);
  const input = useRef({ keys: new Set<string>(), mouse: null as null | { x: number; z: number }, touch: null as null | { x0: number; y0: number; x: number; z: number; id: number }, mouseThrust: false, buttonThrust: false, kb: { x: 0, z: 0 } });
  const [phase, setPhase] = useState<'intro' | 'running' | 'paused'>('intro');
  const [hud, setHud] = useState<Hud>({ fuel: 100, alt: 0, spd: 0, status: 'On Pad A. Cleared for survey.' });
  const [size, setSize] = useState({ w: BASE_W, h: 200, scale: 2 });
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  // Fit the picture to the window: whole number scaling, as many game pixels as fit.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const scale = Math.max(1, Math.round(w / BASE_W));
      const gw = Math.min(MAX_W, Math.floor(w / scale));
      const gh = Math.max(100, Math.min(Math.round(gw * 1.6), Math.floor(h / scale)));
      setSize((s) => (s.w === gw && s.h === gh && s.scale === scale ? s : { w: gw, h: gh, scale }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A new framebuffer whenever the size changes, and one frame drawn so the view is never blank.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    frame.current = { f: new Frame(size.w, size.h), img: ctx.createImageData(size.w, size.h), ctx };
    draw();
  }, [size]);

  function draw() {
    const fr = frame.current;
    if (!fr) return;
    render(fr.f, world.current, cam.current);
    fr.f.toImage(fr.img);
    fr.ctx.putImageData(fr.img, 0, 0);
  }

  // The loop.
  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hudAt = 0;
    const events: FlightEvent[] = [];
    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const gap = Math.min(MAX_GAP, (now - last) / 1000);
      last = now;
      acc += gap;
      const inp = input.current;
      const k = inp.keys;
      // Keyboard tilt eases in while held and back to level when let go.
      const ease = (v: number, dir: number) => (dir ? Math.max(-1, Math.min(1, v + dir * 2.2 * gap)) : v * Math.exp(-5 * gap));
      inp.kb.x = ease(inp.kb.x, (k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0));
      inp.kb.z = ease(inp.kb.z, (k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0));
      const keyTilt = k.has('ArrowRight') || k.has('ArrowLeft') || k.has('ArrowUp') || k.has('ArrowDown') || Math.hypot(inp.kb.x, inp.kb.z) > 0.02;
      const tilt = keyTilt ? inp.kb : (inp.touch ?? inp.mouse ?? { x: 0, z: 0 });
      const thrust = k.has(' ') || inp.mouseThrust || inp.buttonThrust;
      while (acc >= STEP) {
        step(world.current, STEP, tilt, thrust, events);
        acc -= STEP;
      }
      // The camera eases after the ship rather than being bolted to it.
      const want = cameraFor(world.current);
      const c = cam.current;
      const e = 1 - Math.exp(-4 * gap);
      const wrapD = (a: number, b: number) => a - b - Math.round((a - b) / 64) * 64;
      c.x += wrapD(want.x, c.x) * e;
      c.z += wrapD(want.z, c.z) * e;
      c.y += (want.y - c.y) * (1 - Math.exp(-9 * gap));
      c.pitch += (want.pitch - c.pitch) * e;
      draw();
      if (now - hudAt > 100 || events.length) {
        hudAt = now;
        const w = world.current;
        const msg = events.length ? MESSAGES[events[events.length - 1]!.type](events[events.length - 1]!) : null;
        events.length = 0;
        setHud((h) => ({
          fuel: Math.round(w.ship.fuel),
          alt: Math.max(0, Math.round(altitude(w) * 10) / 10),
          spd: Math.round(speed(w.ship) * 10) / 10,
          status: msg ?? h.status,
        }));
      }
    };
    raf = window.requestAnimationFrame(tick);
    const onHidden = () => document.hidden && pause();
    // Pressing anywhere outside the game pauses it. (Focus alone is not enough: some browsers
    // do not move focus when a button is clicked.)
    const onPress = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    document.addEventListener('pointerdown', onPress, true);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onHidden);
      document.removeEventListener('pointerdown', onPress, true);
    };
  }, [phase]);

  const start = () => {
    setPhase('running');
    stage.current?.focus({ preventScroll: true });
  };
  /** A new game: a freshly generated estate and a new drone. */
  const fresh = () => {
    world.current = newEstate();
    cam.current = cameraFor(world.current);
    setHud({ fuel: 100, alt: 0, spd: 0, status: 'New estate surveyed into existence. On Pad A.' });
    draw();
    start();
  };
  const pause = () => {
    const inp = input.current;
    inp.keys.clear();
    inp.mouseThrust = inp.buttonThrust = false;
    inp.touch = null;
    setPhase((p) => (p === 'running' ? 'paused' : p));
  };

  const onKeyDown = (e: TargetedKeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      pause();
      return;
    }
    if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      if (phase !== 'running') return;
      input.current.keys.add(e.key);
    }
  };
  const onKeyUp = (e: TargetedKeyboardEvent<HTMLDivElement>) => {
    input.current.keys.delete(e.key);
  };

  // Mouse: the offset from the middle of the view is the tilt. Touch: drag from where you put
  // your finger down.
  const offset = (e: TargetedPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const z = -((e.clientY - r.top) / r.height - 0.5) * 2;
    return { x: x * 1.25, z: z * 1.25 };
  };
  const onPointerDown = (e: TargetedPointerEvent<HTMLDivElement>) => {
    if (phase !== 'running') return;
    const inp = input.current;
    if (e.pointerType === 'mouse') {
      if (e.button !== 0) return;
      inp.mouse = offset(e);
      inp.mouseThrust = true;
    } else if (!inp.touch) {
      e.currentTarget.setPointerCapture(e.pointerId);
      inp.touch = { x0: e.clientX, y0: e.clientY, x: 0, z: 0, id: e.pointerId };
    }
  };
  const onPointerMove = (e: TargetedPointerEvent<HTMLDivElement>) => {
    const inp = input.current;
    if (e.pointerType === 'mouse') inp.mouse = offset(e);
    else if (inp.touch?.id === e.pointerId) {
      inp.touch.x = (e.clientX - inp.touch.x0) / TOUCH_RANGE;
      inp.touch.z = -(e.clientY - inp.touch.y0) / TOUCH_RANGE;
    }
  };
  const onPointerUp = (e: TargetedPointerEvent<HTMLDivElement>) => {
    const inp = input.current;
    if (e.pointerType === 'mouse') inp.mouseThrust = false;
    else if (inp.touch?.id === e.pointerId) inp.touch = null;
  };

  const fuelBars = Math.round(hud.fuel / 10);
  return (
    <div class="hs-survey" ref={root}>
      <div class="hs-survey-hud" aria-hidden={phase === 'intro'}>
        <span class="hs-survey-fuel">
          FUEL{' '}
          <span class="hs-survey-gauge" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span class={i < fuelBars ? (fuelBars <= 2 ? 'is-low' : 'is-on') : ''} />
            ))}
          </span>{' '}
          <span class="visually-hidden">{hud.fuel} percent</span>
        </span>
        <span>ALT {hud.alt.toFixed(1)}</span>
        <span>SPD {hud.spd.toFixed(1)}</span>
      </div>
      <div
        ref={stage}
        class="hs-survey-stage"
        tabIndex={0}
        role="application"
        aria-label="Estate Survey flight view. Arrow keys tilt the drone, Space thrusts, Escape pauses."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={(e) => {
          // Holding Thrust (on touch screens) must not count as leaving the game.
          if ((e.relatedTarget as Element | null)?.closest('.hs-survey-thrust')) return;
          pause();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvas}
          class="hs-sprite hs-survey-canvas"
          width={size.w}
          height={size.h}
          style={{ width: `${size.w * size.scale}px`, height: `${size.h * size.scale}px` }}
          aria-hidden="true"
        />
        {phase !== 'running' && (
          <div class="hs-survey-card">
            {phase === 'intro' ? (
              <>
                <h2 class="hs-app-heading">Estate Survey</h2>
                <p>Fly the company drone over a newly acquired estate. It thrusts the way it is tilted, so tilt gently. Mind the trees.</p>
                <p>
                  {coarse ? 'Drag on the view to tilt. Hold Thrust to climb.' : 'Mouse tilts, hold the button to thrust. Or arrow keys and Space.'} Land
                  slowly and level on the yellow pads to refuel. Escape pauses.
                </p>
                {!clock.motion && <p class="hs-muted">This survey involves a lot of movement. It only starts when you ask.</p>}
                <button type="button" class="hs-btn" onClick={start}>
                  Begin survey
                </button>
              </>
            ) : (
              <>
                <h2 class="hs-app-heading">Survey suspended</h2>
                <p>Pending review. The estate will wait; it has nowhere else to be.</p>
                <p class="hs-survey-actions">
                  <button type="button" class="hs-btn" onClick={start}>
                    Resume
                  </button>
                  <button type="button" class="hs-btn" onClick={fresh}>
                    New estate
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
      <p class="hs-survey-status" aria-live="polite">
        {hud.status}
      </p>
      {coarse && (
        <button
          type="button"
          class="hs-btn hs-survey-thrust"
          onPointerDown={(e) => {
            e.preventDefault();
            input.current.buttonThrust = true;
          }}
          onPointerUp={() => (input.current.buttonThrust = false)}
          onPointerCancel={() => (input.current.buttonThrust = false)}
          onPointerLeave={() => (input.current.buttonThrust = false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          Thrust
        </button>
      )}
    </div>
  );
}
