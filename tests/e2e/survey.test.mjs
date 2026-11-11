// Estate Survey: the free flight game.
import { launch } from './bidi.mjs';

export default async function survey({ base, check }) {
  const b = await launch({ width: 1440, height: 900, port: 9340 });
  const hud = () => b.eval(`JSON.stringify({ text: document.querySelector('.hs-survey-hud').textContent, status: document.querySelector('.hs-survey-status').textContent, card: document.querySelector('.hs-survey-card h2')?.textContent ?? null })`).then(JSON.parse);
  const alt = async () => Number(/ALT ([\d.]+)/.exec((await hud()).text)[1]);
  const fuel = async () => Number(/(\d+) percent/.exec((await hud()).text)[1]);
  const SPACE = ' ';
  try {
    await b.goto(base + '/'); await b.wait(600); await b.skipBoot(); await b.wait(200);
    await b.eval(`document.querySelectorAll('.hs-win .hs-x').forEach(x => x.click())`); await b.wait(150);
    await b.eval(`[...document.querySelectorAll('.hs-ico')].find(e => e.textContent.includes('survey')).click()`); await b.wait(400);
    check('survey icon opens /usr/games/survey', await b.eval(`[...document.querySelectorAll('.hs-tb-title')].some(t => t.textContent === '/usr/games/survey')`));
    check('the game waits to be started', (await hud()).card === 'Estate Survey');

    // Every pixel on screen is a palette colour (no blending at polygon edges).
    const onlyPalette = await b.eval(`(() => {
      const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('');
      const pal = new Set((css.match(/#[0-9a-f]{6}/g) || []).map(h => h.toLowerCase()));
      const c = document.querySelector('.hs-survey-canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const hex = (i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
      const seen = new Set();
      for (let i = 0; i < d.length; i += 4) seen.add(hex(i));
      const bad = [...seen].filter(h => !pal.has(h));
      return JSON.stringify({ colours: seen.size, bad: bad.slice(0, 5), size: c.width + 'x' + c.height });
    })()`).then(JSON.parse);
    check('the view is drawn', onlyPalette.colours > 10, `${onlyPalette.colours} colours at ${onlyPalette.size}`);
    check('every pixel is a palette colour', onlyPalette.bad.length === 0, onlyPalette.bad.join(' '));

    await b.eval(`document.querySelector('.hs-survey-card .hs-btn').click()`); await b.wait(200);
    check('Begin survey starts the game and focuses the view', (await hud()).card === null && (await b.eval(`document.activeElement?.classList.contains('hs-survey-stage')`)));
    check('starts landed on Pad A', (await alt()) === 0 && (await fuel()) === 100);

    // A small hop comes back down gently: a landing.
    await b.hold([SPACE], 250); await b.wait(1800);
    const st = (await hud()).status;
    check('a gentle hop lands back on the pad', (st.startsWith('Landed on Pad A') || st.startsWith('Tank full')) && (await alt()) === 0, st);

    // A long climb, then a free fall: a crash, then a replacement drone.
    await b.hold([SPACE], 1300);
    const high = await alt();
    check('thrust climbs', high > 3, `alt ${high}`);
    check('thrust burns fuel', (await fuel()) < 100);
    let crashed = false;
    for (let i = 0; i < 30 && !crashed; i++) {
      await b.wait(150);
      crashed = (await hud()).status.startsWith('Crashed');
    }
    check('falling from height crashes', crashed, (await hud()).status);
    await b.wait(2200);
    check('a replacement drone is issued', (await hud()).status.includes('replacement') && (await alt()) === 0 && (await fuel()) === 100, (await hud()).status);

    // Tilt moves the drone (arrow keys), and thrust along the tilt.
    const before = await b.eval(`document.querySelector('.hs-survey-canvas').getContext('2d').getImageData(0, document.querySelector('.hs-survey-canvas').height - 60, document.querySelector('.hs-survey-canvas').width, 60).data.join()`);
    await b.hold([SPACE, ''], 600); await b.wait(100);
    check('the land scrolls when flying', before !== (await b.eval(`document.querySelector('.hs-survey-canvas').getContext('2d').getImageData(0, document.querySelector('.hs-survey-canvas').height - 60, document.querySelector('.hs-survey-canvas').width, 60).data.join()`)));

    // Pausing
    await b.keys(['']); await b.wait(150); // Escape
    check('Escape pauses', (await hud()).card === 'Survey suspended');
    const a1 = await alt(); await b.wait(500);
    check('nothing moves while paused', a1 === (await alt()));
    await b.eval(`document.querySelector('.hs-survey-card .hs-btn').click()`); await b.wait(200);
    check('Resume carries on', (await hud()).card === null);
    // A real click elsewhere (a script moving focus does not count in a background window).
    const t = await b.eval(`JSON.stringify(document.querySelector('.hs-menutitle').getBoundingClientRect())`).then(JSON.parse);
    await b.click(t.x + t.width / 2, t.y + t.height / 2); await b.wait(150);
    check('leaving the game pauses it', (await hud()).card === 'Survey suspended');

    const errors = b.logs.filter((l) => l.startsWith('error'));
    check('Survey JavaScript errors: none', errors.length === 0, errors.join(' | '));
  } finally {
    await b.close();
  }
}
