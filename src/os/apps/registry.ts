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

export const APPS: Readonly<Record<string, HsosApp>> = {
  [pageApp.id]: pageApp,
  [boardApp.id]: boardApp,
  [ledgerApp.id]: ledgerApp,
  [listeningApp.id]: listeningApp,
  [settingsApp.id]: settingsApp,
};

/** Apps still being built (Phase 5). Opening one shows its HR memo instead. */
export const PENDING_APPS: Readonly<Record<string, string>> = {
  terminal: 'The legacy text layer is being restored from tape. Please hold.',
};

/** Resolve a name used in links and menus (`welcome`, `board`, ...) to an app and its arguments. */
export function resolveAppName(name: string): { appId: string; args?: Record<string, string> } {
  const staticUrl = APP_STATIC_URL[name as LinkableApp];
  if (staticUrl) return { appId: 'page', args: { url: staticUrl } };
  return { appId: name };
}
