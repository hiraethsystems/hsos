/**
 * Settings store (SPEC 3.4). Lives in localStorage under `hsos.settings.v1`. Every read and
 * write is wrapped in try/catch: the site must work when storage is blocked, it just forgets.
 */
import { THEME_IDS, WALLPAPER_IDS, type ThemeId, type WallpaperId } from './palette';

export const WALLPAPERS: readonly WallpaperId[] = WALLPAPER_IDS;
export const THEMES: readonly ThemeId[] = THEME_IDS;
export type { ThemeId, WallpaperId };

export interface Settings {
  /** The colour theme, a palette swap (SPEC 4.9). */
  theme: ThemeId;
  wallpaper: WallpaperId;
  /** Colour cycling (palette animation). Always off under prefers-reduced-motion. */
  cycle: boolean;
  scanlines: boolean;
  /** Play the full boot on every visit, not just the first. */
  fullBootEveryVisit: boolean;
  /** Set once the visitor has seen a full boot in this browser. */
  seenBoot: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'hsos',
  wallpaper: 'sunset',
  cycle: true,
  scanlines: false,
  fullBootEveryVisit: false,
  seenBoot: false,
};

const KEY = 'hsos.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const s = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
    return {
      theme: (THEMES as readonly unknown[]).includes(s.theme) ? (s.theme as ThemeId) : DEFAULT_SETTINGS.theme,
      wallpaper: (WALLPAPERS as readonly unknown[]).includes(s.wallpaper) ? (s.wallpaper as WallpaperId) : DEFAULT_SETTINGS.wallpaper,
      cycle: typeof s.cycle === 'boolean' ? s.cycle : DEFAULT_SETTINGS.cycle,
      scanlines: typeof s.scanlines === 'boolean' ? s.scanlines : DEFAULT_SETTINGS.scanlines,
      fullBootEveryVisit: typeof s.fullBootEveryVisit === 'boolean' ? s.fullBootEveryVisit : DEFAULT_SETTINGS.fullBootEveryVisit,
      seenBoot: s.seenBoot === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked or full. Settings last until the tab closes, which is policy anyway.
  }
}

/** True when the visitor has asked for less motion. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** "Plain view": the visitor chose to read pages without the desktop, for this tab. */
const PLAIN_KEY = 'hsos.plain';
export function plainViewChosen(): boolean {
  try {
    return window.sessionStorage.getItem(PLAIN_KEY) === '1';
  } catch {
    return false;
  }
}
export function setPlainView(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(PLAIN_KEY, '1');
    else window.sessionStorage.removeItem(PLAIN_KEY);
  } catch {
    // Without storage, plain view lasts for this page only.
  }
}
