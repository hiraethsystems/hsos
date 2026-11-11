// Phase 2: the desktop shell. Windows, menus, icons, memos, links, Plain View.
import { launch } from './bidi.mjs';

export default async function desktop({ base, check }) {
const b = await launch({ width: 1440, height: 900 });
const wins = () => b.eval(`JSON.stringify([...document.querySelectorAll('.hs-win')].map(w => ({ t: w.querySelector('.hs-tb-title').textContent, x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight, z: +w.style.zIndex })))`).then(JSON.parse);
const top = (ws) => ws.reduce((a, w) => (w.z > a.z ? w : a));
const find = (ws, t) => ws.find((w) => w.t.includes(t));
try {
  await b.goto(base + '/'); await b.wait(600); await b.skipBoot();
  let w = await wins();
  check('home opens Welcome and Divisions', w.length === 2 && !!find(w, 'WELCOME') && !!find(w, 'divisions'), w.map((x) => x.t).join(', '));
  check('Welcome is on top at start', top(w).t.includes('WELCOME'));
  check('static page hidden behind desktop', await b.eval(`getComputedStyle(document.querySelector('main.doc-window')).display === 'none'`));
  check('URL stays / on load', (await b.eval('location.pathname')) === '/');

  // SPEC 5: first sizes fit the content, capped 16px clear of the menu bar, icons and bottom.
  await b.wait(800);
  w = await wins();
  const fw = find(w, 'WELCOME');
  const fd = find(w, 'divisions');
  check('Welcome and Divisions sit side by side without overlapping', fw.x + fw.w + 16 <= fd.x + 1, `${fw.x}+${fw.w} vs ${fd.x}`);
  check('first windows sit 16px below the menu bar', fw.y === 48 && fd.y === 48, `${fw.y}, ${fd.y}`);
  check('Divisions stops 16px short of the icons', fd.x + fd.w <= 1440 - 100 - 16, `${fd.x + fd.w}`);
  check('first windows stop 16px above the bottom', fw.y + fw.h <= 900 - 16 && fd.y + fd.h <= 900 - 16, `${fw.y + fw.h}, ${fd.y + fd.h}`);
  check('Welcome keeps its width', fw.w === 660, `${fw.w}`);
  const hideDivisions = (on) => b.eval(`[...document.querySelectorAll('.hs-win')].find(w => w.querySelector('.hs-tb-title').textContent.includes('divisions')).querySelectorAll('.doc-section').forEach((e, i) => { if (i) e.style.display = ${on ? "'none'" : "''"}; })`);
  await hideDivisions(true); await b.wait(300);
  const shrunk = find(await wins(), 'divisions');
  check('a fitted window follows its content', shrunk.h < fd.h - 100, `${fd.h} -> ${shrunk.h}`);
  await hideDivisions(false); await b.wait(300);
  check('and grows back when the content does', find(await wins(), 'divisions').h === fd.h, `${find(await wins(), 'divisions').h}`);

  const wel = find(w, 'WELCOME');
  await b.drag(wel.x + 150, wel.y + 12, wel.x + 350, wel.y + 112); await b.wait(150);
  let w2 = find(await wins(), 'WELCOME');
  check('drag by title bar moves window', w2.x === wel.x + 200 && w2.y === wel.y + 100, `${wel.x},${wel.y} -> ${w2.x},${w2.y}`);

  await b.drag(w2.x + 100, w2.y + 12, 1430, 895); await b.wait(150);
  let w3 = find(await wins(), 'WELCOME');
  check('window cannot be lost off screen', w3.x <= 1440 - 80 && w3.y <= 900 - 26, `${w3.x},${w3.y}`);
  await b.drag(w3.x + 40, w3.y + 12, 300, 1); await b.wait(150);
  w3 = find(await wins(), 'WELCOME');
  check('window cannot go above the menu bar', w3.y >= 32, `y=${w3.y}`);

  const g = w3; await b.drag(g.x + g.w - 6, g.y + g.h - 6, g.x + 20, g.y + 20); await b.wait(150);
  const w4 = find(await wins(), 'WELCOME');
  check('resize respects minimum 240x140', w4.w === 240 && w4.h === 140, `${w4.w}x${w4.h}`);
  await b.drag(w4.x + w4.w - 6, w4.y + w4.h - 6, w4.x + 700, w4.y + 500); await b.wait(150);
  const w5 = find(await wins(), 'WELCOME');
  check('resize grows window', w5.w > 600 && w5.h > 400, `${w5.w}x${w5.h}`);
  await b.eval(`[...document.querySelectorAll('.hs-win')].find(w => w.querySelector('.hs-tb-title').textContent.includes('WELCOME')).querySelector('.hs-page').append(Object.assign(document.createElement('div'), { id: 'fit-probe', style: 'height: 2000px' }))`); await b.wait(300);
  const w6 = find(await wins(), 'WELCOME');
  check('a window resized by hand is left alone when its content changes', w6.w === w5.w && w6.h === w5.h, `${w5.w}x${w5.h} -> ${w6.w}x${w6.h}`);
  await b.eval(`document.getElementById('fit-probe').remove()`);

  const dv = find(await wins(), 'divisions');
  await b.click(dv.x + dv.w - 30, dv.y + dv.h - 40); await b.wait(150);
  check('click brings window to front', top(await wins()).t.includes('divisions'));
  check('focusing a window updates the URL', (await b.eval('location.pathname')) === '/srv/divisions/');

  // Menus with the mouse
  const titleBox = (label) => b.eval(`(() => { const t = [...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === ${JSON.stringify(label)}); const r = t.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()`).then(JSON.parse);
  const f = await titleBox('Files'); await b.click(f.x, f.y); await b.wait(100);
  check('click opens a menu', (await b.eval(`document.querySelector('.hs-menu')?.getAttribute('aria-label')`)) === 'Files');
  const h = await titleBox('Help'); await b.pointer([{ type: 'pointerMove', x: Math.round(h.x), y: Math.round(h.y) }]); await b.wait(100);
  check('hover switches open menu', (await b.eval(`document.querySelector('.hs-menu')?.getAttribute('aria-label')`)) === 'Help');
  await b.click(700, 700); await b.wait(100);
  check('click outside closes menu', await b.eval(`!document.querySelector('.hs-menu')`));

  // Menus with the keyboard
  await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === 'Files').focus()`);
  await b.keys(['']); await b.wait(100); // ArrowDown
  check('ArrowDown opens menu and focuses first item', (await b.eval(`document.activeElement?.textContent`))?.startsWith('Home'));
  await b.keys(['', '']); await b.wait(100);
  check('ArrowDown moves through items', (await b.eval(`document.activeElement?.textContent`))?.startsWith('Divisions'));
  await b.keys(['']); await b.wait(100); // ArrowRight
  check('ArrowRight moves to next menu', (await b.eval(`document.querySelector('.hs-menu')?.getAttribute('aria-label')`)) === 'Applications');
  await b.keys(['']); await b.wait(100); // Escape
  check('Escape closes menu and returns focus to its title', (await b.eval(`!document.querySelector('.hs-menu') && document.activeElement?.textContent.trim()`)) === 'Applications');
  await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === '◆ HSOS').focus()`);
  await b.keys(['', '']); await b.wait(100); // down, up = last item (Log Out)
  check('disabled item is focusable with its reason', (await b.eval(`document.activeElement?.getAttribute('aria-disabled') + '|' + document.activeElement?.textContent`)) === 'true|Log Outnot on your plan');
  await b.eval('document.activeElement.click()'); await b.wait(100); // activate disabled (driver cannot press Enter on buttons)
  check('disabled item does nothing', await b.eval(`!document.querySelector('.hs-memo')`));
  await b.keys(['']);
  await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === 'Divisions').focus()`);
  await b.keys(['']); await b.wait(100); await b.eval('document.activeElement.click()'); await b.wait(500);
  check('Divisions menu opens a dossier', !!find(await wins(), 'vitasdr/DOSSIER'));
  check('new window takes keyboard focus', await b.eval(`document.activeElement?.classList.contains('hs-win')`));

  // Icons and memos
  const icon = (label) => b.eval(`(() => { const t = [...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes(${JSON.stringify(label)})); const r = t.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); })()`).then(JSON.parse);
  let ic = await icon('/dev/null'); await b.click(ic.x, ic.y); await b.wait(150);
  check('/dev/null shows HR memo', (await b.eval(`document.querySelector('.hs-memo p')?.textContent`))?.includes('0 working days'));
  check('memo focuses Acknowledge', (await b.eval(`document.activeElement?.textContent`)) === 'Acknowledge');
  await b.keys(['']); await b.wait(100);
  check('Escape closes memo', await b.eval(`!document.querySelector('.hs-memo')`));
  ic = await icon('divisions/'); await b.click(ic.x, ic.y); await b.wait(150);
  check('divisions/ icon focuses existing window (singleton)', (await wins()).filter((x) => x.t === '/srv/divisions/').length === 1 && top(await wins()).t === '/srv/divisions/');

  // Links inside windows
  await b.eval(`document.querySelectorAll('.hs-win').forEach(w => { if (w.querySelector('.hs-tb-title').textContent === '/srv/divisions/') w.querySelector('a[href="/srv/divisions/signals/dx-garden/"]').click(); })`); await b.wait(500);
  check('link in window opens dossier in a window', !!find(await wins(), 'dx-garden/DOSSIER'));
  check('URL follows the new window', (await b.eval('location.pathname')) === '/srv/divisions/signals/dx-garden/');
  await b.eval(`document.querySelectorAll('.hs-win').forEach(w => { if (w.querySelector('.hs-tb-title').textContent.includes('WELCOME')) w.querySelector('button.hs-link[data-hsos-open="ledger"]').click(); })`); await b.wait(150);
  check('hsos: app word in Welcome is a live button', top(await wins()).t === '/var/lib/ledger/morale.csv');
  await b.eval(`document.querySelectorAll('.hs-win').forEach(w => { if (w.querySelector('.hs-tb-title').textContent.includes('ledger')) w.querySelector('.hs-x').click(); })`); await b.wait(150);

  // Close
  const before = (await wins()).length;
  await b.eval(`document.querySelectorAll('.hs-win').forEach(w => { if (w.querySelector('.hs-tb-title').textContent.includes('dx-garden')) w.querySelector('.hs-x').click(); })`); await b.wait(150);
  check('[X] closes window', (await wins()).length === before - 1);
  check('closing hands focus to the window on top', await b.eval(`document.activeElement?.classList.contains('hs-win')`));

  // 404 inside the desktop
  await b.goto(base + '/no/such/page/'); await b.wait(600); await b.skipBoot();
  check('unknown URL shows the 404 page in a window', (await b.eval(`[...document.querySelectorAll('.hs-win')].some(w => w.textContent.includes('No such file or directory'))`)));

  // Plain view
  await b.goto(base + '/'); await b.wait(400); await b.skipBoot();
  await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === '◆ HSOS').click()`); await b.wait(100);
  await b.eval(`[...document.querySelectorAll('.hs-mi')].find(e => e.textContent.startsWith('Plain View')).click()`); await b.wait(1500);
  check('Plain View shows the static page', await b.eval(`!document.querySelector('.hs-shell') && getComputedStyle(document.querySelector('main.doc-window')).display !== 'none'`));
  check('Plain View offers a way back', await b.eval(`!!document.querySelector('.hs-plain-return')`));
  await b.eval(`document.querySelector('.hs-plain-return').click()`); await b.wait(1500); await b.skipBoot();
  check('Return to the desktop works', await b.eval(`!!document.querySelector('.hs-shell')`));

  // Narrow screens get HSOS Handheld (tested in polish.test.mjs)
  await b.viewport(800, 900);
  await b.goto(base + '/srv/divisions/'); await b.wait(600); await b.skipBoot();
  check('below 900px HSOS Handheld runs', await b.eval(`!!document.querySelector('.hs-shell.hs-handheld')`));

  const errors = b.logs.filter((l) => l.startsWith('error'));
  check('no JavaScript errors', errors.length === 0, errors.join(' | '));
} catch (e) {
  check('test run completed', false, e.message);
} finally {
  await b.close();
}
}
