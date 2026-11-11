// Phase 6: colour cycling, keyboard support, Handheld mode, live reduced motion.
import { launch } from './bidi.mjs';

export default async function polish({ base, check }) {
  let b = await launch({ width: 1440, height: 900, port: 9338 });
  const sun = () => b.eval(`document.querySelector('.hs-shell > .hs-wall .hs-sun').style.background + '|' + document.querySelector('.hs-shell > .hs-wall .hs-floor').style.getPropertyValue('--grid-line')`);
  try {
    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);

    // Colour cycling on the wallpaper
    const s1 = await sun(); await b.wait(1200);
    const s2 = await sun();
    check('sunset sun and grid cycle', s1 !== s2, `${s1.slice(-30)} / ${s2.slice(-30)}`);
    await b.eval(`localStorage.setItem('hsos.settings.v1', JSON.stringify({ seenBoot: true, cycle: false }))`);
    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);
    const s3 = await sun(); await b.wait(1200);
    check('wallpaper holds still with cycling off', s3 === (await sun()));
    await b.eval(`localStorage.setItem('hsos.settings.v1', JSON.stringify({ seenBoot: true }))`);

    // Keyboard: switching windows, moving and resizing without a mouse
    const CTRL = '\uE009', SHIFT = '\uE008';
    const active = () => b.eval(`document.activeElement?.closest('.hs-win')?.querySelector('.hs-tb-title').textContent ?? null`);
    const rectOf = (t) => b.eval(`(() => { const w = [...document.querySelectorAll('.hs-win')].find(w => w.querySelector('.hs-tb-title').textContent === ${JSON.stringify(t)}); return JSON.stringify({ x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight, z: +w.style.zIndex }); })()`).then(JSON.parse);
    await b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes('ledger')).click()`); await b.wait(200);
    check('a new window has focus', (await active()) === '/var/lib/ledger/morale.csv');
    await b.combo([CTRL], '`'); await b.wait(100);
    const first = await active();
    check('Ctrl+` switches to another window', first && first !== '/var/lib/ledger/morale.csv', first);
    const fr = await rectOf(first);
    check('the switched-to window comes to the front', fr.z === Math.max(...(await b.eval(`JSON.stringify([...document.querySelectorAll('.hs-win')].map(w => +w.style.zIndex))`).then(JSON.parse))));
    await b.combo([CTRL], '`'); await b.combo([CTRL], '`'); await b.combo([CTRL], '`'); await b.wait(100);
    check('Ctrl+` goes round all three windows', (await active()) === first, await active());
    await b.combo([CTRL, SHIFT], '`'); await b.wait(100);
    check('Ctrl+Shift+` goes backwards', (await active()) === '/var/lib/ledger/morale.csv', await active());
    const r1 = await rectOf('/var/lib/ledger/morale.csv');
    await b.keys(['\uE014', '\uE014', '\uE015']); await b.wait(100); // Right, Right, Down
    const r2 = await rectOf('/var/lib/ledger/morale.csv');
    check('arrow keys move the focused window', r2.x === r1.x + 40 && r2.y === r1.y + 20, `${r1.x},${r1.y} -> ${r2.x},${r2.y}`);
    await b.combo([SHIFT], '\uE014'); await b.combo([SHIFT], '\uE012'); await b.wait(100); // Shift+Right then Shift+Left: back to the same size
    const r3 = await rectOf('/var/lib/ledger/morale.csv');
    check('Shift and arrows resize it', r3.w === r2.w && r3.x === r2.x, `${r2.w} -> ${r3.w}`);
    await b.combo([SHIFT], '\uE015'); await b.wait(100);
    check('Shift and Down makes it taller', (await rectOf('/var/lib/ledger/morale.csv')).h === r3.h + 20);
    check('windows explain their keyboard controls', (await b.eval(`document.getElementById(document.querySelector('.hs-win').getAttribute('aria-describedby'))?.textContent`))?.includes('Arrow keys'));
  } finally {
    await b.close();
  }

  // HSOS Handheld (SPEC 14), on a phone sized screen with a fresh profile.
  b = await launch({ width: 390, height: 844, port: 9339 });
  const wins = () => b.eval(`JSON.stringify([...document.querySelectorAll('.hs-win')].map(w => ({ t: w.querySelector('.hs-tb-title').textContent, shown: !w.hidden, x: w.offsetLeft, w: w.offsetWidth, grip: !!w.querySelector('.hs-grip') })))`).then(JSON.parse);
  const iconsInert = () => b.eval(`document.querySelector('.hs-icons').inert`);
  try {
    await b.goto(base + '/'); await b.wait(400);
    check('Handheld boots', await b.eval(`!!document.querySelector('.hs-boot')`));
    await b.wait(1600);
    check('Handheld plays the short boot, even on a first visit', await b.eval(`!document.querySelector('.hs-boot')`));
    check('the Handheld shell is running', await b.eval(`!!document.querySelector('.hs-shell.hs-handheld')`));
    let w = await wins();
    check('home opens just the handbook', w.length === 1 && w[0].t.includes('WELCOME'), w.map((x) => x.t).join());
    check('the app fills the screen', w[0].x === 0 && w[0].w === 390, `${w[0].x} ${w[0].w}`);
    check('no resize grip', !w[0].grip);
    check('the menu bar folds into one ◆ menu', (await b.eval(`document.querySelectorAll('.hs-menutitle').length`)) === 1);
    check('home screen icons are out of reach behind the app', await iconsInert());
    const box = await b.eval(`JSON.stringify(document.querySelector('.hs-tb').getBoundingClientRect())`).then(JSON.parse);
    await b.drag(box.x + 100, box.y + 10, box.x + 200, box.y + 200); await b.wait(150);
    check('windows cannot be dragged', (await wins())[0].x === 0);

    await b.eval(`document.querySelector('.hs-win .hs-x').click()`); await b.wait(150);
    check('closing the app shows the home screen', (await wins()).length === 0 && !(await iconsInert()));
    await b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes('ledger')).click()`); await b.wait(150);
    await b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes('boardd')).click()`); await b.wait(150);
    check('the home screen is out of reach while an app is open', await iconsInert());
    w = await wins();
    check('only the newest app is shown', w.filter((x) => x.shown).map((x) => x.t).join() === '/opt/board/boardd', JSON.stringify(w.map((x) => [x.t, x.shown])));
    await b.eval(`document.querySelector('.hs-win:not([hidden]) .hs-x').click()`); await b.wait(150);
    w = await wins();
    check('closing it shows the app underneath', w.length === 1 && w[0].shown && w[0].t === '/var/lib/ledger/morale.csv');
    await b.eval(`document.querySelector('.hs-menutitle').click()`); await b.wait(100);
    check('the ◆ menu lists everything', (await b.eval(`[...document.querySelectorAll('.hs-mi')].map(m => m.textContent).join('|')`)).includes('Listening Post 7'));
    await b.eval(`[...document.querySelectorAll('.hs-mi')].find(m => m.textContent.startsWith('Terminal')).click()`); await b.wait(300);
    check('the ◆ menu opens apps', (await wins()).find((x) => x.shown)?.t === '/dev/tty0');

    await b.viewport(1440, 900); await b.wait(300);
    check('a bigger screen turns into the desktop', await b.eval(`!document.querySelector('.hs-shell.hs-handheld')`));
    w = await wins();
    check('windows survive the change and show again', w.length === 2 && w.every((x) => x.shown && x.grip), JSON.stringify(w));
    await b.viewport(390, 844); await b.wait(300);
    check('and back again', (await wins()).filter((x) => x.shown).length === 1);

    await b.goto(base + '/srv/divisions/signals/vitasdr/'); await b.wait(1800);
    w = await wins();
    check('a deep link opens that page', w.length === 1 && w[0].t.includes('vitasdr/DOSSIER'));
    const errors = b.logs.filter((l) => l.startsWith('error'));
    check('Handheld JavaScript errors: none', errors.length === 0, errors.join(' | '));
  } finally {
    await b.close();
  }
}
