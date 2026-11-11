/**
 * Every app the desktop knows, plus the ones Finance has not yet approved. New apps are added
 * here and nowhere else.
 */
import type { LinkableApp } from '../links';
import { APP_STATIC_URL } from '../links';
import type { HsosApp } from '../types';
import { boardApp } from './board';
import { ledgerApp } from './ledger';
import { listeningApp } from './listening';
import { pageApp } from './page';
import { settingsApp } from './settings';
import { terminalApp } from './terminal';

export const APPS: Readonly<Record<string, HsosApp>> = {
  [pageApp.id]: pageApp,
  [boardApp.id]: boardApp,
  [ledgerApp.id]: ledgerApp,
  [listeningApp.id]: listeningApp,
  [settingsApp.id]: settingsApp,
  [terminalApp.id]: terminalApp,
};

/** Terminal commands added by apps. */
export const APP_COMMANDS = Object.values(APPS).flatMap((a) => a.commands ?? []);
/** Files added to the filesystem by apps. */
export const APP_MOUNTS = Object.values(APPS).flatMap((a) => a.vfs ?? []);

/**
 * Apps announced but not built yet. Opening one shows its HR memo instead. Empty for now; add
 * an entry here when an app is promised before it exists.
 */
export const PENDING_APPS: Readonly<Record<string, string>> = {};

/** Resolve a name used in links and menus (`welcome`, `board`, ...) to an app and its arguments. */
export function resolveAppName(name: string): { appId: string; args?: Record<string, string> } {
  const staticUrl = APP_STATIC_URL[name as LinkableApp];
  if (staticUrl) return { appId: 'page', args: { url: staticUrl } };
  return { appId: name };
}
