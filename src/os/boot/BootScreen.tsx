/**
 * The boot screen (SPEC 8). Full: lines one at a time and a stepped rainbow progress bar.
 * Short: the BIOS header and the last login, about a second. Under prefers-reduced-motion the
 * final screen is shown at once, without animation. Any key or click skips.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { LOGO_ON_DARK } from '../sprites/icons';
import { SpriteCanvas } from '../sprites/SpriteCanvas';
import { BIOS_HEADER, FULL_BOOT, HOLD_MS, LINE_MS, SHORT_BOOT, SHORT_MS, STATUS_TAG, STILL_MS } from './script';

export type BootMode = 'full' | 'short';

interface Props {
  mode: BootMode;
  reducedMotion: boolean;
  onDone: () => void;
}

export function BootScreen({ mode, reducedMotion, onDone }: Props) {
  const lines = mode === 'full' ? FULL_BOOT : SHORT_BOOT;
  const animated = mode === 'full' && !reducedMotion;
  const [shown, setShown] = useState(animated ? 0 : lines.length);
  const done = useRef(false);
  const skip = useRef<HTMLButtonElement>(null);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  // The timeline. Full boot: one line per tick, then hold. Otherwise: a fixed still pause.
  useEffect(() => {
    if (!animated) {
      const t = window.setTimeout(finish, reducedMotion ? STILL_MS : SHORT_MS);
      return () => window.clearTimeout(t);
    }
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      if (n <= lines.length) setShown(n);
      if (n >= lines.length + Math.round(HOLD_MS / LINE_MS)) finish();
    }, LINE_MS);
    return () => window.clearInterval(t);
  }, []);

  // Skipping: any key, anywhere.
  useEffect(() => {
    skip.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      e.preventDefault();
      finish();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const pct = Math.round((shown / lines.length) * 100);
  const [bios, copyright] = BIOS_HEADER(new Date().getFullYear());

  return (
    <div class="hs-boot" role="dialog" aria-modal="true" aria-label="HSOS is starting" onPointerDown={finish}>
      <p class="visually-hidden">HSOS is starting. Press any key or click to skip.</p>
      <div class="hs-boot-head" aria-hidden="true">
        <SpriteCanvas sprite={LOGO_ON_DARK} scale={3} />
        <div>
          <div class="hs-boot-bios">{bios}</div>
          <div>{copyright}</div>
        </div>
      </div>
      <div class="hs-boot-log" aria-hidden="true">
        {lines.slice(0, shown).map((line) => (
          <div class={`hs-boot-line is-${line.kind}`}>
            {STATUS_TAG[line.kind] && <span class={`hs-boot-tag is-${line.kind}`}>{STATUS_TAG[line.kind]}</span>}
            {line.text || ' '}
          </div>
        ))}
      </div>
      <div class="hs-boot-foot">
        <div class="hs-boot-bar" aria-hidden="true">
          <div class="hs-boot-fill" style={{ width: `${pct}%` }} />
        </div>
        <span class="hs-boot-pct" aria-hidden="true">
          {pct}%
        </span>
        <button ref={skip} type="button" class="hs-skip" onClick={finish}>
          Click to skip
        </button>
      </div>
    </div>
  );
}
