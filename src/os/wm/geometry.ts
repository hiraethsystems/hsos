/** Window geometry rules (SPEC 5). */
import type { Rect } from '../types';

/** Height of the menu bar including its rule. Windows never go above it. */
export const MENU_H = 32;
/** Width reserved for the desktop icons down the right edge. */
export const ICONS_W = 100;
export const MIN_SIZE = { w: 240, h: 140 } as const;
/** The clear margin a window's fitted first size keeps from the menu bar, icons and bottom. */
export const FIT_GAP = 16;
/** The widest a 'wide' fitted window grows, so columns stay a readable width on big screens. */
export const FIT_WIDE_MAX = 1400;
/** How much of a window must stay on screen, so its title bar can always be grabbed. */
const GRAB = 80;
const TITLE_H = 26;

export interface Bounds {
  w: number;
  h: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.round(Math.max(lo, Math.min(hi, v)));

export function clampRect(r: Rect, b: Bounds, min: { w: number; h: number } = MIN_SIZE): Rect {
  const w = clamp(r.w, min.w, Math.max(min.w, b.w));
  const h = clamp(r.h, min.h, Math.max(min.h, b.h - MENU_H));
  return {
    w,
    h,
    x: clamp(r.x, GRAB - w, b.w - GRAB),
    y: clamp(r.y, MENU_H, b.h - TITLE_H),
  };
}

/**
 * The most a window at `r` may grow to when fitting its content (SPEC 5): it stops FIT_GAP
 * short of the desktop icons on the right and of the bottom of the screen.
 */
export function fitCap(r: Rect, b: Bounds): { w: number; h: number } {
  return { w: Math.max(MIN_SIZE.w, b.w - ICONS_W - FIT_GAP - r.x), h: Math.max(MIN_SIZE.h, b.h - FIT_GAP - r.y) };
}

/** Where a new window goes: cascaded from the top left, clear of the icons where possible. */
export function placeNew(size: { w: number; h: number }, index: number, b: Bounds): Rect {
  const step = (index % 8) * 28;
  const w = Math.min(size.w, b.w - ICONS_W - 40);
  const h = Math.min(size.h, b.h - MENU_H - 40);
  return clampRect({ x: 24 + step, y: MENU_H + 12 + step, w, h }, b);
}
