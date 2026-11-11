/**
 * Workplace Settings (SPEC 11.7): theme, wallpaper, colour cycling, CRT scanlines and the full
 * boot preference. Saved to localStorage by the desktop; works (and forgets) when storage is
 * blocked.
 */
import { Wallpaper } from '../../desktop/Wallpaper';
import { themeAfter, themeName, themePreview, themeWallpaper } from '../../palette';
import { THEMES, WALLPAPERS, type WallpaperId } from '../../settings';
import type { AppProps } from '../../types';

const NAMES: Record<WallpaperId, string> = {
  sunset: 'Sunset',
  corporate: 'Corporate',
  workbench: 'Workbench',
  paper: 'DolDoc Paper',
  teal: 'Teal Horizon',
  ready: 'READY.',
  pinboard: 'Pinboard',
  copper: 'Copper',
  plaza: 'Plaza',
  salon: 'Closing Time',
  poolside: 'Poolside',
};

/** A little picture of a theme: its desktop, menu bar, a title bar and a page. */
function ThemeSwatch({ id }: { id: (typeof THEMES)[number] }) {
  const c = themePreview(id);
  return (
    <span class="hs-theme-swatch" style={{ background: c.desktop }} aria-hidden="true">
      <span class="hs-theme-swatch-menu" style={{ background: c.menubar }} />
      <span class="hs-theme-swatch-win" style={{ background: c.paper, borderColor: c.title[0] }}>
        <span class="hs-theme-swatch-title" style={{ background: `linear-gradient(90deg, ${c.title.map((h, i) => `${h} ${i * 25}% ${(i + 1) * 25}%`).join(', ')})` }} />
        <span class="hs-theme-swatch-text" style={{ background: c.ink }} />
        <span class="hs-theme-swatch-text is-link" style={{ background: c.link }} />
      </span>
    </span>
  );
}

export function WorkplaceSettings({ settings, updateSettings, clock }: AppProps) {
  const reduced = !clock.motion;
  return (
    <div class="hs-settings">
      <h2 class="hs-app-heading" id="hs-settings-theme">
        Theme
      </h2>
      <ul class="hs-wp-list hs-theme-list" aria-labelledby="hs-settings-theme">
        {THEMES.map((id) => (
          <li>
            <button
              type="button"
              class="hs-wp"
              aria-pressed={settings.theme === id}
              aria-describedby={`hs-theme-after-${id}`}
              onClick={() => updateSettings({ theme: id, wallpaper: themeWallpaper(id) })}
            >
              <ThemeSwatch id={id} />
              <span>{themeName(id)}</span>
              <span class="hs-muted hs-theme-after" id={`hs-theme-after-${id}`}>
                After {themeAfter(id).replace(/^The /, 'the ')}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p class="hs-muted">Choosing a theme also loads its wallpaper. Any wallpaper may be worn with any theme.</p>

      <h2 class="hs-app-heading" id="hs-settings-wall">
        Wallpaper
      </h2>
      <ul class="hs-wp-list" aria-labelledby="hs-settings-wall">
        {WALLPAPERS.map((id) => (
          <li>
            <button
              type="button"
              class="hs-wp"
              aria-pressed={settings.wallpaper === id}
              onClick={() => updateSettings({ wallpaper: id })}
            >
              <span class="hs-wp-thumb">
                <Wallpaper id={id} />
              </span>
              <span>{NAMES[id]}</span>
            </button>
          </li>
        ))}
      </ul>

      <h2 class="hs-app-heading">Effects</h2>
      <label class="hs-chk">
        <input
          type="checkbox"
          checked={settings.cycle && !reduced}
          disabled={reduced}
          onChange={(e) => updateSettings({ cycle: e.currentTarget.checked })}
        />
        Colour cycling (palette animation)
      </label>
      {reduced && <p class="hs-muted hs-chk-note">Off while your system asks for reduced motion.</p>}
      <label class="hs-chk">
        <input type="checkbox" checked={settings.scanlines} onChange={(e) => updateSettings({ scanlines: e.currentTarget.checked })} />
        CRT scanlines
      </label>

      <h2 class="hs-app-heading">Start up</h2>
      <label class="hs-chk">
        <input
          type="checkbox"
          checked={settings.fullBootEveryVisit}
          onChange={(e) => updateSettings({ fullBootEveryVisit: e.currentTarget.checked })}
        />
        Full boot every visit
      </label>

      <p class="hs-muted">Changes are logged in your personnel file.</p>
    </div>
  );
}
