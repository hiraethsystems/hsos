// Phase 4: The Board, Ledger, Workplace Settings, Listening Post 7, and WELCOME.dd colour cycling.
import { launch } from './bidi.mjs';

const winTitles = (b) => b.eval(`JSON.stringify([...document.querySelectorAll('.hs-win .hs-tb-title')].map(t => t.textContent))`).then(JSON.parse);
const openIcon = (b, label) => b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes(${JSON.stringify(label)})).click()`);
const inWin = (path, js) => `(() => { const w = [...document.querySelectorAll('.hs-win')].find(w => w.querySelector('.hs-tb-title').textContent === ${JSON.stringify(path)}); return w ? (${js})(w) : null; })()`;
const canvasHash = (b, path) => b.eval(inWin(path, `(w) => { const c = w.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) | 0; return h; }`));

export default async function apps({ base, check }) {
  let b = await launch({ width: 1440, height: 900 });
  try {
    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);

    // WELCOME.dd: the masthead title cycles through the rainbow ramp.
    const colours = () => b.eval(inWin('/home/employee/WELCOME.dd', `(w) => [...w.querySelectorAll('[data-cycle]')].map(s => s.style.color).join('|')`));
    const c1 = await colours(); await b.wait(500);
    check('Welcome masthead has cycling letters', !!c1 && c1.split('|').length === 15);
    check('Welcome title colours cycle', c1 !== (await colours()));
    check('Welcome shows the logo', await b.eval(inWin('/home/employee/WELCOME.dd', `(w) => !!w.querySelector('.masthead-logo path')`)));

    // The Board
    await openIcon(b, 'boardd'); await b.wait(200);
    check('boardd icon opens The Board', (await winTitles(b)).includes('/opt/board/boardd'));
    const directive = () => b.eval(inWin('/opt/board/boardd', `(w) => w.querySelector('.hs-board-directive').textContent`));
    const d1 = await directive();
    check('the Board gives a directive', !!d1 && d1.split(' ').length >= 6, d1);
    let changed = false;
    for (let i = 0; i < 3 && !changed; i++) {
      await b.eval(inWin('/opt/board/boardd', `(w) => w.querySelector('.hs-board-actions .hs-btn').click()`)); await b.wait(50);
      changed = (await directive()) !== d1;
    }
    check('Consult gives a new directive', changed);
    const e1 = await canvasHash(b, '/opt/board/boardd'); await b.wait(400);
    check('the eye iris cycles', e1 !== (await canvasHash(b, '/opt/board/boardd')));
    await openIcon(b, 'boardd'); await b.wait(150);
    check('The Board is a singleton', (await winTitles(b)).filter((t) => t === '/opt/board/boardd').length === 1);

    // Ledger
    await openIcon(b, 'ledger'); await b.wait(200);
    const bars = () => b.eval(inWin('/var/lib/ledger/morale.csv', `(w) => [...w.querySelectorAll('.hs-ledger-bar')].map(x => x.style.height).join(',')`));
    const b1 = await bars();
    check('Ledger draws eight quarters', b1?.split(',').length === 8, b1);
    check('Ledger has a table for screen readers', (await b.eval(inWin('/var/lib/ledger/morale.csv', `(w) => w.querySelectorAll('tbody tr').length`))) === 8);
    await b.eval(inWin('/var/lib/ledger/morale.csv', `(w) => w.querySelector('.hs-ledger-foot .hs-link').click()`)); await b.wait(100);
    check('Reforecast changes the figures', b1 !== (await bars()));

    // Listening Post 7
    await openIcon(b, '/dev/lp7'); await b.wait(300);
    const freq = () => b.eval(inWin('/dev/lp7', `(w) => w.querySelector('.hs-lp-freq').textContent`));
    const f1 = await freq();
    check('Listening Post shows a frequency near 7.074 MHz', /^7\.07[34]\.\d{3}$/.test(f1 ?? ''), f1);
    const h1 = await canvasHash(b, '/dev/lp7'); await b.wait(500);
    check('waterfall moves while open', h1 !== (await canvasHash(b, '/dev/lp7')));
    check('waterfall is drawn at a whole number scale', await b.eval(inWin('/dev/lp7', `(w) => { const c = w.querySelector('canvas'); return c.offsetWidth - 4 === c.width * Math.round((c.offsetWidth - 4) / c.width); }`)));

    // Workplace Settings
    await openIcon(b, '/etc/hsos'); await b.wait(200);
    const S = '/etc/hsos/workplace.conf';
    await b.eval(inWin(S, `(w) => [...w.querySelectorAll('.hs-wp')].find(x => x.textContent.includes('Corporate')).click()`)); await b.wait(100);
    check('choosing a wallpaper changes the desktop', await b.eval(`!!document.querySelector('.hs-shell > .hs-wall-corporate')`));
    check('the chosen wallpaper is marked pressed', (await b.eval(inWin(S, `(w) => [...w.querySelectorAll('.hs-wp[aria-pressed="true"]')].map(x => x.textContent).join()`))) === 'Corporate');
    const saved = () => b.eval(`localStorage.getItem('hsos.settings.v1')`).then((v) => (v ? JSON.parse(v) : {}));
    check('wallpaper is saved', (await saved()).wallpaper === 'corporate');
    const tick = (label) => b.eval(inWin(S, `(w) => [...w.querySelectorAll('.hs-chk')].find(l => l.textContent.includes(${JSON.stringify(label)})).querySelector('input').click()`));
    await tick('scanlines'); await b.wait(100);
    check('CRT scanlines can be switched on', await b.eval(`!!document.querySelector('.hs-scanlines')`));
    await tick('Full boot'); await b.wait(100);
    check('full boot every visit is saved', (await saved()).fullBootEveryVisit === true);
    await tick('Colour cycling'); await b.wait(100);
    const c2 = await colours(); await b.wait(500);
    check('switching off colour cycling stops the title', c2 === (await colours()));
    check('colour cycling setting is saved', (await saved()).cycle === false);
    const l1 = await canvasHash(b, '/dev/lp7'); await b.wait(400);
    check('waterfall still moves with cycling off (it is not palette cycling)', l1 !== (await canvasHash(b, '/dev/lp7')));

    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);
    check('settings survive a reload', await b.eval(`!!document.querySelector('.hs-shell > .hs-wall-corporate')`));
    check('JavaScript errors: none', (b.logs ?? []).length === 0, (b.logs ?? []).join(' | '));
  } finally {
    await b.close();
  }

  // Reduced motion: no cycling, no blinking, the waterfall holds still.
  b = await launch({ width: 1440, height: 900, port: 9335, prefs: { 'ui.prefersReducedMotion': 1 } });
  try {
    await b.goto(base + '/'); await b.wait(900);
    await openIcon(b, '/dev/lp7'); await openIcon(b, 'boardd'); await openIcon(b, '/etc/hsos'); await b.wait(300);
    const f1 = await b.eval(inWin('/dev/lp7', `(w) => w.querySelector('.hs-lp-freq').textContent`));
    const h1 = await canvasHash(b, '/dev/lp7');
    const e1 = await canvasHash(b, '/opt/board/boardd');
    await b.wait(700);
    check('reduced motion: waterfall holds still', h1 === (await canvasHash(b, '/dev/lp7')) && f1 === (await b.eval(inWin('/dev/lp7', `(w) => w.querySelector('.hs-lp-freq').textContent`))));
    check('reduced motion: the eye holds still', e1 === (await canvasHash(b, '/opt/board/boardd')));
    check('reduced motion: cycling checkbox is off and disabled', await b.eval(inWin('/etc/hsos/workplace.conf', `(w) => { const i = [...w.querySelectorAll('.hs-chk')].find(l => l.textContent.includes('Colour cycling')).querySelector('input'); return i.disabled && !i.checked; }`)));
  } finally {
    await b.close();
  }
}
