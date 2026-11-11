/**
 * The app contract (SPEC 12). Every app is a folder in src/os/apps/<id>/ exporting one of
 * these. Apps draw only their window contents; the window manager owns the chrome, title,
 * dragging, resizing, scrolling and focus.
 */
import type { JSX } from 'preact';
import type { AnimationClock } from './clock';
import type { TitleRampName } from './palette';
import type { Settings } from './settings';
import type { IconName } from './sprites/icons';
import type { TerminalCommand } from './terminal/types';
import type { Vfs, VfsMount } from './vfs/vfs';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AppArgs = Readonly<Record<string, string>>;

/** What an app needs from the desktop. Only this, never another app's internals. */
export interface AppProps {
  args: AppArgs;
  /** Open (or focus) an app or a page. */
  open: (appId: string, args?: AppArgs) => void;
  /** Show an HR memo. */
  memo: (text: string) => void;
  settings: Settings;
  /** Change some settings. The desktop saves them and every app sees the new values. */
  updateSettings: (patch: Partial<Settings>) => void;
  /** What the app may animate, for use with `useTick` from `clock.ts`. */
  clock: AnimationClock;
  /** The filesystem, shared by every app. */
  vfs: Vfs;
  /** Terminal commands added by apps (the terminal has its own core set). */
  commands: readonly TerminalCommand[];
  /** Play the full boot again. */
  reboot: () => void;
}

/** The chrome of one window, which can depend on its arguments (one viewer, many pages). */
export interface WindowChrome {
  /** Filesystem path shown in the title bar. */
  path: string;
  ramp: TitleRampName;
}

export interface HsosApp {
  id: string;
  title: string;
  /** Chrome for a window of this app. Static apps return the same every time. */
  chrome: (args: AppArgs) => WindowChrome;
  icon?: IconName;
  /** Preferred size; the window manager places it and keeps it on screen. */
  defaultSize: (args: AppArgs) => { w: number; h: number };
  minSize?: { w: number; h: number };
  /** Default true: opening again focuses the existing window. Keyed by `windowKey`. */
  singleton?: boolean;
  /** For apps with many windows (the page viewer), what makes two windows "the same". */
  windowKey?: (args: AppArgs) => string;
  /** Terminal commands this app adds. */
  commands?: readonly TerminalCommand[];
  /** Files and directories this app adds to the filesystem. */
  vfs?: readonly VfsMount[];
  component: (props: AppProps) => JSX.Element;
}
