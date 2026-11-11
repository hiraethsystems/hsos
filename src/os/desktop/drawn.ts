/**
 * The drawn wallpapers (SPEC 4.7): small indexed pictures, 200 pixels tall and as wide as the
 * screen's shape needs, scaled up whole and crisp. Each is drawn once per size into a Pix; colour
 * cycling then only rotates the colours behind the ramps listed in `cycle`.
 *
 * Every scene is original, made for HSOS in the spirit of its era or genre. None copies a real
 * product's wallpaper, logo or artwork.
 */
import { wallpaperColours, type Hex, type WallpaperId } from '../palette';
import { dithered, noise, Pix, seeded, textWidth, type Ink } from './pixel';

/** Looks up a wallpaper's colours as indices into its own little palette. */
export class Keys {
  readonly colours: Hex[] = [];
  private readonly index = new Map<string, number>();
  private readonly lengths = new Map<string, number>();
  readonly rampHex: Record<string, Hex[]>;

  constructor(id: WallpaperId) {
    const w = wallpaperColours(id);
    for (const [name, hex] of Object.entries(w.colours)) this.add(name, hex);
    for (const [name, hexes] of Object.entries(w.ramps)) {
      hexes.forEach((hex, i) => this.add(`${name}.${i}`, hex));
      this.lengths.set(name, hexes.length);
    }
    this.rampHex = w.ramps;
  }
  private add(key: string, hex: Hex) {
    this.index.set(key, this.colours.length);
    this.colours.push(hex);
  }
  /** A named colour. */
  c(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`wallpaper colour ${name} is not in the palette`);
    return i;
  }
  /** Step `i` of a ramp, wrapping round. */
  r(ramp: string, i: number): number {
    const n = this.n(ramp);
    return this.c(`${ramp}.${((Math.floor(i) % n) + n) % n}`);
  }
  /** Length of a ramp. */
  n(ramp: string): number {
    const n = this.lengths.get(ramp);
    if (n === undefined) throw new Error(`wallpaper ramp ${ramp} is not in the palette`);
    return n;
  }
  /** The colours to show, with the listed ramps rotated by `phase` steps. */
  present(cycle: readonly string[], phase: number): Hex[] {
    const out = [...this.colours];
    for (const ramp of cycle) {
      const hexes = this.rampHex[ramp]!;
      const n = hexes.length;
      hexes.forEach((_, i) => (out[this.c(`${ramp}.${i}`)] = hexes[(i + phase) % n]!));
    }
    return out;
  }
}

export interface DrawnWallpaper {
  draw(p: Pix, k: Keys): void;
  /** Ramps that rotate while colour cycling is on. */
  cycle?: readonly string[];
}

// ---- Shared pieces -----------------------------------------------------------------------

/** Vertical stepped bands of a ramp between two rows, top to bottom. */
function bands(p: Pix, k: Keys, ramp: string, y0: number, y1: number, dither = false, steps = k.n(ramp)) {
  p.rect(0, y0, p.w, y1, (x, y) => {
    const t = (y + 0.5 - y0) / (y1 - y0);
    return k.r(ramp, dither ? dithered(t, steps, x, y) : Math.min(steps - 1, Math.floor(t * steps)));
  });
}

/** The company sun: banded top to bottom, its lower half cut by widening gaps. */
function slicedSun(p: Pix, k: Keys, ramp: string, cx: number, cy: number, r: number, gap?: number) {
  const n = k.n(ramp);
  p.ellipse(cx, cy, r, r, (_, y) => {
    const rel = (y + 0.5 - cy) / r;
    for (let j = 0; j < 5; j++) {
      const a = 0.12 + j * 0.18;
      if (rel >= a && rel < a + 0.035 + j * 0.03) return gap ?? -1;
    }
    return k.r(ramp, Math.min(n - 1, Math.floor(((y + 0.5 - (cy - r)) / (2 * r)) * n)));
  });
}

/** A neon grid floor from the horizon down, lines converging on the middle. */
function gridFloor(p: Pix, horizon: number, line: Ink, ground: Ink, rows = 9, spread = 0.1) {
  p.rect(0, horizon, p.w, p.h, ground);
  const depth = p.h - horizon;
  for (let i = 0; i <= rows; i++) {
    const y = Math.round(horizon + depth * (i / rows) ** 2);
    p.rect(0, y, p.w, y + 1, line);
  }
  const step = p.w / 9;
  for (let xb = -p.w; xb <= 2 * p.w; xb += step) {
    p.line(p.w / 2 + (xb - p.w / 2) * spread, horizon, xb, p.h, line);
  }
}

/** Lighting for a rounded shape lit from the upper left: 0 is darkest, 1 brightest. */
function lit(cx: number, cy: number, rx: number, ry: number, x: number, y: number): number {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
  return 0.55 * nz - 0.4 * dx - 0.3 * dy + 0.25;
}

/** Fill an ellipse in a ramp's shades, brightest step first in the ramp. */
function shadedEllipse(p: Pix, k: Keys, ramp: string, cx: number, cy: number, rx: number, ry: number, bias = 0) {
  const n = k.n(ramp);
  p.ellipse(cx, cy, rx, ry, (x, y) => k.r(ramp, n - 1 - dithered(lit(cx, cy, rx, ry, x, y) + bias, n, x, y)));
}

/** A palm: a leaning trunk and drooping fronds. */
function palm(p: Pix, x: number, base: number, top: number, lean: number, trunk: Ink, leaf: Ink, size: number) {
  const tx = x + lean;
  for (let s = 0; s <= 1; s += 1 / 40) {
    const px = x + lean * s * s;
    const py = base + (top - base) * s;
    p.rect(px - 1.5, py, px + 1.5, py + 2, trunk);
  }
  const angles = [-3.0, -2.6, -2.2, -1.75, -1.35, -0.95, -0.5, -0.1, 0.25];
  const wide = Math.max(2, size * 0.13);
  for (const a of angles) {
    const ex = tx + Math.cos(a) * size;
    const ey = top + Math.sin(a) * size * 0.4 + size * 0.38;
    const mx = tx + Math.cos(a) * size * 0.55;
    const my = top + Math.sin(a) * size * 0.45 - size * 0.04;
    p.poly(
      [
        [tx, top - 1],
        [mx, my - wide],
        [ex, ey],
        [mx, my + wide * 0.6],
        [tx, top + 2],
      ],
      leaf,
    );
  }
}

/** Text that is cut short rather than run off its space. */
function fitText(p: Pix, text: string, x: number, y: number, maxW: number, ink: Ink, centre = false) {
  let t = text;
  while (t.length && textWidth(t) > maxW) t = t.slice(0, -1);
  return p.text(t, centre ? x + (maxW - textWidth(t)) / 2 : x, y, ink);
}

// ---- The wallpapers ----------------------------------------------------------------------

/** Teal Horizon: the company sunset as a sixteen colour VGA picture, dithered, on teal. */
const teal: DrawnWallpaper = {
  draw(p, k) {
    const hz = Math.round(p.h * 0.64);
    bands(p, k, 'sky', 0, hz, true);
    slicedSun(p, k, 'sun', p.w * 0.45, hz - p.h * 0.1, p.h * 0.2);
    const rnd = seeded(95);
    const hills: [number, number][] = [[0, hz]];
    for (let x = 0; x <= p.w + 20; x += 18 + rnd() * 22) hills.push([x, hz - 6 - rnd() * 18]);
    hills.push([p.w, hz]);
    p.poly(hills, k.c('hill'));
    gridFloor(p, hz, k.r('floor', 1), (x, y) => (y < hz + 6 && (x + y) % 2 ? k.r('floor', 0) : k.c('ground')), 8);
  },
};

/** READY.: a blue screen in a striped loading border, with a raster sunset under the banner. */
const ready: DrawnWallpaper = {
  cycle: ['raster', 'blink'],
  draw(p, k) {
    p.rect(0, 0, p.w, p.h, (_, y) => k.r('raster', Math.floor(y / 3)));
    const sx0 = Math.round(p.w * 0.08);
    const sy0 = Math.round(p.h * 0.1);
    const sx1 = p.w - sx0;
    const sy1 = p.h - sy0;
    p.rect(sx0, sy0, sx1, sy1, k.c('screen'));
    const tx = sx0 + 6;
    const inner = sx1 - sx0 - 12;
    fitText(p, '**** HIRAETH HOME OFFICE 64 ****', tx, sy0 + 6, inner, k.c('text'), true);
    fitText(p, '256 COLOURS APPROVED. 0 FEELINGS FREE', tx, sy0 + 16, inner, k.c('text'), true);
    p.text('READY.', tx, sy0 + 34, k.c('text'));
    p.rect(tx, sy0 + 43, tx + 5, sy0 + 50, k.r('blink', 0));

    // The raster sunset, in four pixel blocks as the machine would draw it.
    const top = sy0 + 58;
    const bottom = sy1 - 6;
    if (bottom - top < 30) return;
    const left = tx;
    const right = sx1 - 6;
    const hz = Math.round(top + (bottom - top) * 0.62);
    for (let y = top; y < hz; y += 4) p.rect(left, y, right, Math.min(hz, y + 4), k.r('sunset', Math.floor(((y - top) / (hz - top)) * 4)));
    const cx = (left + right) / 2;
    const r = Math.min(32, (hz - top) * 0.85);
    // A half sun in two pixel blocks, with three raster gaps across its lower part.
    for (let y = Math.floor(hz - r); y < hz; y += 2) {
      const rel = (y - (hz - r)) / r;
      if ([0.55, 0.72, 0.87].some((g) => Math.abs(rel - g) < 0.04)) continue;
      for (let x = Math.floor(cx - r); x < cx + r; x += 2) {
        if ((x + 1 - cx) ** 2 + (y + 1 - hz) ** 2 < r * r) p.rect(x, y, x + 2, y + 2, k.c('sun'));
      }
    }
    p.rect(left, hz, right, bottom, k.c('ground'));
    const depth = bottom - hz;
    for (let i = 0; i <= 5; i++) {
      const y = Math.round(hz + depth * (i / 5) ** 2);
      p.rect(left, y, right, y + 1, k.c('grid'));
    }
    const inside = (x: number) => (x >= left && x < right ? k.c('grid') : -1);
    for (let xb = left - 160; xb <= right + 160; xb += 24) p.line(cx + (xb - cx) * 0.12, hz, xb, bottom - 1, inside);
  },
};

/** Pinboard: a textured grey backdrop with the company sunset pinned up in a frame. */
const pinboard: DrawnWallpaper = {
  draw(p, k) {
    p.rect(0, 0, p.w, p.h, (x, y) => {
      const v = 0.6 * noise(x >> 2, y >> 2, 3) + 0.4 * noise(x, y, 11);
      return k.r('stone', Math.floor(v * 4));
    });
    const pw = Math.round(Math.min(p.w * 0.42, 150));
    const ph = Math.round(pw * 0.66);
    const x0 = Math.round(p.w * 0.42 - pw / 2);
    const y0 = Math.round(p.h * 0.46 - ph / 2);
    p.rect(x0 + 3, y0 + 3, x0 + pw + 3, y0 + ph + 3, k.c('shade'));
    p.rect(x0 - 1, y0 - 1, x0 + pw + 1, y0 + ph + 1, k.c('edge'));
    p.rect(x0, y0, x0 + pw, y0 + ph, k.c('frame'));
    const ix0 = x0 + 5;
    const iy0 = y0 + 5;
    const ix1 = x0 + pw - 5;
    const iy1 = y0 + ph - 5;
    const hz = Math.round(iy0 + (iy1 - iy0) * 0.66);
    for (let i = 0; i < 4; i++) p.rect(ix0, iy0 + ((hz - iy0) * i) / 4, ix1, iy0 + ((hz - iy0) * (i + 1)) / 4, k.r('sky', i));
    const r = (hz - iy0) * 0.6;
    const cx = (ix0 + ix1) / 2;
    p.ellipse(cx, hz, r, r, (x, y) => {
      if (y >= hz || x < ix0 || x >= ix1) return -1;
      const t = (y + 0.5 - (hz - r)) / r;
      if (t > 0.5 && Math.floor(t * 10) % 2) return -1;
      return k.r('sun', Math.min(2, Math.floor(t * 3)));
    });
    const rnd = seeded(3);
    const land: [number, number][] = [[ix0, iy1]];
    for (let x = ix0; x <= ix1; x += 8 + rnd() * 10) land.push([Math.min(ix1, x), hz - rnd() * 6]);
    land.push([ix1, hz], [ix1, iy1]);
    p.poly(land, k.c('land'));
    p.ellipse(x0 + pw / 2 + 1, y0 + 2, 3, 3, k.c('shade'));
    p.ellipse(x0 + pw / 2, y0 + 1, 3, 3, k.c('pin'));
    p.set(x0 + pw / 2 - 1, y0, k.c('frame'));
  },
};

/** Copper: bars of colour across a blue screen, over a checkered floor. */
const copper: DrawnWallpaper = {
  cycle: ['bar', 'cool'],
  draw(p, k) {
    const hz = Math.round(p.h * 0.62);
    p.rect(0, 0, p.w, hz, k.c('sky'));
    const bars: [number, string][] = [
      [0.12, 'bar'],
      [0.3, 'cool'],
      [0.47, 'bar'],
    ];
    for (const [at, ramp] of bars) {
      const y0 = Math.round(p.h * at);
      const n = k.n(ramp);
      for (let i = 0; i < n; i++) p.rect(0, y0 + i, p.w, y0 + i + 1, k.r(ramp, i));
    }
    p.rect(0, hz, p.w, p.h, (x, y) => {
      const z = 420 / (y - hz + 1);
      const wx = ((x + 0.5 - p.w / 2) * z) / 60;
      return (Math.floor(wx / 6) + Math.floor(z / 6)) & 1 ? k.c('check') : k.c('checkb');
    });
    // The furthest rows are too fine to draw as squares, so they are one colour, as in haze.
    p.rect(0, hz, p.w, hz + 7, k.c('checkb'));
    p.rect(0, hz, p.w, hz + 1, k.c('horizon'));
  },
};

/** Plaza: a marble bust before the sun, columns, a leaping dolphin, a palm and the grid. */
const plaza: DrawnWallpaper = {
  cycle: ['grid'],
  draw(p, k) {
    const hz = Math.round(p.h * 0.62);
    bands(p, k, 'sky', 0, hz);
    slicedSun(p, k, 'sun', p.w * 0.5, hz - p.h * 0.12, p.h * 0.22);
    p.rect(0, hz - 3, p.w, hz, k.c('sea'));
    gridFloor(p, hz, k.r('grid', 0), k.c('floor'), 8, 0.14);

    const marble = (l: number, x: number, y: number) => k.r('marble', 4 - dithered(l, 5, x, y));

    // Two columns standing on the grid.
    const column = (cx: number) => {
      const cw = 16;
      const top = Math.round(p.h * 0.16);
      const bottom = Math.round(hz + 26);
      p.rect(cx - cw / 2 - 4, top, cx + cw / 2 + 4, top + 3, k.r('marble', 0));
      p.rect(cx - cw / 2 - 2, top + 3, cx + cw / 2 + 2, top + 7, (x, y) => marble(0.8 - (x - cx + cw) / (cw * 3), x, y));
      p.rect(cx - cw / 2, top + 7, cx + cw / 2, bottom - 4, (x, y) => {
        const t = (x + 0.5 - (cx - cw / 2)) / cw;
        const flute = (x - Math.round(cx - cw / 2)) % 4 === 0 ? 0.25 : 0;
        return marble(0.95 - t * 0.85 - flute, x, y);
      });
      p.rect(cx - cw / 2 - 3, bottom - 4, cx + cw / 2 + 3, bottom, (x, y) => marble(0.6 - (x - cx) / 40, x, y));
    };
    column(p.w * 0.12);
    column(p.w * 0.88);

    // A palm in silhouette.
    palm(p, p.w * 0.29, hz + 18, p.h * 0.3, -8, k.c('palm'), k.c('leaf'), 26);

    // The bust: plinth, shoulders, neck, head and curls, lit from the upper left.
    const cx = p.w * 0.5;
    const b = p.h - 8;
    shadedEllipse(p, k, 'marble', cx, b - 34, 34, 22);
    p.rect(cx - 24, b - 26, cx + 24, b, (x, y) => marble(0.75 - (x - cx + 24) / 70, x, y));
    p.rect(cx - 27, b - 28, cx + 27, b - 25, k.r('marble', 1));
    shadedEllipse(p, k, 'marble', cx + 1, b - 58, 9, 15, -0.05);
    shadedEllipse(p, k, 'marble', cx + 2, b - 84, 16, 20);
    const rnd = seeded(1999);
    for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += 0.24) {
      const hx = cx + 1 + Math.cos(a) * 14;
      const hy = b - 88 + Math.sin(a) * 16;
      shadedEllipse(p, k, 'marble', hx, hy, 4 + rnd() * 1.5, 4 + rnd() * 1.5, -0.05);
    }
    // An ear, so the face reads as turned to the right.
    p.ellipse(cx - 6, b - 82, 2.5, 4, k.r('marble', 2));
    p.ellipse(cx - 6, b - 82, 1, 2.5, k.r('marble', 3));
    p.poly(
      [
        [cx + 15, b - 90],
        [cx + 21, b - 80],
        [cx + 15, b - 78],
      ],
      k.r('marble', 2),
    );
    p.rect(cx + 7, b - 89, cx + 11, b - 88, k.r('marble', 4));
    p.rect(cx + 6, b - 92, cx + 12, b - 91, k.r('marble', 3));
    p.rect(cx + 10, b - 73, cx + 15, b - 72, k.r('marble', 3));

    // The dolphin, leaping in an arc.
    const dcx = p.w * 0.72;
    const dcy = hz + 6;
    const R = Math.min(28, p.w * 0.08);
    const outer: [number, number][] = [];
    const inner: [number, number][] = [];
    const a0 = Math.PI * 1.12;
    const a1 = Math.PI * 1.88;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const a = a0 + (a1 - a0) * t;
      const th = 1 + 7 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8;
      outer.push([dcx + Math.cos(a) * (R + th / 2), dcy + Math.sin(a) * (R + th / 2)]);
      inner.push([dcx + Math.cos(a) * (R - th / 2), dcy + Math.sin(a) * (R - th / 2)]);
    }
    const dolphinInk = (x: number, y: number) => {
      const d = Math.hypot(x + 0.5 - dcx, y + 0.5 - dcy);
      return k.r('dolphin', 3 - dithered((R + 4 - d) / 8, 4, x, y));
    };
    p.poly([...outer, ...inner.reverse()], dolphinInk);
    const fin = a0 + (a1 - a0) * 0.45;
    p.poly(
      [
        [dcx + Math.cos(fin) * (R + 2), dcy + Math.sin(fin) * (R + 2)],
        [dcx + Math.cos(fin - 0.12) * (R + 10), dcy + Math.sin(fin - 0.12) * (R + 10)],
        [dcx + Math.cos(fin + 0.12) * (R + 3), dcy + Math.sin(fin + 0.12) * (R + 3)],
      ],
      k.r('dolphin', 3),
    );
    const tail: [number, number] = [dcx + Math.cos(a0) * R, dcy + Math.sin(a0) * R];
    p.poly(
      [
        [tail[0], tail[1]],
        [tail[0] - 7, tail[1] + 5],
        [tail[0] - 2, tail[1] + 1],
        [tail[0] + 3, tail[1] + 7],
      ],
      k.r('dolphin', 2),
    );
    const eyeA = a0 + (a1 - a0) * 0.9;
    p.set(dcx + Math.cos(eyeA) * R, dcy + Math.sin(eyeA) * R, k.r('dolphin', 3));
    for (let i = 0; i < 14; i++) p.set(dcx + Math.cos(a1) * R + (rnd() - 0.5) * 12, hz - rnd() * 6, k.r('dolphin', 0));
  },
};

/** Closing Time: a barber's at dusk in a pastel city, its pole still turning. */
const salon: DrawnWallpaper = {
  cycle: ['pole'],
  draw(p, k) {
    const street = Math.round(p.h * 0.86);
    const hz = Math.round(p.h * 0.74);
    bands(p, k, 'sky', 0, hz);
    p.rect(0, hz, p.w, street, k.r('sky', 7));
    for (let i = 0; i < p.w / 3; i++) {
      const x = Math.floor(noise(i, 1, 5) * p.w);
      const y = Math.floor(noise(i, 2, 5) * p.h * 0.4);
      p.set(x, y, k.c('moon'));
    }
    const mx = p.w * 0.18;
    const my = p.h * 0.17;
    p.ellipse(mx, my, 12, 12, (x, y) => ((x + 0.5 - mx - 6) ** 2 + (y + 0.5 - my + 4) ** 2 < 11 * 11 ? -1 : k.c('moon')));

    // Three rows of towers, the furthest palest, with lit windows.
    const rnd = seeded(7);
    for (let layer = 2; layer >= 0; layer--) {
      let x = -6 + rnd() * 10;
      while (x < p.w) {
        const bw = 14 + rnd() * 24;
        const bh = p.h * (0.1 + rnd() * 0.2 + layer * 0.07);
        const top = Math.round(street - bh);
        p.rect(x, top, x + bw, street, k.r('tower', layer));
        if (layer < 2) {
          for (let wy = top + 4; wy < street - 4; wy += 5) {
            for (let wx = x + 3; wx < x + bw - 3; wx += 4) {
              if (rnd() < 0.2) p.rect(wx, wy, wx + 2, wy + 2, k.r('lit', Math.floor(rnd() * 3)));
            }
          }
        }
        x += bw + rnd() * 4;
      }
    }

    // The shop front.
    const x0 = Math.round(p.w * 0.44);
    const x1 = Math.round(p.w * 0.84);
    const y0 = Math.round(p.h * 0.5);
    p.rect(x0, y0, x1, street, k.c('wall'));
    const win1 = Math.round(x0 + (x1 - x0) * 0.62);
    p.rect(x0 + 8, y0 + 24, win1, street - 2, (x, y) => (y > street - 14 && (x + y) % 2 ? k.c('glow') : k.c('glass')));
    p.rect(win1 + 6, y0 + 20, x1 - 6, street, k.c('glass'));
    p.rect(win1 + 6, y0 + 20, x1 - 6, y0 + 21, k.c('glow'));
    p.text('OPEN', x0 + 12, y0 + 28, k.c('neonb'));
    const sign = 'BARBER';
    const sw = textWidth(sign) + 6;
    const sx = Math.round((x0 + x1) / 2 - sw / 2);
    p.rect(sx, y0 + 5, sx + sw, y0 + 6, k.c('neonb'));
    p.rect(sx, y0 + 16, sx + sw, y0 + 17, k.c('neonb'));
    p.rect(sx, y0 + 5, sx + 1, y0 + 17, k.c('neonb'));
    p.rect(sx + sw - 1, y0 + 5, sx + sw, y0 + 17, k.c('neonb'));
    p.text(sign, sx + 3, y0 + 8, k.c('neon'));

    // The pole: stripes run on a diagonal, so rotating the four colours turns it.
    const px0 = x0 - 9;
    const pt = street - 36;
    p.rect(px0 - 1, pt - 3, px0 + 7, pt, k.c('cap'));
    p.rect(px0 - 1, street - 6, px0 + 7, street - 3, k.c('cap'));
    p.rect(px0, pt, px0 + 6, street - 6, (x, y) => k.r('pole', Math.floor((y - (x - px0)) / 2)));

    p.rect(0, street, p.w, p.h, k.c('street'));
    p.rect(0, street, p.w, street + 1, k.c('kerb'));
    for (let x = sx; x < sx + sw; x++) if ((x + street) % 3 === 0) p.set(x, street + 4 + (x % 2), k.c('neon'));
  },
};

/** Poolside: a summer sky, a white villa, palms and a pool whose water ripples. */
const poolside: DrawnWallpaper = {
  cycle: ['water'],
  draw(p, k) {
    const hz = Math.round(p.h * 0.6);
    bands(p, k, 'sky', 0, hz);
    p.ellipse(p.w * 0.14, p.h * 0.14, 11, 11, k.c('sun'));

    const cloud = (cx: number, cy: number, s: number) => {
      const puffs: [number, number, number][] = [
        [-1.6, 0.3, 0.7],
        [-0.8, -0.3, 0.95],
        [0.2, -0.6, 1.2],
        [1.2, -0.1, 0.9],
        [2, 0.35, 0.6],
      ];
      const flat = cy + s * 0.75;
      for (const [dx, dy, r] of puffs) {
        p.ellipse(cx + dx * s, cy + dy * s, r * s, r * s, (_, y) => (y >= flat ? -1 : y > flat - s * 0.3 ? k.c('cloudb') : k.c('cloud')));
      }
    };
    cloud(p.w * 0.46, p.h * 0.2, 12);
    cloud(p.w * 0.76, p.h * 0.1, 7);

    // The villa: two white slabs, a pink wall and a band of glass reflecting the sky.
    const vx = Math.round(p.w * 0.56);
    const roof = Math.round(p.h * 0.3);
    p.rect(vx - 4, roof, p.w, roof + 4, k.c('villa'));
    p.rect(vx, roof + 4, p.w, hz - 4, k.c('villa'));
    p.rect(vx, roof + 4, p.w, roof + 7, k.c('shade'));
    p.rect(vx + 6, roof + 12, p.w, roof + 26, (_, y) => k.r('sky', 3 + ((y - roof) % 3 === 0 ? 1 : 0)));
    const mid = Math.round((roof + hz) / 2 + 4);
    p.rect(vx - 4, mid, p.w, mid + 3, k.c('villa'));
    p.rect(vx, mid + 3, p.w, mid + 5, k.c('shade'));
    p.rect(vx, mid + 5, vx + 22, hz - 4, k.c('wall'));
    p.rect(vx + 18, mid + 5, vx + 22, hz - 4, k.c('walld'));
    p.rect(vx + 28, mid + 10, p.w, hz - 6, (_, y) => k.r('sky', 2 + ((y - mid) % 4 === 0 ? 1 : 0)));

    const pool = Math.round(p.h * 0.72);
    p.rect(0, hz - 4, p.w, pool, k.c('deck'));
    p.rect(0, hz - 4, p.w, hz - 3, k.c('shade'));
    p.rect(0, pool, p.w, pool + 2, k.c('tile'));
    p.rect(0, pool + 2, p.w, p.h, (x, y) => {
      const wave = Math.sin(x * 0.11 + y * 0.9) + Math.sin(x * 0.05 - y * 0.3);
      if (wave > 1.55) return k.r('water', 3);
      return k.r('water', Math.floor((y - pool) / 9 + wave * 0.35) % 3);
    });

    palm(p, p.w * 0.1, hz + 14, p.h * 0.18, 12, k.c('trunk'), (x, y) => k.r('leaf', (x + y) % 5 === 0 ? 2 : 1), 34);
    palm(p, p.w * 0.27, hz + 14, p.h * 0.3, 9, k.c('trunk'), (x, y) => k.r('leaf', (x + y) % 5 === 0 ? 1 : 0), 26);
  },
};

export const DRAWN: Partial<Record<WallpaperId, DrawnWallpaper>> = { teal, ready, pinboard, copper, plaza, salon, poolside };
