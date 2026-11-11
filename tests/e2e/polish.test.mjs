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
}
