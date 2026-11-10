/**
 * The four wallpapers (SPEC 4.7), all stepped bands from the palette. Colour cycling of the
 * sun and grid arrives with the shared clock in Phase 6; `phase` is ready for it.
 */
import type { WallpaperId } from '../settings';

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

export function Wallpaper({ id, phase = 0 }: { id: WallpaperId; phase?: number }) {
  if (id === 'sunset') {
    return (
      <div class="hs-wall hs-wall-sunset" aria-hidden="true">
        <div class="hs-sky" />
        <div class="hs-sun" style={{ background: sunBands(phase) }} />
        <div class="hs-mountains" />
        <div class="hs-floor" />
      </div>
    );
  }
  return <div class={`hs-wall hs-wall-${id}`} aria-hidden="true" />;
}
