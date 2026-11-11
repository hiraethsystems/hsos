/** The desktop icons down the right edge (SPEC 7). Single click opens. */
import { SpriteCanvas } from '../sprites/SpriteCanvas';
import { ICONS, type IconName } from '../sprites/icons';

export interface DesktopIcon {
  label: string;
  icon: IconName;
  /** Accessible description, when the label alone is cryptic. */
  description: string;
  run: () => void;
}

/** Down the right edge on the desktop; a home screen grid in Handheld (CSS decides). */
export function DesktopIcons({ icons, inert = false }: { icons: DesktopIcon[]; inert?: boolean }) {
  return (
    <nav class="hs-icons" aria-label="Desktop" inert={inert}>
      <ul>
        {icons.map((ic) => (
          <li>
            <button type="button" class="hs-ico" onClick={ic.run} aria-label={`${ic.label}, ${ic.description}`}>
              <SpriteCanvas sprite={ICONS[ic.icon]} scale={3} />
              <span class="hs-ico-label">{ic.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
