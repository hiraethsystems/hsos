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
  /** The sliced sun diamond logo, top to bottom. */
  logo: { colours: stepBetween(['#ffee66', '#ffaa2a', '#ff5a5a', '#d02a8a', '#6a1aa8'], 9) },
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
  'doldoc-paper': '#f6f3ff',
  'doldoc-dot': '#e2dcff',

  // Effects
  // Text and chrome roles that themes recolour (SPEC 4.9). In the HSOS theme they are the
  // same slots as the colours named, so they cost nothing here.
  'title-text': '@white', // title bars and the [X]
  'menu-text': '@white', // menu bar titles
  'menu-focus-text': '@white', // a focused menu item, a hovered asset row
  'menu-accent': '@highlight', // the MORALE label
  'highlight-text': '@ink', // text sitting on the highlight colour
  'button-text': '@white',
  'win-face': '@paper', // the window frame, for themes with bevelled windows
  'bevel-light': '@white',
  'bevel-shade': '@muted',
  'bevel-dark': '@ink',

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

// ---------------------------------------------------------------------------------------------
// Wallpapers (SPEC 4.7)
// ---------------------------------------------------------------------------------------------
//
// Each wallpaper brings its own colours, which load into the slots the system leaves free,
// as a 256 colour picture would on a real palette display. So a wallpaper looks the same under
// every theme, and any theme with any wallpaper still comes to 256 colours or fewer (checked
// below). A wallpaper may refer to its own colours (`'@sky.3'`) or to system slots no theme
// changes (the text mode set, `sky`). CSS wallpapers read `--wp-<id>-<name>`,
// `--wp-<id>-<ramp>-<i>` and `--wpb-<id>-<ramp>`; canvas wallpapers ask `wallpaperColours()`.

interface WallpaperDef {
  ramps?: Record<string, RampDef>;
  colours?: Record<string, ColourDef>;
}

const WALLPAPER_DEFS = {
  sunset: {
    ramps: {
      sun: { colours: stepBetween(['#fff27a', '#ffc04a', '#ff8a4a', '#ff5a6a', '#e03a8a'], 10) },
      grid: { colours: stepBetween(['#ff3ad1', '#a03aff', '#3ad1ff', '#a03aff', '#ff3ad1'], 16) },
    },
    colours: { night: '#12002a', mountains: '#2a0a4a' },
  },
  corporate: { colours: { a: '#3d167d', b: '#531e96', dot: '#ffe066' } },
  workbench: { ramps: { bands: { colours: ['#0a3a7a', '#0d4688', '#105296', '#145ea4', '#196ab2', '#1f76bf', '#2682cc'], css: 'v' } } },
  paper: { colours: { paper: '#f6f3ff', dot: '#e2dcff' } },

  /** Teal Horizon, for Workstation 95: the company sunset in sixteen colour VGA, on teal. */
  teal: {
    ramps: {
      sky: { colours: stepBetween(['#003c3c', '#008080', '#00a8a8'], 8) },
      sun: { colours: ['#ffff00', '#ffd800', '#ffb000', '#ff8000', '#ff4000', '#e00040', '#a00060', '#800080'] },
      floor: { colours: ['#004848', '#00c0c0'] },
    },
    colours: { ground: '#006060', hill: '#005050' },
  },
  /** READY., for Home Office 64: a blue screen, a raster sunset and a banner. */
  ready: {
    ramps: {
      raster: { colours: ['#000000', '#352879', '#6c5eb5', '#70a4b2', '#ffffff', '#70a4b2', '#6c5eb5', '#352879'] },
      sunset: { colours: ['#6f3d86', '#68372b', '#9a6759', '#6f4f25', '#b8c76f'] },
      /** The cursor: colour cycling flips it between these, so it blinks. */
      blink: { colours: ['@text', '@screen'] },
    },
    colours: { border: '#6c5eb5', screen: '#352879', text: '#a59cf2', grid: '#6c5eb5', ground: '#000000', sun: '#b8c76f' },
  },
  /** Pinboard, for Archimedes: textured grey, with the sunset pinned up in a frame. */
  pinboard: {
    ramps: {
      stone: { colours: ['#6a6a6a', '#777777', '#808080', '#8c8c8c'] },
      sky: { colours: ['#004499', '#0066bb', '#00bbff', '#eeeebb'] },
      sun: { colours: ['#eeee00', '#ffbb00', '#dd0000'] },
    },
    colours: { frame: '#ffffff', edge: '#000000', shade: '#555555', land: '#558800', pin: '#dd0000' },
  },
  /** Copper, for Workbench 1.3: copper bars over a checkered floor. */
  copper: {
    ramps: {
      bar: { colours: ['#552200', '#883300', '#bb5500', '#ff8800', '#ffbb55', '#ffeecc', '#ffbb55', '#ff8800', '#bb5500', '#883300'] },
      cool: { colours: ['#002255', '#003b88', '#2266bb', '#77aaee', '#ddeeff', '#77aaee', '#2266bb', '#003b88'] },
    },
    colours: { sky: '#0055aa', check: '#ffffff', checkb: '#ff8800', horizon: '#000022' },
  },
  /** Plaza, for Plaza 1999: busts, columns, a dolphin and the grid. */
  plaza: {
    ramps: {
      sky: { colours: stepBetween(['#1a0040', '#4a0a7a', '#a0208a', '#ff5aa0', '#ffb0a0', '#ffe0c0'], 10) },
      sun: { colours: ['#fff07a', '#ffd06a', '#ffa86a', '#ff7a8a', '#ff5aa8', '#e03ac0'] },
      marble: { colours: ['#ffffff', '#ece4f4', '#cfc0de', '#a796bf', '#796895'] },
      grid: { colours: ['#00ffff', '#ff4ad8', '#b04aff', '#ff4ad8'] },
      dolphin: { colours: ['#d6f6ff', '#6ad0ee', '#2a8ac8', '#1a5a9a'] },
    },
    colours: { floor: '#1a0030', palm: '#0a3a4a', leaf: '#1a7a6a', sea: '#2a1a6a' },
  },
  /** Closing Time, for Late Appointment: a barber's at dusk in a pastel city. */
  salon: {
    ramps: {
      sky: { colours: ['#1a1840', '#2a2458', '#423070', '#64408a', '#8c509a', '#b862a0', '#e07aa2', '#ffa0a0'] },
      tower: { colours: ['#16133a', '#211c4a', '#2c255a'] },
      lit: { colours: ['#ffd8a8', '#ff9ac8', '#9ae8ff'] },
      pole: { colours: ['#ff4a6a', '#ffffff', '#4a7aff', '#ffffff'] },
    },
    colours: { moon: '#fff4d8', wall: '#3a2a5a', glass: '#5a4a8a', glow: '#8a7ac0', neon: '#ff7ac8', neonb: '#7affea', cap: '#d0d0e0', street: '#141030', kerb: '#2a2048' },
  },
  /** Poolside, for Resort '84: a blue sky, a white villa, palms and a pool. */
  poolside: {
    ramps: {
      sky: { colours: ['#0a2ab8', '#0a3ad0', '#1a5ae0', '#3a7aec', '#5a9af4', '#8ac0fc'] },
      water: { colours: ['#0088b8', '#00a8d0', '#20c8e0', '#80ecf4'] },
      leaf: { colours: ['#06603a', '#0a8a4a', '#2ab05a'] },
    },
    colours: { cloud: '#ffffff', cloudb: '#d0e4ff', villa: '#f8f6f0', shade: '#c4cce0', wall: '#ff8ab0', walld: '#e0608e', tile: '#ffffff', trunk: '#a06a40', sun: '#ffe040', deck: '#f0d8a8' },
  },
} as const satisfies Record<string, WallpaperDef>;

export type WallpaperId = keyof typeof WALLPAPER_DEFS;
export const WALLPAPER_IDS = Object.keys(WALLPAPER_DEFS) as WallpaperId[];

interface ResolvedWallpaper {
  colours: Record<string, Hex>;
  ramps: Record<string, Hex[]>;
  /** New slots it takes; references to other slots cost nothing. */
  slots: number;
  /** The colours of those slots, in order. */
  own: Hex[];
}

/** The hex value of a system colour or ramp step, for references from outside the system. */
function systemHex(ref: string): Hex | undefined {
  const dot = ref.lastIndexOf('.');
  if (dot > 0 && ramps.has(ref.slice(0, dot))) {
    const slot = ramps.get(ref.slice(0, dot))![Number(ref.slice(dot + 1))];
    if (slot !== undefined) return slots[slot];
  }
  const slot = named.get(ref);
  return slot === undefined ? undefined : slots[slot];
}

function resolveWallpaper(id: string, def: WallpaperDef): ResolvedWallpaper {
  const out: ResolvedWallpaper = { colours: {}, ramps: {}, slots: 0, own: [] };
  const own = new Map<string, Hex>();
  const one = (c: ColourDef, where: string): Hex => {
    if (!c.startsWith('@')) {
      out.slots++;
      out.own.push(c as Hex);
      return c as Hex;
    }
    const hex = own.get(c.slice(1)) ?? systemHex(c.slice(1));
    if (!hex) throw new Error(`palette: wallpaper ${id} ${where} refers to unknown "${c}"`);
    return hex;
  };
  for (const [name, c] of Object.entries(def.colours ?? {})) {
    out.colours[name] = one(c, name);
    own.set(name, out.colours[name]);
  }
  for (const [name, r] of Object.entries(def.ramps ?? {})) {
    out.ramps[name] = r.colours.map((c, i) => {
      const hex = one(c, `${name}[${i}]`);
      own.set(`${name}.${i}`, hex);
      return hex;
    });
  }
  return out;
}

const WALLPAPERS: Record<string, ResolvedWallpaper> = Object.fromEntries(
  Object.entries(WALLPAPER_DEFS).map(([id, def]) => [id, resolveWallpaper(id, def as WallpaperDef)]),
);

/** A wallpaper's colours, for drawing it to a canvas. */
export function wallpaperColours(id: WallpaperId): Readonly<ResolvedWallpaper> {
  return WALLPAPERS[id]!;
}

// ---------------------------------------------------------------------------------------------
// Themes (SPEC 4.9)
// ---------------------------------------------------------------------------------------------
//
// A theme is a palette swap. It keeps the system's slot layout and gives slots new values, as
// loading a new palette into the video hardware would. It may recolour any ramp or named
// colour except the text mode set, which every theme shares. A theme value may be a reference
// (`'@docs.0'`), which shares that slot under the theme. Every theme, with any wallpaper, must
// still fit in 256 colours; the build fails otherwise.

type SystemColourName = keyof typeof NAMED_DEFS;
interface ThemeDef {
  name: string;
  /** What it is after, for the Settings window. */
  after: string;
  wallpaper: WallpaperId;
  ramps?: Partial<Record<RampName, readonly ColourDef[]>>;
  colours?: Partial<Record<SystemColourName, ColourDef>>;
}

/** Every title ramp the same, as classic desktops did. The others share the first's slots. */
function titles(r: readonly ColourDef[]): Partial<Record<RampName, readonly ColourDef[]>> {
  const ref = r.map((_, i) => `@docs.${i}` as const);
  return { docs: r, files: ref, board: ref, listening: ref, ledger: ref, hr: ref, system: ref, terminal: ref };
}
/** Every window shadow the same colour. */
function shadows(c: ColourDef): Partial<Record<SystemColourName, ColourDef>> {
  const ref = '@shadow-docs' as const;
  return {
    'shadow-docs': c,
    'shadow-files': ref,
    'shadow-board': ref,
    'shadow-listening': ref,
    'shadow-ledger': ref,
    'shadow-hr': ref,
    'shadow-system': ref,
    'shadow-terminal': ref,
    'shadow-menu': ref,
  };
}

const THEME_DEFS = {
  hsos: { name: 'HSOS 256', after: 'The house style', wallpaper: 'sunset' },

  win9x: {
    name: 'Workstation 95',
    after: 'Windows 95 and 98',
    wallpaper: 'teal',
    ramps: {
      ...titles(['#000080', '#062a96', '#0c44a6', '#1258b4']),
      menubar: ['#c0c0c0', '@menubar.0', '@menubar.0', '@menubar.0', '@menubar.0'],
      'menu-hover': ['@docs.0', '@docs.0', '@docs.0', '@docs.0'],
      button: ['#c0c0c0', '@button.0'],
      'button-hover': ['#d4d0c8', '@button-hover.0'],
      'scroll-thumb': ['@button.0', '@button.0', '@button.0'],
    },
    colours: {
      ...shadows('#808080'),
      ink: '#000000',
      link: '#0000c0',
      'link-hover': '#ffffff',
      highlight: '#000080',
      'highlight-text': '@link-hover',
      muted: '#595959',
      success: '#007000',
      accent: '@highlight',
      disabled: '@shadow-docs',
      'paper-edge': '@menubar.0',
      'close-hover': '#dfdfdf',
      'scroll-track': '@menubar.0',
      'scroll-check': '@link-hover',
      'scroll-light': '@link-hover',
      'scroll-dark': '@ink',
      'scroll-button': '@menubar.0',
      desktop: '#008080',
      'title-text': '@link-hover',
      'menu-text': '@ink',
      'menu-accent': '@highlight',
      'button-text': '@ink',
      'win-face': '@menubar.0',
      'bevel-light': '@link-hover',
      'bevel-shade': '@shadow-docs',
      'bevel-dark': '@ink',
    },
  },

  c64: {
    name: 'Home Office 64',
    after: 'The Commodore 64',
    wallpaper: 'ready',
    ramps: {
      ...titles(['#352879', '#463a8f', '#5a4ca3', '#6c5eb5']),
      menubar: ['#6c5eb5', '@docs.3', '@docs.3', '@docs.3', '@docs.3'],
      'menu-hover': ['@docs.1', '@docs.2', '@docs.3', '@docs.3'],
      button: ['@docs.3', '@docs.2'],
      'button-hover': ['#70a4b2', '#5f93a1'],
      'scroll-thumb': ['@docs.3', '#9a8ee0', '@docs.2'],
    },
    colours: {
      ...shadows('#000000'),
      ink: '#d0cafb',
      link: '#b8c76f',
      'link-hover': '#000000',
      highlight: '#70a4b2',
      'highlight-text': '@link-hover',
      muted: '#a8a8a8',
      success: '#9ad284',
      accent: '@highlight',
      disabled: '#6c6c6c',
      paper: '#352879',
      'paper-edge': '@docs.3',
      'close-hover': '@docs.1',
      'scroll-track': '@paper',
      'scroll-check': '@docs.1',
      'scroll-light': '#959595',
      'scroll-dark': '@shadow-docs',
      'scroll-button': '@docs.3',
      'term-body': '@paper',
      'term-text': '@ink',
      'term-prompt': '@success',
      'term-listing': '@highlight',
      desktop: '@docs.3',
      'title-text': '#ffffff',
      'menu-text': '@title-text',
      'menu-focus-text': '@title-text',
      'button-text': '@title-text',
      'win-face': '@docs.3',
      'bevel-light': '@scroll-thumb.1',
      'bevel-shade': '@docs.1',
      'bevel-dark': '@shadow-docs',
    },
  },

  riscos: {
    name: 'Archimedes',
    after: 'RISC OS 3 on the Acorn Archimedes',
    wallpaper: 'pinboard',
    ramps: {
      ...titles(['#eeeebb', '@docs.0', '@docs.0', '@docs.0']),
      menubar: ['#dddddd', '@menubar.0', '@menubar.0', '@menubar.0', '@menubar.0'],
      'menu-hover': ['#333333', '@menu-hover.0', '@menu-hover.0', '@menu-hover.0'],
      button: ['@menubar.0', '#bbbbbb'],
      'button-hover': ['@docs.0', '#dddd99'],
      'scroll-thumb': ['@menubar.0', '@menubar.0', '@menubar.0'],
    },
    colours: {
      ...shadows('#555555'),
      ink: '#000000',
      link: '#004499',
      'link-hover': '@ink',
      highlight: '@docs.0',
      'highlight-text': '@ink',
      muted: '#555555',
      success: '#2a6a00',
      accent: '@link',
      disabled: '#999999',
      'paper-edge': '@button.1',
      'close-hover': '@button.1',
      'scroll-track': '@disabled',
      'scroll-check': '@disabled',
      'scroll-light': '#ffffff',
      'scroll-dark': '@muted',
      'scroll-button': '@menubar.0',
      desktop: '#777777',
      'title-text': '@ink',
      'menu-text': '@ink',
      'menu-accent': '@link',
      'button-text': '@ink',
      'win-face': '@menubar.0',
      'bevel-light': '@scroll-light',
      'bevel-shade': '@disabled',
      'bevel-dark': '@muted',
    },
  },

  amiga: {
    name: 'Workbench 1.3',
    after: 'Workbench on the Commodore Amiga',
    wallpaper: 'copper',
    ramps: {
      ...titles(['#ffffff', '@docs.0', '@docs.0', '@docs.0']),
      menubar: ['@docs.0', '@docs.0', '@docs.0', '@docs.0', '@docs.0'],
      'menu-hover': ['#ff8800', '@menu-hover.0', '@menu-hover.0', '@menu-hover.0'],
      button: ['@docs.0', '#dddddd'],
      'button-hover': ['@menu-hover.0', '@menu-hover.0'],
      'scroll-thumb': ['@docs.0', '@docs.0', '@docs.0'],
    },
    colours: {
      ...shadows('#000022'),
      ink: '@docs.0',
      link: '#ffcc88',
      'link-hover': '@shadow-docs',
      highlight: '@menu-hover.0',
      'highlight-text': '@shadow-docs',
      muted: '#c8dcf0',
      success: '#99ff99',
      accent: '@menu-hover.0',
      disabled: '#7799cc',
      paper: '#0055aa',
      'paper-edge': '@docs.0',
      'close-hover': '@menu-hover.0',
      'scroll-track': '@paper',
      'scroll-check': '#1a66b3',
      'scroll-light': '@docs.0',
      'scroll-dark': '@shadow-docs',
      'scroll-button': '@docs.0',
      desktop: '@paper',
      'title-text': '@paper',
      'menu-text': '@paper',
      'menu-focus-text': '@shadow-docs',
      'menu-accent': '@menu-hover.0',
      'button-text': '@paper',
      'win-face': '@paper',
      'bevel-light': '@docs.0',
      'bevel-shade': '@disabled',
      'bevel-dark': '@shadow-docs',
    },
  },

  vaporwave: {
    name: 'Plaza 1999',
    after: 'Vaporwave',
    wallpaper: 'plaza',
    ramps: {
      ...titles(['#5a1a9a', '#7a1aa8', '#961aa0', '#b01a90']),
      menubar: ['#2a0a5a', '#4a0a7a', '#6a0a8a', '#860a88', '#a00a80'],
      'menu-hover': ['@docs.0', '@docs.1', '@docs.2', '@docs.3'],
      button: ['#e0b0f4', '#cc8ae6'],
      'button-hover': ['#7af5ff', '#4ad8e8'],
      'scroll-thumb': ['@button.1', '@button.0', '#7a2aa8'],
    },
    colours: {
      ...shadows('#ff6ec7'),
      ink: '#2d0a4a',
      link: '#a0106e',
      'link-hover': '@ink',
      highlight: '@button-hover.0',
      'highlight-text': '@ink',
      muted: '#6a4a7a',
      success: '#0a6a4a',
      accent: '#b01a90',
      disabled: '#b8a0c0',
      paper: '#fff4fb',
      'paper-edge': '#e0c8e8',
      'close-hover': '#ff3aa8',
      'scroll-track': '#ffe4f6',
      'scroll-check': '#ffcdee',
      'scroll-light': '#ffd0ff',
      'scroll-dark': '#3a0a5a',
      'scroll-button': '#f0c0ff',
      desktop: '#ff9ad5',
      'menu-accent': '@highlight',
      'button-text': '@ink',
      'win-face': '#e8d8f0',
      'bevel-light': '@paper',
      'bevel-shade': '@button.1',
      'bevel-dark': '@scroll-dark',
    },
  },

  barber: {
    name: 'Late Appointment',
    after: 'Barber Beats album art',
    wallpaper: 'salon',
    ramps: {
      ...titles(['#3a2a6a', '#5a3a7a', '#7a4a82', '#9a5a88']),
      menubar: ['#1a1638', '#241e48', '#2e2658', '#382e68', '#443878'],
      'menu-hover': ['@docs.0', '@docs.1', '@docs.2', '@docs.3'],
      button: ['@docs.3', '@docs.2'],
      'button-hover': ['#ffc8a8', '#ffb090'],
      'scroll-thumb': ['@docs.2', '@docs.3', '@docs.1'],
    },
    colours: {
      ...shadows('#c8a8d8'),
      ink: '#2a2350',
      link: '#a02a5a',
      'link-hover': '@ink',
      highlight: '@button-hover.0',
      'highlight-text': '@ink',
      muted: '#625a78',
      success: '#1a6a4a',
      accent: '#7a4ab0',
      disabled: '#b0a8c0',
      paper: '#fff8f0',
      'paper-edge': '#e8dcd8',
      'close-hover': '#c05a7a',
      'scroll-track': '#f4ecf4',
      'scroll-check': '#e8dcec',
      'scroll-light': '#e8c8f0',
      'scroll-dark': '@ink',
      'scroll-button': '#e0d0e8',
      desktop: '@menubar.0',
      'menu-accent': '@highlight',
    },
  },

  citypop: {
    name: "Resort '84",
    after: 'Japanese city pop artwork of the 1980s',
    wallpaper: 'poolside',
    ramps: {
      ...titles(['#0a2a9a', '#0a3aaa', '#0a4aba', '#0a5aca']),
      menubar: ['#04104a', '#061a6a', '#08248a', '#0a2eaa', '#0c38ca'],
      'menu-hover': ['@docs.0', '@docs.1', '@docs.2', '@docs.3'],
      button: ['#e0107a', '#c0106a'],
      'button-hover': ['#ffe040', '#ffd010'],
      'scroll-thumb': ['@docs.2', '#20b8d8', '@docs.0'],
    },
    colours: {
      ...shadows('#ff7ab0'),
      ink: '#0a1a5a',
      link: '#c8106a',
      'link-hover': '@ink',
      highlight: '@button-hover.0',
      'highlight-text': '@ink',
      muted: '#4a5a7a',
      success: '#007a5a',
      accent: '#0a7a9a',
      disabled: '#a0aac0',
      'paper-edge': '#c8d8f0',
      'close-hover': '@button.0',
      'scroll-track': '#e8f4ff',
      'scroll-check': '#d0e8ff',
      'scroll-light': '#9af0ff',
      'scroll-dark': '@menubar.0',
      'scroll-button': '#c8e0ff',
      desktop: '#1a5ad8',
      'menu-accent': '@highlight',
    },
  },
} as const satisfies Record<string, ThemeDef>;

export type ThemeId = keyof typeof THEME_DEFS;
export const THEME_IDS = Object.keys(THEME_DEFS) as ThemeId[];

interface ResolvedTheme {
  /** CSS custom property name (without the leading --) to hex, for every system colour. */
  vars: Map<string, Hex>;
  /** Slots this theme's system part takes. */
  slots: number;
  /** The theme's palette, slot by slot, before a wallpaper is loaded. */
  palette: Hex[];
}

function resolveTheme(id: string, def: ThemeDef): ResolvedTheme {
  const rampDef = (name: string, i: number): ColourDef => {
    const over = (def.ramps as Record<string, readonly ColourDef[]> | undefined)?.[name];
    if (over && over.length !== (RAMP_DEFS as Record<string, RampDef>)[name]!.colours.length) {
      throw new Error(`palette: theme ${id} ramp ${name} must keep its length`);
    }
    return over?.[i] ?? (RAMP_DEFS as Record<string, RampDef>)[name]!.colours[i]!;
  };
  const colourDef = (name: string): ColourDef | undefined =>
    (def.colours as Record<string, ColourDef> | undefined)?.[name] ?? (NAMED_DEFS as Record<string, ColourDef>)[name];
  const memo = new Map<string, Hex>();
  const value = (ref: string, depth = 0): Hex => {
    const hit = memo.get(ref);
    if (hit) return hit;
    if (depth > 20) throw new Error(`palette: theme ${id} has a reference loop at "${ref}"`);
    let d: ColourDef | undefined;
    const dot = ref.lastIndexOf('.');
    if (dot > 0 && ref.slice(0, dot) in RAMP_DEFS) d = rampDef(ref.slice(0, dot), Number(ref.slice(dot + 1)));
    else d = TEXT_MODE.find(([n]) => n === ref)?.[1] ?? colourDef(ref);
    if (!d) throw new Error(`palette: theme ${id} refers to unknown "${ref}"`);
    const hex = d.startsWith('@') ? value(d.slice(1), depth + 1) : (d as Hex);
    memo.set(ref, hex);
    return hex;
  };
  const vars = new Map<string, Hex>();
  const palette: Hex[] = TEXT_MODE.map(([, hex]) => hex);
  for (const [name, hex] of TEXT_MODE) vars.set(`c-${name}`, hex);
  for (const [name, r] of Object.entries(RAMP_DEFS) as [string, RampDef][]) {
    r.colours.forEach((_, i) => {
      const hex = value(`${name}.${i}`);
      vars.set(`ramp-${name}-${i}`, hex);
      if (!rampDef(name, i).startsWith('@')) palette.push(hex);
    });
  }
  for (const name of Object.keys(NAMED_DEFS)) {
    const hex = value(name);
    vars.set(`c-${name}`, hex);
    if (!colourDef(name)!.startsWith('@')) palette.push(hex);
  }
  return { vars, slots: palette.length, palette };
}

const THEMES: Record<string, ResolvedTheme> = Object.fromEntries(
  Object.entries(THEME_DEFS).map(([id, def]) => [id, resolveTheme(id, def as ThemeDef)]),
);

for (const [t, theme] of Object.entries(THEMES)) {
  for (const [w, wall] of Object.entries(WALLPAPERS)) {
    if (theme.slots + wall.slots > PALETTE_SIZE) {
      throw new Error(`palette: theme ${t} with wallpaper ${w} needs ${theme.slots + wall.slots} colours. Finance approved ${PALETTE_SIZE}.`);
    }
  }
}

export function themeName(id: ThemeId): string {
  return THEME_DEFS[id].name;
}
export function themeAfter(id: ThemeId): string {
  return THEME_DEFS[id].after;
}
/** The wallpaper a theme switches to when chosen. */
export function themeWallpaper(id: ThemeId): WallpaperId {
  return THEME_DEFS[id].wallpaper;
}
/** A few of a theme's colours, for its swatch in Settings (themes apply to the whole page). */
export function themePreview(id: ThemeId): { desktop: Hex; menubar: Hex; title: Hex[]; paper: Hex; ink: Hex; link: Hex } {
  const v = THEMES[id]!.vars;
  return {
    desktop: v.get('c-desktop')!,
    menubar: v.get('ramp-menubar-2')!,
    title: [0, 1, 2, 3].map((i) => v.get(`ramp-docs-${i}`)!),
    paper: v.get('c-paper')!,
    ink: v.get('c-ink')!,
    link: v.get('c-link')!,
  };
}

/** The full 256 colours in use with this theme and wallpaper, unspent slots as black. */
export function paletteFor(theme: ThemeId, wallpaper: WallpaperId): Hex[] {
  const w = WALLPAPERS[wallpaper]!;
  const out = [...THEMES[theme]!.palette, ...w.own];
  while (out.length < PALETTE_SIZE) out.push(UNSPENT_FILL);
  return out;
}

/** How many slots nothing uses with this theme and wallpaper. Finance would like to know. */
export function unspentFor(theme: ThemeId, wallpaper: WallpaperId): number {
  return PALETTE_SIZE - THEMES[theme]!.slots - WALLPAPERS[wallpaper]!.slots;
}

/** How many slots nothing uses in the house theme with the default wallpaper. */
export const UNSPENT_SLOTS = unspentFor('hsos', 'sunset');
slots.push(...WALLPAPERS.sunset!.own);
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
  // Wallpaper colours, each under its own names, so thumbnails can show them all at once.
  for (const [id, w] of Object.entries(WALLPAPERS)) {
    for (const [name, hex] of Object.entries(w.colours)) lines.push(`--wp-${id}-${name}: ${hex};`);
    for (const [name, hexes] of Object.entries(w.ramps)) {
      hexes.forEach((hex, i) => lines.push(`--wp-${id}-${name}-${i}: ${hex};`));
      const css = ((WALLPAPER_DEFS as Record<string, WallpaperDef>)[id]!.ramps?.[name])?.css;
      if (css) lines.push(`--wpb-${id}-${name}: ${bands(hexes.map((_, i) => `var(--wp-${id}-${name}-${i})`), css)};`);
    }
  }
  const blocks = [`:root {\n  ${lines.join('\n  ')}\n}`];
  // Each other theme is a palette swap: only the values that differ from the house theme.
  const base = THEMES.hsos!.vars;
  for (const id of THEME_IDS) {
    if (id === 'hsos') continue;
    const diff = [...THEMES[id]!.vars].filter(([k, hex]) => base.get(k) !== hex).map(([k, hex]) => `--${k}: ${hex};`);
    blocks.push(`:root[data-theme='${id}'] {\n  ${diff.join('\n  ')}\n}`);
  }
  return blocks.join('\n');
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
