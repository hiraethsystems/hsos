/**
 * Every app the desktop knows, plus the ones Finance has not yet approved. New apps are added
 * here and nowhere else.
 */
import type { LinkableApp } from '../links';
import { APP_STATIC_URL } from '../links';
import type { HsosApp } from '../types';
import { pageApp } from './page';

export const APPS: Readonly<Record<string, HsosApp>> = {
  [pageApp.id]: pageApp,
};

/** Apps still being built (Phases 4 and 5). Opening one shows its HR memo instead. */
export const PENDING_APPS: Readonly<Record<string, string>> = {
  board: 'The Board is in session and cannot be disturbed. Consultations open next quarter.',
  listening: 'Listening Post 7 is being recalibrated. Intercepts will resume next quarter.',
  ledger: 'The Ledger is being audited. Figures will be released once they look better.',
  settings: 'Workplace Settings are under review by the Compliance Committee. Your preferences have been noted.',
  terminal: 'The legacy text layer is being restored from tape. Please hold.',
};

/** Resolve a name used in links and menus (`welcome`, `board`, ...) to an app and its arguments. */
export function resolveAppName(name: string): { appId: string; args?: Record<string, string> } {
  const staticUrl = APP_STATIC_URL[name as LinkableApp];
  if (staticUrl) return { appId: 'page', args: { url: staticUrl } };
  return { appId: name };
}
