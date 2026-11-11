/**
 * The virtual filesystem (SPEC 9): a small Linux style tree that exists only in the browser.
 * It is built once when the desktop starts, from three sources:
 *   - the fixed tree in `base.ts`,
 *   - content (every project dossier and memo), mounted automatically,
 *   - files that apps add through the `vfs` field of their manifest.
 * Nothing here ever touches a server.
 */
import type { AppArgs } from '../types';
import { HOME_DIR } from '../routes';

/** What happens when a file is read with `cat`: it opens an app (or a page) instead. */
export interface VfsOpen {
  app: string;
  args?: AppArgs;
}

/** One entry to add to the tree. Parent directories are created as needed. */
export interface VfsMount {
  path: string;
  /** A directory rather than a file. */
  dir?: boolean;
  /** Text printed by `cat`. */
  text?: string;
  /** Printed (as an error) instead of the contents. */
  denied?: string;
  opens?: VfsOpen;
  /** Shown after the name in listings, for example "redacted". */
  tag?: string;
  /** A friendly name, so `open` can find it ("VitaSDR" for a dossier). */
  title?: string;
}

export interface VfsFile {
  kind: 'file';
  name: string;
  path: string;
  text?: string;
  denied?: string;
  opens?: VfsOpen;
  tag?: string;
  title?: string;
}
export interface VfsDir {
  kind: 'dir';
  name: string;
  path: string;
  children: Map<string, VfsNode>;
  tag?: string;
}
export type VfsNode = VfsFile | VfsDir;

const join = (dir: string, name: string) => (dir === '/' ? `/${name}` : `${dir}/${name}`);

export class Vfs {
  readonly root: VfsDir = { kind: 'dir', name: '', path: '/', children: new Map() };

  constructor(mounts: readonly VfsMount[] = []) {
    mounts.forEach((m) => this.add(m));
  }

  /** Add a file or directory. A later mount of the same path fills in what an earlier one left out. */
  add(m: VfsMount): void {
    const parts = m.path.split('/').filter(Boolean);
    let dir = this.root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const existing = dir.children.get(part);
      if (!last) {
        if (existing?.kind === 'file') throw new Error(`vfs: ${existing.path} is a file, cannot mount ${m.path} inside it`);
        const next: VfsDir = existing ?? { kind: 'dir', name: part, path: join(dir.path, part), children: new Map() };
        dir.children.set(part, next);
        dir = next;
        return;
      }
      const path = join(dir.path, part);
      if (m.dir) {
        const node: VfsDir = existing?.kind === 'dir' ? existing : { kind: 'dir', name: part, path, children: new Map() };
        if (m.tag) node.tag = m.tag;
        dir.children.set(part, node);
      } else {
        const prev = existing?.kind === 'file' ? existing : undefined;
        dir.children.set(part, {
          kind: 'file',
          name: part,
          path,
          text: m.text ?? prev?.text,
          denied: m.denied ?? prev?.denied,
          opens: m.opens ?? prev?.opens,
          tag: m.tag ?? prev?.tag,
          title: m.title ?? prev?.title,
        });
      }
    });
  }

  /** Turn a path typed in the terminal into a clean absolute path. `~` is the home directory. */
  resolve(cwd: string, input: string): string {
    let p = input.trim();
    if (p === '~' || p.startsWith('~/')) p = HOME_DIR + p.slice(1);
    const parts = p.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
    for (const seg of p.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return `/${parts.join('/')}`;
  }

  get(path: string): VfsNode | null {
    let node: VfsNode = this.root;
    for (const part of path.split('/').filter(Boolean)) {
      if (node.kind !== 'dir') return null;
      const next: VfsNode | undefined = node.children.get(part);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** Every file, depth first. */
  *files(dir: VfsDir = this.root): Generator<VfsFile> {
    for (const child of dir.children.values()) {
      if (child.kind === 'file') yield child;
      else yield* this.files(child);
    }
  }
}

/** A path as the prompt shows it, with the home directory as `~`. */
export function prettyPath(path: string): string {
  if (path === HOME_DIR) return '~';
  return path.startsWith(`${HOME_DIR}/`) ? `~${path.slice(HOME_DIR.length)}` : path;
}

/** A name as a listing shows it: directories end in `/`, tagged entries carry their tag. */
export function listingName(node: VfsNode): string {
  return `${node.name}${node.kind === 'dir' ? '/' : ''}${node.tag ? ` (${node.tag})` : ''}`;
}
