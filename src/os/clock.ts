/**
 * The shared animation clock (SPEC 4.6): one timer, about six ticks a second, drives every
 * animation on the desktop. It only runs while something is listening and the tab is visible,
 * so a closed Listening Post costs nothing.
 *
 * Apps get an `AnimationClock` in their props, which says what they are allowed to animate:
 * `cycling` (palette rotation, off in Settings or under reduced motion) and `motion` (any
 * movement at all, off under reduced motion). They then call `useTick` with whichever applies.
 */
import { useEffect, useState } from 'preact/hooks';
import { prefersReducedMotion } from './settings';

export const TICK_MS = 160;

export interface AnimationClock {
  /** Colour cycling is allowed: the Settings checkbox is on and reduced motion is not asked for. */
  cycling: boolean;
  /** Movement is allowed: reduced motion is not asked for. */
  motion: boolean;
}

type Listener = (tick: number) => void;
const listeners = new Set<Listener>();
let tick = 0;
let timer: number | undefined;

/** Listen to the clock. Returns a function that stops listening. */
export function onTick(fn: Listener): () => void {
  listeners.add(fn);
  if (timer === undefined) {
    timer = window.setInterval(() => {
      if (document.hidden) return;
      tick++;
      listeners.forEach((l) => l(tick));
    }, TICK_MS);
  }
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * Whether the visitor asks for reduced motion, following the system setting live: switch it
 * on mid-visit and every animation stops at once.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return;
    }
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** The current tick, re-rendering on each one while `active`. Frozen when not active. */
export function useTick(active: boolean): number {
  const [t, setT] = useState(tick);
  useEffect(() => (active ? onTick(setT) : undefined), [active]);
  return t;
}
