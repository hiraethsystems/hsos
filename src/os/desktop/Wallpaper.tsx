/**
 * The four wallpapers (SPEC 4.7), all stepped bands from the palette. With colour cycling on,
 * the sun's bands roll and the grid lines step through the grid ramp (SPEC 4.6), every third
 * tick of the shared clock. Both are palette rotation: only which ramp step is used changes.
 */
import { useTick } from '../clock';
import { RAMP } from '../palette';
import type { WallpaperId } from '../settings';

const SLOW = 3;

/** The sliced sun: ten bands, the lower five cut by widening gaps. */
export function sunBands(phase = 0): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const k = (i + phase) % 18;
    const c = `var(--ramp-sun-${k < 10 ? k : 18 - k})`;
    const a = i * 10;
    const b = (i + 1) * 10;
    if (i >= 5) {
      const gap = (a + (i - 4) * 1.6).toFixed(1);
      parts.push(`transparent ${a}% ${gap}%`, `${c} ${gap}% ${b}%`);
    } else parts.push(`${c} ${a}% ${b}%`);
  }
  return `linear-gradient(180deg, ${parts.join(', ')})`;
}

export function Wallpaper({ id, cycling = false }: { id: WallpaperId; cycling?: boolean }) {
  const tick = useTick(cycling && id === 'sunset');
  const phase = cycling ? Math.floor(tick / SLOW) : 0;
  if (id === 'sunset') {
    return (
      <div class="hs-wall hs-wall-sunset" aria-hidden="true">
        <div class="hs-sky" />
        <div class="hs-sun" style={{ background: sunBands(phase) }} />
        <div class="hs-mountains" />
        <div class="hs-floor" style={{ '--grid-line': `var(--ramp-grid-${phase % RAMP.grid.length})` }} />
      </div>
    );
  }
  return <div class={`hs-wall hs-wall-${id}`} aria-hidden="true" />;
}
