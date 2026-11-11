/**
 * The terminal's core commands (SPEC 10). Apps add their own (`board`, `wall`) through their
 * manifests; `help` lists them all. Wording follows the prototype where it had any.
 */
import { rampStep, UNSPENT_SLOTS } from '../../palette';
import { HOME_DIR } from '../../routes';
import type { CommandContext, TerminalCommand } from '../../terminal/types';
import { listingName, type VfsFile } from '../../vfs/vfs';

/** Names `open` accepts for apps and the pages that stand in for them. */
const APP_NAMES: Readonly<Record<string, string>> = {
  welcome: 'welcome',
  handbook: 'welcome',
  divisions: 'divisions',
  products: 'divisions',
  memos: 'memos',
  home: 'desk',
  desk: 'desk',
  board: 'board',
  oracle: 'board',
  listening: 'listening',
  lp7: 'listening',
  ledger: 'ledger',
  settings: 'settings',
  terminal: 'terminal',
  term: 'terminal',
};

/** Open the app a file stands for, if it stands for one. */
function openFile(ctx: CommandContext, file: VfsFile): boolean {
  if (!file.opens) return false;
  ctx.open(file.opens.app, file.opens.args);
  ctx.print(file.path.endsWith('/DOSSIER') && file.title ? `Dossier retrieved: ${file.title}` : `Opened ${file.path}.`);
  return true;
}

/** A dossier or memo by slug or name. */
function findAsset(ctx: CommandContext, key: string): VfsFile | undefined {
  const slug = key.toLowerCase().replace(/\s+/g, '-');
  for (const f of ctx.vfs.files()) {
    if (!f.opens) continue;
    const dossier = f.path.startsWith('/srv/divisions/') && f.path.endsWith(`/${slug}/DOSSIER`);
    const memo = f.path === `${HOME_DIR}/memos/${slug}.txt`;
    if (dossier || memo || f.title?.toLowerCase() === key.toLowerCase()) return f;
  }
  return undefined;
}

export function coreCommands(all: () => readonly TerminalCommand[]): TerminalCommand[] {
  return [
    {
      name: 'help',
      usage: 'help',
      summary: 'this list',
      completes: 'nothing',
      run: (ctx) => {
        const width = Math.max(...all().map((c) => c.usage.length)) + 3;
        ctx.print(...all().map((c) => c.usage.padEnd(width) + c.summary));
        ctx.print({ text: 'Up and Down recall history. Tab completes paths.', tone: 'notice' });
      },
    },
    {
      name: 'ls',
      aliases: ['dir'],
      usage: 'ls [path]',
      summary: 'list a directory',
      run: (ctx) => {
        const target = ctx.vfs.resolve(ctx.cwd, ctx.args.find((a) => !a.startsWith('-')) ?? '.');
        const node = ctx.vfs.get(target);
        if (!node) ctx.print({ text: `ls: cannot access ${target}: It may have been restructured.`, tone: 'error' });
        else if (node.kind === 'file') ctx.print(target);
        else if (node.children.size === 0) ctx.print({ text: '(empty, pending headcount)', tone: 'listing' });
        else ctx.print({ text: [...node.children.values()].map(listingName).join('   '), tone: 'listing' });
      },
    },
    {
      name: 'cd',
      usage: 'cd [path]',
      summary: 'change directory',
      run: (ctx) => {
        const target = ctx.vfs.resolve(ctx.cwd, ctx.args[0] ?? HOME_DIR);
        const node = ctx.vfs.get(target);
        if (node?.kind === 'dir') ctx.setCwd(target);
        else if (node) ctx.print({ text: `cd: ${target}: Not a directory. Files cannot be entered, only read.`, tone: 'error' });
        else ctx.print({ text: `cd: ${target}: Not a directory you are cleared for.`, tone: 'error' });
      },
    },
    {
      name: 'pwd',
      usage: 'pwd',
      summary: 'print working directory',
      completes: 'nothing',
      run: (ctx) => ctx.print(ctx.cwd),
    },
    {
      name: 'cat',
      aliases: ['less', 'more'],
      usage: 'cat FILE',
      summary: 'read a file',
      run: (ctx) => {
        if (!ctx.args[0]) return ctx.print({ text: 'cat: which file? Vagueness has been noted.', tone: 'error' });
        const target = ctx.vfs.resolve(ctx.cwd, ctx.args[0]);
        const node = ctx.vfs.get(target);
        if (!node) return ctx.print({ text: `cat: ${ctx.args[0]}: No such file. This attempt has been noted.`, tone: 'error' });
        if (node.kind === 'dir') return ctx.print({ text: `cat: ${target}: Is a directory. Directories cannot be read, only obeyed.`, tone: 'error' });
        if (openFile(ctx, node)) return;
        if (node.denied) return ctx.print({ text: node.denied, tone: 'error' });
        if (node.text !== undefined) return node.text ? ctx.print(...node.text.split('\n')) : undefined;
        ctx.print({ text: `cat: ${target}: Binary file. Reading it would only upset you.`, tone: 'error' });
      },
    },
    {
      name: 'open',
      usage: 'open X',
      summary: 'an app (welcome, divisions, board, listening, ledger, settings) or a project',
      completes: Object.keys(APP_NAMES),
      run: (ctx) => {
        const key = ctx.rest.trim().toLowerCase();
        if (!key) return ctx.print({ text: 'open: open what? Ambition is noted, but not enough.', tone: 'error' });
        const app = APP_NAMES[key];
        if (app) {
          ctx.open(app);
          return ctx.print(`Opened ${key}.`);
        }
        const asset = findAsset(ctx, key);
        if (asset) openFile(ctx, asset);
        else ctx.print({ text: 'open: no such asset. It may have been restructured.', tone: 'error' });
      },
    },
    {
      name: 'palette',
      usage: 'palette',
      summary: 'audit the colour budget',
      completes: 'nothing',
      run: (ctx) => {
        for (let i = 0; i < 8; i++) {
          const [name, step] = i % 2 ? (['cycle', i * 3] as const) : (['heat', i * 4 + 3] as const);
          ctx.print({ text: `${name}.${step}  ${rampStep(name, step)}`, swatch: `var(--ramp-${name}-${step})` });
        }
        ctx.print({
          text: `256 colours approved. ${UNSPENT_SLOTS} remain unspent. Finance is ${UNSPENT_SLOTS > 32 ? 'concerned' : 'delighted, and also concerned'}.`,
          tone: 'notice',
        });
      },
    },
    {
      name: 'uname',
      usage: 'uname -a',
      summary: 'system information',
      completes: ['-a'],
      run: (ctx) => ctx.print('HSOS hsos 2.0.36-corp #1 SMP PREEMPT_BOARD i486 Hiraeth/Systems'),
    },
    {
      name: 'whoami',
      usage: 'whoami',
      summary: 'confirm your identity',
      completes: 'nothing',
      run: (ctx) => ctx.print('employee (uid=1000 gid=1000(assets) groups=1000(assets),27(sudo-pending))'),
    },
    {
      name: 'sudo',
      aliases: ['su'],
      usage: 'sudo',
      summary: 'request elevated privileges',
      completes: 'nothing',
      run: (ctx) => ctx.print({ text: 'employee is not in the sudoers file. This incident will be reported to the Board.', tone: 'error' }),
    },
    {
      name: 'rm',
      usage: 'rm',
      summary: 'remove files',
      run: (ctx) => ctx.print({ text: 'rm: refusing to remove anything. Redundancies are handled by HR.', tone: 'error' }),
    },
    {
      name: 'exit',
      aliases: ['logout', 'resign'],
      usage: 'exit',
      summary: 'leave',
      completes: 'nothing',
      run: (ctx) => ctx.print({ text: 'logout: not available on your plan.', tone: 'error' }),
    },
    {
      name: 'reboot',
      aliases: ['shutdown'],
      usage: 'reboot',
      summary: 'restart HSOS',
      completes: 'nothing',
      run: (ctx) => {
        ctx.print({ text: 'Broadcast message from board@hsos: the system is going down for mandatory reboot NOW.', tone: 'notice' });
        window.setTimeout(ctx.reboot, 600);
      },
    },
    {
      name: 'clear',
      aliases: ['cls'],
      usage: 'clear',
      summary: 'destroy the evidence',
      completes: 'nothing',
      run: (ctx) => ctx.clear(),
    },
  ];
}
