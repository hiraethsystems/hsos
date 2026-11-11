/**
 * The wallpapers (SPEC 4.7). The first four are CSS, all stepped bands; the rest are small
 * indexed pictures drawn to a canvas (see drawn.ts). With colour cycling on, the sunset's sun
 * bands roll and its grid steps through the grid ramp, and the drawn ones rotate the ramps they
 * name. All of it is palette rotation: only which colour an index shows changes.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { useTick } from '../clock';
import { wallpaperColours } from '../palette';
import type { WallpaperId } from '../settings';
import { DRAWN, Keys } from './drawn';
import { Pix } from './pixel';

const SLOW = 3;
/** Drawn wallpapers are this many pixels tall, and as wide as the screen's shape needs. */
const DRAWN_H = 200;

/** The sliced sun: ten bands, the lower five cut by widening gaps. */
export function sunBands(phase = 0): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const k = (i + phase) % 18;
    const c = `var(--wp-sunset-sun-${k < 10 ? k : 18 - k})`;
    const a = i * 10;
    const b = (i + 1) * 10;
    if (i >= 5) {
      const gap = (a + (i - 4) * 1.6).toFixed(1);
      parts.push(`transparent ${a}% ${gap}%`, `${c} ${gap}% ${b}%`);
    } else parts.push(`${c} ${a}% ${b}%`);
  }
  return `linear-gradient(180deg, ${parts.join(', ')})`;
}

const GRID_STEPS = wallpaperColours('sunset').ramps.grid!.length;

export function Wallpaper({ id, cycling = false }: { id: WallpaperId; cycling?: boolean }) {
  if (DRAWN[id]) return <DrawnWall id={id} cycling={cycling} />;
  return <CssWall id={id} cycling={cycling} />;
}

function CssWall({ id, cycling }: { id: WallpaperId; cycling: boolean }) {
  const tick = useTick(cycling && id === 'sunset');
  const phase = cycling ? Math.floor(tick / SLOW) : 0;
  if (id === 'sunset') {
    return (
      <div class="hs-wall hs-wall-sunset" aria-hidden="true">
        <div class="hs-sky" />
        <div class="hs-sun" style={{ background: sunBands(phase) }} />
        <div class="hs-mountains" />
        <div class="hs-floor" style={{ '--grid-line': `var(--wp-sunset-grid-${phase % GRID_STEPS})` }} />
      </div>
    );
  }
  return <div class={`hs-wall hs-wall-${id}`} aria-hidden="true" />;
}

function DrawnWall({ id, cycling }: { id: WallpaperId; cycling: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const picture = useRef<{ pix: Pix; keys: Keys } | null>(null);
  const wall = DRAWN[id]!;
  const animated = cycling && Boolean(wall.cycle?.length);
  const tick = useTick(animated);
  const phase = animated ? Math.floor(tick / SLOW) : 0;

  // Match the picture's width to the shape of the space it fills.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) setWidth(Math.max(120, Math.min(560, Math.round((DRAWN_H * r.width) / r.height))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw the indices once per size.
  useEffect(() => {
    if (!width) return;
    const keys = new Keys(id);
    const pix = new Pix(width, DRAWN_H);
    wall.draw(pix, keys);
    picture.current = { pix, keys };
  }, [id, width]);

  // Show them through the current, possibly rotated, colours.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    const pic = picture.current;
    if (!ctx || !pic || pic.pix.w !== width) return;
    const lut = pic.keys.present(wall.cycle ?? [], phase).map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return (255 << 24) | ((n & 0xff) << 16) | (n & 0xff00) | (n >>> 16);
    });
    const img = ctx.createImageData(pic.pix.w, pic.pix.h);
    const out = new Uint32Array(img.data.buffer);
    const px = pic.pix.px;
    for (let i = 0; i < px.length; i++) out[i] = lut[px[i]!]!;
    ctx.putImageData(img, 0, 0);
  }, [id, width, phase]);

  return (
    <div ref={wrap} class={`hs-wall hs-wall-drawn hs-wall-${id}`} aria-hidden="true">
      {width > 0 && <canvas ref={canvas} width={width} height={DRAWN_H} />}
    </div>
  );
}
