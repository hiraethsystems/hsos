/**
 * Tab completion (SPEC 10). The first word completes command names; after that, whatever the
 * command asks for (paths by default). One match completes; several complete as far as they
 * agree, and if that adds nothing they are listed, as bash does.
 */
import type { TerminalCommand } from '../../terminal/types';
import type { Vfs } from '../../vfs/vfs';

export interface Completion {
  /** The new input. */
  value: string;
  /** Shown when the matches disagree and nothing more could be completed. */
  options?: string[];
}

const commonPrefix = (xs: readonly string[]) =>
  xs.reduce((p, x) => {
    let i = 0;
    while (i < p.length && p[i] === x[i]) i++;
    return p.slice(0, i);
  });

export function complete(input: string, cwd: string, vfs: Vfs, commands: readonly TerminalCommand[]): Completion {
  const space = input.lastIndexOf(' ');
  const head = input.slice(0, space + 1);
  const token = input.slice(space + 1);
  let candidates: { insert: string; label: string; final: boolean }[];

  if (space < 0) {
    const names = commands.flatMap((c) => [c.name, ...(c.aliases ?? [])]);
    candidates = names.filter((n) => n.startsWith(token)).map((n) => ({ insert: n, label: n, final: true }));
  } else {
    const verb = input.trim().split(/\s+/)[0]!.toLowerCase();
    const mode = commands.find((c) => c.name === verb || c.aliases?.includes(verb))?.completes ?? 'paths';
    if (mode === 'nothing') return { value: input };
    if (mode !== 'paths') {
      candidates = mode.filter((w) => w.startsWith(token)).map((w) => ({ insert: w, label: w, final: true }));
    } else {
      const slash = token.lastIndexOf('/');
      const dirPart = token.slice(0, slash + 1);
      const base = token.slice(slash + 1);
      const dir = vfs.get(vfs.resolve(cwd, dirPart || '.'));
      if (dir?.kind !== 'dir') return { value: input };
      candidates = [...dir.children.values()]
        .filter((n) => n.name.startsWith(base) && (base.startsWith('.') || !n.name.startsWith('.')))
        .map((n) => ({
          insert: dirPart + n.name + (n.kind === 'dir' ? '/' : ''),
          label: n.name + (n.kind === 'dir' ? '/' : ''),
          final: n.kind === 'file',
        }));
    }
  }

  if (candidates.length === 0) return { value: input };
  if (candidates.length === 1) {
    const c = candidates[0]!;
    return { value: head + c.insert + (c.final ? ' ' : '') };
  }
  const prefix = commonPrefix(candidates.map((c) => c.insert));
  if (prefix.length > token.length) return { value: head + prefix };
  return { value: input, options: candidates.map((c) => c.label) };
}
