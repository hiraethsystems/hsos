// Phase 3: the boot sequence. First visit, later visits, deep links, skipping, Reboot,
// reduced motion, the full-boot setting, and blocked storage.
import { launch } from './bidi.mjs';

const lines = (b) => b.eval(`document.querySelectorAll('.hs-boot-line').length`);
const booting = (b) => b.eval(`!!document.querySelector('.hs-boot')`);
const settings = (b) => b.eval(`localStorage.getItem('hsos.settings.v1')`).then((v) => (v ? JSON.parse(v) : null));

export default async function boot({ base, check }) {
  let b = await launch({ width: 1280, height: 800 });
  try {
    await b.goto(base + '/');
    await b.wait(500);
    const early = await lines(b);
    check('first visit to / plays the full boot, line by line', early >= 1 && early < 10, `${early} lines after 0.5s`);
    check('desktop is inert during boot', await b.eval(`document.querySelector('.hs-shell').inert === true`));
    check('skip button has focus', (await b.eval(`document.activeElement?.textContent`)) === 'Click to skip');
    await b.wait(2000);
    check('more lines keep arriving', (await lines(b)) > early);
    await b.wait(3200);
    check('full boot ends by itself', !(await booting(b)));
    check('full boot is remembered', (await settings(b))?.seenBoot === true);
    check('focus moves to the top window after boot', await b.eval(`document.activeElement?.classList.contains('hs-win')`));

    await b.goto(base + '/');
    await b.wait(300);
    check('later visit plays the short boot', (await booting(b)) && (await lines(b)) === 1);
    await b.wait(1100);
    check('short boot ends after about a second', !(await booting(b)));

    // Reboot from the menu replays the full boot.
    await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === '◆ HSOS').click()`);
    await b.wait(100);
    await b.eval(`[...document.querySelectorAll('.hs-mi')].find(e => e.textContent.startsWith('Reboot')).click()`);
    await b.wait(700);
    const r = await lines(b);
    check('Reboot replays the full boot', (await booting(b)) && r > 1 && r < 15, `${r} lines`);
    await b.keys(['x']);
    await b.wait(150);
    check('any key skips the boot', !(await booting(b)));

    await b.eval(`[...document.querySelectorAll('.hs-menutitle')].find(e => e.textContent.trim() === '◆ HSOS').click()`);
    await b.wait(100);
    await b.eval(`[...document.querySelectorAll('.hs-mi')].find(e => e.textContent.startsWith('Reboot')).click()`);
    await b.wait(400);
    await b.click(640, 400);
    await b.wait(150);
    check('a click skips the boot', !(await booting(b)));

    // First visit straight to a deep link: short boot, and the full boot is still owed.
    await b.eval(`localStorage.clear()`);
    await b.goto(base + '/srv/divisions/signals/vitasdr/');
    await b.wait(300);
    check('first visit to a deep link plays the short boot', (await booting(b)) && (await lines(b)) === 1);
    await b.wait(1100);
    check('deep link boot does not count as the full boot', (await settings(b))?.seenBoot !== true);

    // The full-boot-every-visit setting.
    await b.eval(`localStorage.setItem('hsos.settings.v1', JSON.stringify({ seenBoot: true, fullBootEveryVisit: true }))`);
    await b.goto(base + '/welcome/');
    await b.wait(700);
    check('"full boot every visit" forces the full boot', (await lines(b)) > 1);
  } finally {
    await b.close();
  }

  // Reduced motion: the final screen at once, no animation.
  b = await launch({ width: 1280, height: 800, prefs: { 'ui.prefersReducedMotion': 1 } });
  try {
    await b.goto(base + '/');
    await b.wait(100);
    const n = await lines(b);
    check('reduced motion shows the finished boot screen at once', n === 23, `${n} lines`);
    check('reduced motion progress bar is full', (await b.eval(`document.querySelector('.hs-boot-fill').style.width`)) === '100%');
    await b.wait(600);
    check('reduced motion boot ends quickly', !(await booting(b)));
  } finally {
    await b.close();
  }

  // Storage blocked: everything still works, it just forgets.
  b = await launch({ width: 1280, height: 800, prefs: { 'dom.storage.enabled': false } });
  try {
    await b.goto(base + '/');
    await b.wait(300);
    check('with storage blocked the desktop still boots', await booting(b));
    await b.skipBoot();
    check('with storage blocked windows still open', (await b.eval(`document.querySelectorAll('.hs-win').length`)) === 2);
    const errors = b.logs.filter((l) => l.startsWith('error'));
    check('no JavaScript errors with storage blocked', errors.length === 0, errors.join(' | '));
  } finally {
    await b.close();
  }
}
