/**
 * The Board's vocabulary (SPEC 15). Shared text, so the terminal can consult the Board too
 * without reaching into the Board app. Capitalisation is part of the effect. Extend freely,
 * keeping the mix of corporate and melancholy.
 */
export const BOARD_WORDS = [
  'QUARTERLY', 'ripple', 'LEVERAGE', 'yearning', 'dividend', 'SEAMLESS', 'synergy', 'impermanence',
  'PIVOT', 'gently', 'ALIGN', 'longing', 'stakeholder', 'TIDE', 'circle back', 'bandwidth',
  'HIRAETH', 'dawn', 'SCALE', 'static', 'compliance', 'grace', 'DISRUPT', 'mist', 'offboard',
  'ETERNAL', 'headcount', 'moth', 'DELIVERABLE', 'harbour', 'optimise', 'silence', 'KPI',
  'reception', 'onboarding', 'ghost', 'VERTICAL', 'sea', 'runway', 'dusk',
] as const;

/** A six word directive from the Board. */
export function boardDirective(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => BOARD_WORDS[Math.floor(random() * BOARD_WORDS.length)]).join(' ');
}
