/**
 * The HSOS palette: exactly 256 colours, as approved by Finance.
 *
 * This is the only file in `src/` allowed to contain colour values. Everything else asks for a
 * colour by name (`colour('ink')`), by ramp (`ramp('files')`), or in CSS through the custom
 * properties produced by `cssVariables()` (`var(--c-ink)`, `var(--ramp-files-0)`).
 * `npm run check` fails if a colour value turns up anywhere else.
 *
 * How slots are allocated, in order:
 *   1. Slots 0 to 15: the classic 16 colour text mode set (legacy terminal, /mnt/legacy).
 *   2. Ramps: runs of slots, either listed by hand or stepped between key colours.
 *   3. Named colours: single slots for UI ink, boot text, shadows and so on.
 *   4. Whatever is left is unspent, filled with black, and a source of concern for Finance.
 *
 * A ramp step or named colour may be written as a reference (`'@ink'` or `'@board.3'`) instead
 * of a hex value. A reference reuses an existing slot rather than taking a new one. Use it when
 * two things are deliberately the same colour (the scrollbar thumb *is* the Board purple).
 * Accidental repeats, such as the System and Terminal ramps sharing a grey, keep their own slots.
 */

export type Hex = `#${string}`;
type Ref = `@${string}`;
type ColourDef = Hex | Ref;

/** Number of slots in the palette. Not negotiable. */
export const PALETTE_SIZE = 256;

// ---------------------------------------------------------------------------------------------
// Stepping helpers (run once when the module loads, which for a static site means build time)
// ---------------------------------------------------------------------------------------------

function toRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: readonly number[]): Hex {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Step `n` colours evenly through a list of key colours (first and last are kept exactly). */
export function stepBetween(stops: readonly Hex[], n: number): Hex[] {
  if (stops.length < 2 || n < 2) throw new Error('stepBetween needs at least two stops and two steps');
  const out: Hex[] = [];
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(f));
    const a = toRgb(stops[k]!);
    const b = toRgb(stops[k + 1]!);
    const t = f - k;
    out.push(toHex(a.map((v, j) => v + (b[j]! - v) * t)));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// 1. Slots 0 to 15: classic text mode colours
// ---------------------------------------------------------------------------------------------

const TEXT_MODE = [
  ['black', '#000000'],
  ['blue', '#0000aa'],
  ['green', '#00aa00'],
  ['cyan', '#00aaaa'],
  ['red', '#aa0000'],
  ['magenta', '#aa00aa'],
  ['brown', '#aa5500'],
  ['light-grey', '#aaaaaa'],
  ['dark-grey', '#555555'],
  ['light-blue', '#5555ff'],
  ['light-green', '#55ff55'],
  ['light-cyan', '#55ffff'],
  ['light-red', '#ff5555'],
  ['light-magenta', '#ff55ff'],
  ['yellow', '#ffff55'],
  ['white', '#ffffff'],
] as const satisfies readonly (readonly [string, Hex])[];

// ---------------------------------------------------------------------------------------------
// 2. Ramps
// ---------------------------------------------------------------------------------------------

/**
 * `css` asks for a ready made stepped gradient custom property, `--bands-<name>`:
 * 'h' runs left to right, 'v' runs top to bottom.
 */
interface RampDef {
  colours: readonly ColourDef[];
  css?: 'h' | 'v';
}

const RAMP_DEFS = {
  // Effects and wallpapers (SPEC 4.1)
  heat: { colours: stepBetween(['#04001a', '#14005a', '#4a0a8a', '#a0208a', '#ff4a4a', '#ffaa2a', '#ffee66', '#ffffff'], 32) },
  cycle: { colours: stepBetween(['#ff3a8a', '#ff8a3a', '#ffd23a', '#3ad27a', '#3aa8ff', '#8a3aff', '#ff3a8a'], 24) },
  sky: { colours: stepBetween(['#140030', '#2a0a5a', '#5a1280', '#9a2090', '#e0407a', '#ff8a5a', '#ffc04a'], 12), css: 'v' },
  sun: { colours: stepBetween(['#fff27a', '#ffc04a', '#ff8a4a', '#ff5a6a', '#e03a8a'], 10) },
  grid: { colours: stepBetween(['#ff3ad1', '#a03aff', '#3ad1ff', '#a03aff', '#ff3ad1'], 16) },
  /** The sliced sun diamond logo, top to bottom. */
  logo: { colours: stepBetween(['#ffee66', '#ffaa2a', '#ff5a5a', '#d02a8a', '#6a1aa8'], 9) },
  workbench: { colours: ['#0a3a7a', '#0d4688', '#105296', '#145ea4', '#196ab2', '#1f76bf', '#2682cc'], css: 'v' },
  /** Boot progress bar. */
  progress: { colours: ['#ff3a8a', '#ff8a3a', '#ffd23a', '#3ad27a', '#3aa8ff'], css: 'h' },

  // Window title bars, dark to light (SPEC 4.3). Four were darkened in spec 1.1 so white
  // title text reaches 4.5:1 contrast on every band.
  docs: { colours: ['#1a1a8c', '#2a2aa8', '#3b3bc4', '#4d4de0'], css: 'h' },
  files: { colours: ['#0d6b3a', '#127440', '#167d46', '#1b864c'], css: 'h' },
  board: { colours: ['#5a0d6b', '#741a87', '#8f2aa3', '#ab3dbf'], css: 'h' },
  listening: { colours: ['#0a5a6b', '#0f6778', '#147386', '#198093'], css: 'h' },
  ledger: { colours: ['#8a3a00', '#93490a', '#9d5714', '#a6661e'], css: 'h' },
  hr: { colours: ['#8a1a3a', '#a02847', '#b63553', '#cc4360'], css: 'h' },
  system: { colours: ['#3a3a4e', '#4a4a62', '#5a5a76', '#6a6a8a'], css: 'h' },
  terminal: { colours: ['#2a2a3a', '#3a3a4e', '#4a4a62', '#5a5a76'], css: 'h' },

  // Menu bar and the highlighted menu item
  menubar: { colours: ['#1a0a4a', '#2a0f63', '#3d167d', '#531e96', '#6b28b0'], css: 'h' },
  'menu-hover': { colours: ['@docs.1', '@docs.2', '@docs.3', '#5a5af0'], css: 'h' },

  // Controls
  button: { colours: ['@board.3', '@board.2'], css: 'v' },
  'button-hover': { colours: ['#ffe066', '#ffc61a'], css: 'v' },
  'scroll-thumb': { colours: ['@board.1', '@board.3', '@board.0'], css: 'h' },
  /** The MORALE meter in the menu bar, best to worst. */
  morale: { colours: ['#26bf6c', '#7dd94a', '#ffe066', '#5a4a8a'] },

  // Ledger bar chart, one four step ramp per quarter (Q1 to Q7, then Q-infinity)
  'ledger-q1': { colours: stepBetween(['#ff8ab0', '#b0105a'], 4) },
  'ledger-q2': { colours: stepBetween(['#ffd08a', '#c66a10'], 4) },
  'ledger-q3': { colours: stepBetween(['#ffee88', '#c6a010'], 4) },
  'ledger-q4': { colours: stepBetween(['#9affb0', '#14874a'], 4) },
  'ledger-q5': { colours: stepBetween(['#9af0ff', '#0f7387'], 4) },
  'ledger-q6': { colours: stepBetween(['#a8a8ff', '#2a2aa8'], 4) },
  'ledger-q7': { colours: stepBetween(['#e0a8ff', '#741a87'], 4) },
  'ledger-q8': { colours: stepBetween(['#ffb0c0', '#8a1a3a'], 4) },
} as const satisfies Record<string, RampDef>;

export type RampName = keyof typeof RAMP_DEFS;

/** The ramps that colour window title bars. Each app picks one (SPEC 12). */
export const TITLE_RAMPS = ['docs', 'files', 'board', 'listening', 'ledger', 'hr', 'system', 'terminal'] as const satisfies readonly RampName[];
export type TitleRampName = (typeof TITLE_RAMPS)[number];

// ---------------------------------------------------------------------------------------------
// 3. Named colours
// ---------------------------------------------------------------------------------------------

const NAMED_DEFS = {
  // Ink (SPEC 4.1)
  ink: '#1a1a6b',
  link: '#b0105a',
  'link-hover': '@docs.1',
  highlight: '#ffe066', // link hover background, menu bar rule, open menu title
  muted: '#6a6a8a',
  success: '#14874a',
  accent: '#8f2aa3', // the word "employee", checkbox ticks
  disabled: '#a8a8c0',
  paper: '@white', // window bodies
  'paper-edge': '#c8c8d8', // unselected thumbnails, light borders
  'close-hover': '@hr.2',

  // Window shadows: a light tint of each app colour (SPEC 4.3)
  'shadow-docs': '#c8bfff',
  'shadow-files': '#b8e8c8',
  'shadow-board': '#e8c8f0',
  'shadow-listening': '#b8e0e8',
  'shadow-ledger': '#f0d8c0',
  'shadow-hr': '#f0c8d0',
  'shadow-system': '@paper-edge',
  'shadow-terminal': '@shadow-docs',
  'shadow-menu': '@ink',

  // Scrollbars (SPEC 4.4)
  'scroll-track': '#ece8ff',
  'scroll-check': '#ddd6ff',
  'scroll-light': '#e0a8ff',
  'scroll-dark': '#3a0a48',
  'scroll-button': '#d8d0f0',

  // Terminal (SPEC 10)
  'term-body': '#05050f',
  'term-text': '#c8c8d8',
  'term-prompt': '#7dff9a',
  'term-error': '#ff6a8a',
  'term-listing': '#9af0ff',
  'term-notice': '@highlight',

  // Boot screen (SPEC 8)
  'boot-bg': '@black',
  'boot-text': '@term-text',
  'boot-kernel': '#8a8aa8',
  'boot-ok': '#3aff7a',
  'boot-warn': '#ffd23a',
  'boot-fail': '#ff4a6a',
  'boot-frame': '#555577',

  // Wallpapers (SPEC 4.7)
  desktop: '#12002a',
  mountains: '#2a0a4a',
  'corporate-a': '@menubar.2',
  'corporate-b': '@menubar.3',
  'corporate-dot': '@highlight',
  'doldoc-paper': '#f6f3ff',
  'doldoc-dot': '#e2dcff',

  // Effects
  scanline: '@black', // the only colour drawn with reduced opacity (SPEC 4.1, decided 1.1)
} as const satisfies Record<string, ColourDef>;

export type ColourName = keyof typeof NAMED_DEFS | (typeof TEXT_MODE)[number][0];

// ---------------------------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------------------------

const UNSPENT_FILL: Hex = '#000000';

const slots: Hex[] = [];
const named = new Map<string, number>();
const ramps = new Map<string, number[]>();

function allocate(hex: Hex): number {
  if (!/^#[0-9a-f]{6}$/.test(hex)) throw new Error(`palette: "${hex}" is not a lower case #rrggbb colour`);
  slots.push(hex);
  if (slots.length > PALETTE_SIZE) {
    throw new Error(`palette: over budget. Finance approved ${PALETTE_SIZE} colours, not ${slots.length}.`);
  }
  return slots.length - 1;
}

/** Turn a colour definition into a slot index, reusing a slot for references. */
function resolve(def: ColourDef, where: string): number {
  if (!def.startsWith('@')) return allocate(def as Hex);
  const ref = def.slice(1);
  const dot = ref.lastIndexOf('.');
  if (dot > 0 && ramps.has(ref.slice(0, dot))) {
    const slot = ramps.get(ref.slice(0, dot))![Number(ref.slice(dot + 1))];
    if (slot !== undefined) return slot;
  }
  const slot = named.get(ref);
  if (slot !== undefined) return slot;
  throw new Error(`palette: ${where} refers to "${def}", which is not defined above it`);
}

for (const [name, hex] of TEXT_MODE) named.set(name, allocate(hex));
for (const [name, def] of Object.entries(RAMP_DEFS) as [string, RampDef][]) {
  ramps.set(name, def.colours.map((c, i) => resolve(c, `ramp ${name}[${i}]`)));
}
for (const [name, def] of Object.entries(NAMED_DEFS) as [string, ColourDef][]) {
  named.set(name, resolve(def, `colour ${name}`));
}

/** How many slots nothing uses. Finance would like to know. */
export const UNSPENT_SLOTS = PALETTE_SIZE - slots.length;
while (slots.length < PALETTE_SIZE) slots.push(UNSPENT_FILL);

// ---------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------

/** All 256 colours, by slot index. Sprites are arrays of these indices. */
export const PALETTE: readonly Hex[] = Object.freeze(slots);

/** Slot index of every named colour. */
export const SLOT = Object.freeze(Object.fromEntries(named)) as Readonly<Record<ColourName, number>>;

/** Slot indices of every ramp, dark to light (or in cycling order). */
export const RAMP: Readonly<Record<RampName, readonly number[]>> = Object.freeze(
  Object.fromEntries(ramps) as Record<RampName, number[]>,
);

export const RAMP_NAMES = Object.keys(RAMP_DEFS) as RampName[];
export const COLOUR_NAMES = [...named.keys()] as ColourName[];

/** A named colour as hex. */
export function colour(name: ColourName): Hex {
  return PALETTE[SLOT[name]]!;
}

/** A ramp as hex colours. */
export function ramp(name: RampName): Hex[] {
  return RAMP[name].map((i) => PALETTE[i]!);
}

/** Step `i` of a ramp, wrapping round. This is what palette rotation (colour cycling) uses. */
export function rampStep(name: RampName, i: number): Hex {
  const r = RAMP[name];
  return PALETTE[r[((i % r.length) + r.length) % r.length]!]!;
}

/**
 * A stepped (hard edged) CSS gradient: equal bands, no blending. The only kind of gradient
 * HSOS permits. Accepts hex colours or `var(...)` strings.
 */
export function bands(colours: readonly string[], direction: 'h' | 'v' = 'h'): string {
  const n = colours.length;
  const pct = (k: number) => `${+((k * 100) / n).toFixed(3)}%`;
  const stops = colours.map((c, i) => `${c} ${pct(i)} ${pct(i + 1)}`);
  return `linear-gradient(${direction === 'h' ? '90deg' : '180deg'}, ${stops.join(', ')})`;
}

/**
 * The palette as CSS custom properties, for one `<style>` block in the page head:
 *   --c-<name>         every named colour
 *   --ramp-<name>-<i>  every ramp step
 *   --bands-<name>     a stepped gradient, for ramps that ask for one
 */
export function cssVariables(): string {
  const lines: string[] = [];
  for (const name of COLOUR_NAMES) lines.push(`--c-${name}: ${colour(name)};`);
  for (const name of RAMP_NAMES) {
    ramp(name).forEach((hex, i) => lines.push(`--ramp-${name}-${i}: ${hex};`));
    const css = (RAMP_DEFS[name] as RampDef).css;
    if (css) lines.push(`--bands-${name}: ${bands(ramp(name).map((_, i) => `var(--ramp-${name}-${i})`), css)};`);
  }
  return `:root {\n  ${lines.join('\n  ')}\n}`;
}

/** A colour by name (`'ink'`) or by ramp step (`'board.3'`). Used by sprites. */
export type ColourRef = ColourName | `${RampName}.${number}`;

/** Slot index of a colour reference. Throws on an unknown reference. */
export function refIndex(ref: ColourRef): number {
  const dot = ref.lastIndexOf('.');
  if (dot > 0) {
    const r = (RAMP as Record<string, readonly number[] | undefined>)[ref.slice(0, dot)];
    const slot = r?.[Number(ref.slice(dot + 1))];
    if (slot !== undefined) return slot;
  }
  const slot = (SLOT as Record<string, number | undefined>)[ref];
  if (slot === undefined) throw new Error(`palette: unknown colour reference "${ref}"`);
  return slot;
}

/** Red, green and blue (0 to 255) of a palette slot, for drawing to a canvas. */
export function slotRgb(slot: number): [number, number, number] {
  return toRgb(PALETTE[slot]!);
}
