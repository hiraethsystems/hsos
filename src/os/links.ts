/**
 * The `hsos:` link scheme used in Markdown content (SPEC 11.1), for example
 * `[The Board](hsos:open/board)`.
 *
 * On static pages, a link whose app has a static page becomes an ordinary link to that page.
 * One without (The Board, the terminal and so on) becomes plain text marked with
 * `data-hsos-open`, so the desktop shell can turn it into a live object later. Either way the
 * attribute is kept, so the shell can open the app in a window instead of following the link.
 */
import { url } from './routes';

/** Every app id an `hsos:open/` link may name. A typo fails the build. */
export const LINKABLE_APPS = [
  'welcome',
  'divisions',
  'memos',
  'desk',
  'board',
  'listening',
  'ledger',
  'settings',
  'terminal',
  'survey',
] as const;
export type LinkableApp = (typeof LINKABLE_APPS)[number];

/** Apps that also exist as static pages. */
export const APP_STATIC_URL: Partial<Record<LinkableApp, string>> = {
  welcome: url.welcome,
  divisions: url.divisions,
  memos: url.memos,
  desk: url.desk,
};

/** Parse `hsos:open/<app>`. Throws on anything else, so mistakes show up at build time. */
export function parseHsosHref(href: string): LinkableApp {
  const m = /^hsos:open\/([a-z0-9-]+)$/.exec(href);
  if (!m || !(LINKABLE_APPS as readonly string[]).includes(m[1]!)) {
    throw new Error(`Unknown HSOS link "${href}". Use hsos:open/<app>, where <app> is one of: ${LINKABLE_APPS.join(', ')}.`);
  }
  return m[1] as LinkableApp;
}
