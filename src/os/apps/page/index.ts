/** The page viewer app: one window per static page (Welcome, Divisions, dossiers, memos). */
import type { TitleRampName } from '../../palette';
import { describeUrl, type PageKind } from '../../routes';
import type { HsosApp } from '../../types';
import { PageView } from './PageView';

const RAMP: Record<PageKind, TitleRampName> = {
  home: 'docs',
  welcome: 'docs',
  desk: 'docs',
  memos: 'docs',
  memo: 'docs',
  divisions: 'files',
  division: 'files',
  dossier: 'hr',
};

const SIZE: Partial<Record<PageKind, { w: number; h: number }>> = {
  welcome: { w: 660, h: 480 },
  divisions: { w: 560, h: 400 },
  division: { w: 520, h: 340 },
  dossier: { w: 700, h: 500 },
  memo: { w: 640, h: 520 },
};

export const pageApp: HsosApp = {
  id: 'page',
  title: 'Document viewer',
  chrome: (args) => {
    const info = describeUrl(args.url ?? '/');
    return { path: info?.path ?? args.url ?? '/', ramp: info ? RAMP[info.kind] : 'docs' };
  },
  defaultSize: (args) => SIZE[describeUrl(args.url ?? '/')?.kind ?? 'home'] ?? { w: 600, h: 440 },
  // Documents open sized to their content. Divisions takes all the width it has, so its
  // divisions can sit in two columns and the window stays short (SPEC 11.2).
  fitContent: (args) => (describeUrl(args.url ?? '/')?.kind === 'divisions' ? 'wide' : 'height'),
  singleton: true,
  windowKey: (args) => args.url ?? '/',
  component: PageView,
};
