/**
 * A small indexed picture for the drawn wallpapers (SPEC 4.7). Every pixel holds an index into
 * the wallpaper's own colours, never a colour, and shapes have hard edges, so nothing blends
 * into a colour outside the palette (CLAUDE.md rule 2). Colour cycling is done the old way: the
 * picture stays put and only the colours behind some indices rotate.
 */

/** Something to paint with: one index, or a function that picks one per pixel (-1 skips). */
export type Ink = number | ((x: number, y: number) => number);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** The 4x4 ordered dither threshold at a pixel, from 0 to just under 1. */
export function bayer(x: number, y: number): number {
  return (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;
}

/** Pick one of `n` steps for a value from 0 to 1, dithered so the steps blend by pattern. */
export function dithered(v: number, n: number, x: number, y: number): number {
  const f = Math.max(0, Math.min(1, v)) * (n - 1);
  const k = Math.floor(f);
  return Math.min(n - 1, k + (f - k > bayer(x, y) ? 1 : 0));
}

/** A repeatable random number source, so a wallpaper looks the same on every visit. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A hash of a pixel position, from 0 to just under 1. */
export function noise(x: number, y: number, seed = 0): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Pix {
  readonly px: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.px = new Uint8Array(w * h);
  }

  private put(x: number, y: number, ink: Ink): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = typeof ink === 'number' ? ink : ink(x, y);
    if (i >= 0) this.px[y * this.w + x] = i;
  }

  set(x: number, y: number, ink: Ink): void {
    this.put(Math.floor(x), Math.floor(y), ink);
  }

  /** Fill from (x0, y0) up to but not including (x1, y1). */
  rect(x0: number, y0: number, x1: number, y1: number, ink: Ink): void {
    const ax = Math.max(0, Math.round(x0));
    const bx = Math.min(this.w, Math.round(x1));
    const ay = Math.max(0, Math.round(y0));
    const by = Math.min(this.h, Math.round(y1));
    for (let y = ay; y < by; y++) for (let x = ax; x < bx; x++) this.put(x, y, ink);
  }

  /** Fill every pixel whose centre is inside the ellipse. */
  ellipse(cx: number, cy: number, rx: number, ry: number, ink: Ink): void {
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const dy = (y + 0.5 - cy) / ry;
      if (dy * dy > 1) continue;
      const half = rx * Math.sqrt(1 - dy * dy);
      for (let x = Math.ceil(cx - half - 0.5); x < cx + half - 0.5; x++) this.put(x, y, ink);
    }
  }

  /** Fill a polygon (even-odd rule), sampling at pixel centres. */
  poly(points: readonly (readonly [number, number])[], ink: Ink): void {
    const ys = points.map((p) => p[1]);
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i]!;
        const [bx, by] = points[(i + 1) % points.length]!;
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k]! - 0.5); x < xs[k + 1]! - 0.5; x++) this.put(x, y, ink);
      }
    }
  }

  /** A straight line, `thick` pixels square at every step. */
  line(x0: number, y0: number, x1: number, y1: number, ink: Ink, thick = 1): void {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let s = 0; s <= n; s++) {
      const x = x0 + ((x1 - x0) * s) / n;
      const y = y0 + ((y1 - y0) * s) / n;
      if (thick <= 1) this.set(x, y, ink);
      else this.rect(x - thick / 2, y - thick / 2, x + thick / 2, y + thick / 2, ink);
    }
  }

  /** Text in the HSOS 5x7 wallpaper font, `scale` pixels per dot. Returns the width drawn. */
  text(str: string, x: number, y: number, ink: Ink, scale = 1): number {
    let cx = Math.round(x);
    for (const ch of str.toUpperCase()) {
      const g = GLYPHS[ch] ?? GLYPHS['?']!;
      g.forEach((row, gy) => {
        for (let gx = 0; gx < 5; gx++) {
          if (row[gx] === '#') this.rect(cx + gx * scale, y + gy * scale, cx + (gx + 1) * scale, y + (gy + 1) * scale, ink);
        }
      });
      cx += 6 * scale;
    }
    return cx - x;
  }
}

/** Width in pixels of `str` in the wallpaper font. */
export function textWidth(str: string, scale = 1): number {
  return str.length * 6 * scale - scale;
}

// The HSOS wallpaper font: 5 by 7 dots, capitals, figures and a little punctuation. Drawn for
// HSOS, not copied from any machine's character ROM.
const FONT: Record<string, string> = {
  A: '.###. #...# #...# ##### #...# #...# #...#',
  B: '####. #...# #...# ####. #...# #...# ####.',
  C: '.###. #...# #.... #.... #.... #...# .###.',
  D: '####. #...# #...# #...# #...# #...# ####.',
  E: '##### #.... #.... ####. #.... #.... #####',
  F: '##### #.... #.... ####. #.... #.... #....',
  G: '.###. #...# #.... #.### #...# #...# .####',
  H: '#...# #...# #...# ##### #...# #...# #...#',
  I: '.###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.',
  J: '..### ...#. ...#. ...#. #..#. #..#. .##..',
  K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#',
  L: '#.... #.... #.... #.... #.... #.... #####',
  M: '#...# ##.## #.#.# #.#.# #...# #...# #...#',
  N: '#...# ##..# #.#.# #..## #...# #...# #...#',
  O: '.###. #...# #...# #...# #...# #...# .###.',
  P: '####. #...# #...# ####. #.... #.... #....',
  Q: '.###. #...# #...# #...# #.#.# #..#. .##.#',
  R: '####. #...# #...# ####. #.#.. #..#. #...#',
  S: '.#### #.... #.... .###. ....# ....# ####.',
  T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..',
  U: '#...# #...# #...# #...# #...# #...# .###.',
  V: '#...# #...# #...# #...# #...# .#.#. ..#..',
  W: '#...# #...# #...# #.#.# #.#.# #.#.# .#.#.',
  X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
  Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..',
  Z: '##### ....# ...#. ..#.. .#... #.... #####',
  '0': '.###. #...# #..## #.#.# ##..# #...# .###.',
  '1': '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  '2': '.###. #...# ....# ...#. ..#.. .#... #####',
  '3': '####. ....# ....# .###. ....# ....# ####.',
  '4': '...#. ..##. .#.#. #..#. ##### ...#. ...#.',
  '5': '##### #.... ####. ....# ....# #...# .###.',
  '6': '.###. #.... #.... ####. #...# #...# .###.',
  '7': '##### ....# ...#. ..#.. .#... .#... .#...',
  '8': '.###. #...# #...# .###. #...# #...# .###.',
  '9': '.###. #...# #...# .#### ....# ....# .###.',
  '.': '..... ..... ..... ..... ..... .##.. .##..',
  ',': '..... ..... ..... ..... .##.. ..#.. .#...',
  "'": '..#.. ..#.. .#... ..... ..... ..... .....',
  '*': '..... #.#.# .###. ##### .###. #.#.# .....',
  '-': '..... ..... ..... .###. ..... ..... .....',
  '!': '..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..',
  '?': '.###. #...# ....# ...#. ..#.. ..... ..#..',
  ' ': '..... ..... ..... ..... ..... ..... .....',
};
const GLYPHS: Record<string, string[]> = Object.fromEntries(Object.entries(FONT).map(([k, v]) => [k, v.split(' ')]));
