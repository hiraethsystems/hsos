/**
 * Workplace Settings (SPEC 11.7): wallpaper, colour cycling, CRT scanlines and the full boot
 * preference. Saved to localStorage by the desktop; works (and forgets) when storage is blocked.
 */
import { Wallpaper } from '../../desktop/Wallpaper';
import { WALLPAPERS, type WallpaperId } from '../../settings';
import type { AppProps } from '../../types';

const NAMES: Record<WallpaperId, string> = {
  sunset: 'Sunset',
  corporate: 'Corporate',
  workbench: 'Workbench',
  paper: 'DolDoc Paper',
};

export function WorkplaceSettings({ settings, updateSettings, clock }: AppProps) {
  const reduced = !clock.motion;
  return (
    <div class="hs-settings">
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
