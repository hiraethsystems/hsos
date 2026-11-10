/**
 * Where everything lives, as real URLs (static layer) and as filesystem paths (the paths shown
 * in title bars and, later, in the terminal). Both layers use these, so a URL is only ever
 * built in one place (SPEC 3.3).
 */
import { DIVISIONS, type DivisionId } from './divisions';

export const HOME_DIR = '/home/employee';

/** Static page URLs. Every one ends in a slash, matching the build's directory format. */
export const url = {
  home: '/',
  welcome: '/welcome/',
  desk: `${HOME_DIR}/`,
  memos: `${HOME_DIR}/memos/`,
  divisions: '/srv/divisions/',
  division: (id: DivisionId) => `/srv/divisions/${id}/`,
  dossier: (division: DivisionId, slug: string) => `/srv/divisions/${division}/${slug}/`,
  memo: (slug: string) => `${HOME_DIR}/memos/${slug}/`,
} as const;

/** Filesystem paths of files, as shown in title bars. */
export const vfsPath = {
  welcome: `${HOME_DIR}/WELCOME.dd`,
  dossier: (division: DivisionId, slug: string) => `/srv/divisions/${division}/${slug}/DOSSIER`,
  memo: (slug: string) => `${HOME_DIR}/memos/${slug}.txt`,
} as const;

/** Directories that have their own static page, apart from individual dossiers. */
export const STATIC_DIRS: readonly string[] = [
  url.home,
  url.desk,
  url.memos,
  url.divisions,
  ...DIVISIONS.map((d) => url.division(d.id)),
];

export interface PathSegment {
  /** The segment as displayed, with a trailing slash for directories. */
  label: string;
  /** Set when this directory has a static page worth linking to. */
  href?: string;
}

/**
 * Split a filesystem path into segments for a title bar, linking each directory that has a
 * page. The current page is never linked to itself.
 */
export function pathSegments(path: string, linkable: ReadonlySet<string>, current: string): PathSegment[] {
  const parts = path.split('/').filter(Boolean);
  const isDir = path.endsWith('/') || path === '/';
  const out: PathSegment[] = [{ label: '/', href: linkable.has('/') && current !== '/' ? '/' : undefined }];
  let acc = '/';
  parts.forEach((part, i) => {
    const last = i === parts.length - 1;
    const dir = !last || isDir;
    acc += dir ? `${part}/` : part;
    const href = dir && linkable.has(acc) && acc !== current ? acc : undefined;
    out.push({ label: dir ? `${part}/` : part, href });
  });
  return out;
}
