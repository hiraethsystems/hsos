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
  } finally {
    await b.close();
  }
}
