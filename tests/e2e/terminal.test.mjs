// Phase 5: the terminal and the virtual filesystem.
import { launch } from './bidi.mjs';

const ENTER = '';
const TAB = '';
const UP = '';
const F7 = '';

export default async function terminal({ base, check }) {
  const b = await launch({ width: 1440, height: 900, port: 9337 });
  const titles = () => b.eval(`JSON.stringify([...document.querySelectorAll('.hs-win .hs-tb-title')].map(t => t.textContent))`).then(JSON.parse);
  const lines = () => b.eval(`JSON.stringify([...document.querySelectorAll('.hs-term-line')].map(l => l.textContent))`).then(JSON.parse);
  const last = async (n = 1) => (await lines()).slice(-n).join('\n');
  const value = () => b.eval(`document.querySelector('#hs-term-input').value`);
  const prompt = () => b.eval(`document.querySelector('.hs-term-prompt').textContent.trim()`);
  const focusInput = () => b.eval(`document.querySelector('#hs-term-input').focus()`);
  const type = async (t) => { await focusInput(); await b.keys([...t, ENTER]); await b.wait(120); };
  const closeAllBut = (keep) => b.eval(`document.querySelectorAll('.hs-win').forEach(w => { if (w.querySelector('.hs-tb-title').textContent !== ${JSON.stringify(keep)}) w.querySelector('.hs-x').click(); })`);
  try {
    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);
    await b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes('terminal')).click()`); await b.wait(300);
    check('terminal icon opens /dev/tty0', (await titles()).includes('/dev/tty0'));
    check('terminal input takes focus', (await b.eval('document.activeElement?.id')) === 'hs-term-input');
    await closeAllBut('/dev/tty0'); await b.wait(150);

    await type('pwd');
    check('starts in the home directory', (await last()) === '/home/employee');
    check('prompt shows home as ~', (await prompt()) === 'employee@hsos:~$');
    await type('ls');
    check('ls lists the home directory', /WELCOME\.dd.*memos\/.*\.bash_history \(seized\)/.test(await last()), await last());
    await type('cd /srv/divisions');
    check('cd changes directory', (await prompt()) === 'employee@hsos:/srv/divisions$');
    await type('ls');
    check('divisions are mounted', (await last()).includes('signals/'), await last());
    await type('cd signals/vitasdr/DOSSIER');
    check('cd refuses a file', (await last()).includes('Not a directory'));
    await type('cd ..');
    check('cd .. goes up', (await prompt()) === 'employee@hsos:/srv$');
    await type('cd');
    check('cd alone goes home', (await prompt()) === 'employee@hsos:~$');

    await type('cat /proc/longing');
    check('cat prints a file', (await last()) === 'longing: 100% (all cores)');
    await type('cat /etc/passwd');
    check('cat of a redacted file is refused', (await last()).includes('Redacted'));
    await type('cat /srv');
    check('cat of a directory is refused', (await last()).includes('Is a directory'));
    await type('cat /var/lib/ledger/morale.csv');
    check('cat morale.csv opens the Ledger', (await titles()).includes('/var/lib/ledger/morale.csv'));
    await type('cat /srv/divisions/signals/vitasdr/DOSSIER');
    check('cat DOSSIER opens the dossier', (await titles()).some((t) => t.includes('vitasdr/DOSSIER')));
    check('cat DOSSIER says what it retrieved', (await last()).startsWith('Dossier retrieved'));
    await type('open dx garden');
    check('open finds a project by name', (await titles()).some((t) => t.includes('dx-garden/DOSSIER')));
    await type('open nothing-here');
    check('open refuses unknown assets', (await last()).includes('no such asset'));

    await type('open board'); await b.wait(150);
    check('open board opens the Board', (await titles()).includes('/opt/board/boardd'));
    await type('board'); await b.wait(100);
    const said = await last();
    const shown = await b.eval(`document.querySelector('.hs-board-directive')?.textContent`);
    check('board prints a directive and updates the Board window', said === shown, `${said} / ${shown}`);
    await focusInput(); await b.keys([F7]); await b.wait(150);
    const f7 = await last();
    check('F7 in the terminal consults the Board', f7 !== said && f7 === (await b.eval(`document.querySelector('.hs-board-directive')?.textContent`)), f7);
    check('F7 leaves the input focused', (await b.eval('document.activeElement?.id')) === 'hs-term-input');

    await type('wall paper');
    check('wall changes the wallpaper', await b.eval(`!!document.querySelector('.hs-shell > .hs-wall-paper')`));
    await type('wall beige');
    check('wall refuses unapproved wallpaper', (await last()).includes('Unapproved'));
    await type('palette');
    check('palette reports the real unspent count', /256 colours approved\. \d+ remain unspent/.test(await last()), await last());
    await type('sudo make me a sandwich');
    check('sudo is reported to the Board', (await last()).includes('sudoers'));
    await type('frobnicate');
    check('unknown command is logged', (await last()) === 'frobnicate: command not found. This incident has been logged.');

    // History and completion
    await focusInput(); await b.keys([UP]); await b.wait(50);
    check('Up recalls the last command', (await value()) === 'frobnicate');
    await b.keys([UP]); await b.wait(50);
    check('Up again goes further back', (await value()) === 'sudo make me a sandwich');
    await b.eval(`(() => { const i = document.querySelector('#hs-term-input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await b.keys([...'cat /pro', TAB]); await b.wait(80);
    check('Tab completes a directory', (await value()) === 'cat /proc/');
    await b.keys([TAB]); await b.wait(80);
    check('Tab lists the choices when they disagree', (await last()).includes('longing') && (await last()).includes('1/'), await last());
    await b.keys([...'lo', TAB]); await b.wait(80);
    check('Tab completes a file', (await value()) === 'cat /proc/longing ');
    await b.eval(`(() => { const i = document.querySelector('#hs-term-input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await b.keys([...'pal', TAB]); await b.wait(80);
    check('Tab completes a command name', (await value()) === 'palette ');
    await b.eval(`(() => { const i = document.querySelector('#hs-term-input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await b.wait(50);
    await b.keys([TAB]); await b.wait(80);
    check('Tab on an empty line moves focus out (no keyboard trap)', (await b.eval('document.activeElement?.id')) !== 'hs-term-input');

    // Limits
    await focusInput();
    for (let i = 0; i < 70; i++) await b.keys([...'pwd', ENTER]);
    await b.wait(200);
    check('output keeps at most 120 lines', (await lines()).length === 120, String((await lines()).length));
    await type('clear');
    check('clear empties the output', (await lines()).length === 0);
    check('output is a live log for screen readers', (await b.eval(`document.querySelector('.hs-term-out').getAttribute('role')`)) === 'log');

    await type('reboot'); await b.wait(900);
    check('reboot plays the boot', await b.eval(`!!document.querySelector('.hs-boot')`));
    const errors = b.logs.filter((l) => l.startsWith('error'));
    check('JavaScript errors: none', errors.length === 0, errors.join(' | '));
  } finally {
    await b.close();
  }
}
