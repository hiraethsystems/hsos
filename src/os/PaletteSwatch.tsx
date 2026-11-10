/**
 * All 256 palette slots as a 16 by 16 grid. Used on the scaffold page to check the palette by
 * eye. Rendered at build time; it needs no JavaScript in the browser.
 */
import { PALETTE, UNSPENT_SLOTS } from './palette';

export default function PaletteSwatch({ cell = 14 }: { cell?: number }) {
  return (
    <div
      role="img"
      aria-label={`The HSOS palette: ${PALETTE.length} slots, ${PALETTE.length - UNSPENT_SLOTS} in use, ${UNSPENT_SLOTS} unspent.`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(16, ${cell}px)`,
        gridAutoRows: `${cell}px`,
        width: 'max-content',
        border: '2px solid var(--c-ink)',
      }}
    >
      {PALETTE.map((hex, i) => (
        <span key={i} title={`${i}: ${hex}${i >= PALETTE.length - UNSPENT_SLOTS ? ' (unspent)' : ''}`} style={{ background: hex }} />
      ))}
    </div>
  );
}
