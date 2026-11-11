/**
 * Terminal commands (SPEC 10). Commands are registered, not hard-coded: the terminal has its
 * core set, and any app may add more through the `commands` field of its manifest.
 */
import type { Settings } from '../settings';
import type { AppArgs } from '../types';
import type { Vfs } from '../vfs/vfs';

/** How a line of output is coloured. */
export type Tone = 'text' | 'prompt' | 'error' | 'listing' | 'notice';

export interface Line {
  text: string;
  tone?: Tone;
  /** A palette custom property (`var(--ramp-heat-4)`): draws a colour swatch before the text. */
  swatch?: string;
}

export interface CommandContext {
  /** The words after the command name. */
  args: readonly string[];
  /** Everything after the command name, as typed. */
  rest: string;
  cwd: string;
  setCwd: (path: string) => void;
  vfs: Vfs;
  print: (...lines: (string | Line)[]) => void;
  clear: () => void;
  open: (appId: string, args?: AppArgs) => void;
  memo: (text: string) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  reboot: () => void;
}

export interface TerminalCommand {
  name: string;
  aliases?: readonly string[];
  /** For `help`, for example `ls [path]`. */
  usage: string;
  summary: string;
  /** What Tab completes after the command name. Default: paths. */
  completes?: 'paths' | 'nothing' | readonly string[];
  run: (ctx: CommandContext) => void;
}
