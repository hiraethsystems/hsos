/**
 * Sprites (SPEC 4.5): pixel art stored as palette slot indices, drawn crisp at whole number
 * scales. Art is written as rows of characters, one per pixel, with a legend mapping each
 * character to a palette colour. `.` is always transparent.
 */
import { refIndex, type ColourRef } from '../palette';

export interface Sprite {
  w: number;
  h: number;
  /** Palette slot per pixel, row by row. null is transparent. */
  pixels: readonly (number | null)[];
}

export function spriteFromArt(rows: readonly string[], legend: Readonly<Record<string, ColourRef>>): Sprite {
  const w = rows[0]?.length ?? 0;
  const pixels: (number | null)[] = [];
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`sprite: row ${y} is ${row.length} pixels wide, expected ${w}`);
    for (const ch of row) {
      if (ch === '.') pixels.push(null);
      else {
        const ref = legend[ch];
        if (!ref) throw new Error(`sprite: no legend entry for "${ch}"`);
        pixels.push(refIndex(ref));
      }
    }
  });
  return { w, h: rows.length, pixels };
}
