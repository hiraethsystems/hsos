/**
 * An indexed framebuffer, as on the machines HSOS pretends to run on: every pixel holds a
 * palette slot (0 to 255), never a colour. Shapes are filled with hard edges, so no blended
 * colours can appear (CLAUDE.md rule 2). The finished frame is turned into colours only once,
 * through the palette, when it is shown.
 */
import { PALETTE } from '../../../palette';

/** Each palette slot as a 32 bit RGBA pixel (little endian, as every browser platform is). */
const LUT = new Uint32Array(256);
PALETTE.forEach((hex, i) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  LUT[i] = (255 << 24) | (b << 16) | (g << 8) | r;
});

export class Frame {
  readonly px: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.px = new Uint8Array(w * h);
  }

  /** Horizontal bands of slots from the top, each `bandH` rows tall; the rest in `rest`. */
  bands(slots: readonly number[], bandH: number, rest: number): void {
    for (let y = 0; y < this.h; y++) {
      const k = Math.floor(y / bandH);
      this.px.fill(k < slots.length ? slots[k]! : rest, y * this.w, (y + 1) * this.w);
    }
  }

  /** Fill a triangle. Pixel centres inside the edges are filled; shared edges never gap. */
  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, slot: number): void {
    // Sort by y.
    if (by < ay) [ax, ay, bx, by] = [bx, by, ax, ay];
    if (cy < ay) [ax, ay, cx, cy] = [cx, cy, ax, ay];
    if (cy < by) [bx, by, cx, cy] = [cx, cy, bx, by];
    if (cy === ay) return;
    const y0 = Math.max(0, Math.ceil(ay - 0.5));
    const y1 = Math.min(this.h, Math.ceil(cy - 0.5));
    for (let y = y0; y < y1; y++) {
      const yc = y + 0.5;
      const xLong = ax + ((cx - ax) * (yc - ay)) / (cy - ay);
      const xShort = yc < by ? ax + ((bx - ax) * (yc - ay)) / (by - ay || 1) : bx + ((cx - bx) * (yc - by)) / (cy - by || 1);
      const l = xLong < xShort ? xLong : xShort;
      const r = xLong < xShort ? xShort : xLong;
      const x0 = Math.max(0, Math.ceil(l - 0.5));
      const x1 = Math.min(this.w, Math.ceil(r - 0.5));
      if (x1 > x0) this.px.fill(slot, y * this.w + x0, y * this.w + x1);
    }
  }

  /** A small square of pixels, for particles. */
  dot(x: number, y: number, size: number, slot: number): void {
    const x0 = Math.max(0, Math.round(x - size / 2));
    const y0 = Math.max(0, Math.round(y - size / 2));
    const x1 = Math.min(this.w, x0 + size);
    const y1 = Math.min(this.h, y0 + size);
    for (let yy = y0; yy < y1; yy++) if (x1 > x0) this.px.fill(slot, yy * this.w + x0, yy * this.w + x1);
  }

  /** Turn the slots into colours, ready for a canvas. */
  toImage(img: ImageData): void {
    const out = new Uint32Array(img.data.buffer);
    const px = this.px;
    for (let i = 0; i < px.length; i++) out[i] = LUT[px[i]!]!;
  }
}
