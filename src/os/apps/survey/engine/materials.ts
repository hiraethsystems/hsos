/**
 * The colours of the estate, built only from ramps HSOS already has (no new palette slots).
 * Each material is a list of slots from dark to light: light and shade pick the step, and
 * alternate tiles sit one step apart so the land reads as tiles.
 */
import { RAMP, refIndex } from '../../../palette';

const rev = (xs: readonly number[]) => [...xs].reverse();
const refs = (...names: string[]) => names.map((n) => refIndex(n as Parameters<typeof refIndex>[0]));

export const MATERIALS = {
  /** Dark window greens, then the Ledger's Q4 greens: eight steps of grass. */
  grass: [...RAMP.files, ...rev(RAMP['ledger-q4'])],
  sand: [RAMP['ledger-q2'][3]!, ...rev(RAMP['ledger-q3'])],
  rock: refs('terminal.0', 'system.0', 'system.1', 'system.2', 'system.3', 'light-grey', 'paper-edge'),
  snow: refs('paper-edge', 'scroll-track', 'white'),
  /** Listening Post teals, then the Ledger's Q5 blues. */
  sea: [...RAMP.listening, ...rev(RAMP['ledger-q5'])],
  pad: refs('button-hover.1', 'highlight'),
  /** Woods: the darkest greens, so trees stand out from the grass. */
  canopy: [...RAMP.files, RAMP['ledger-q4'][3]!],
  trunk: refIndex('brown'),
  hull: refs('dark-grey', 'muted', 'light-grey', 'paper-edge', 'white'),
  trim: [...RAMP.hr],
  flame: RAMP.heat.slice(18),
  sky: [...RAMP.sky],
  night: refIndex('desktop'),
  shadow: refIndex('black'),
} as const;

/** A step from a material: `light` is 0 (in shade) to 1 (facing the light). */
export function shade(material: readonly number[], light: number, parity = 0): number {
  const top = material.length - 1 - (material.length > 3 ? 1 : 0);
  const step = Math.round(Math.max(0, Math.min(1, light)) * top) + parity;
  return material[Math.min(material.length - 1, step)]!;
}
