/**
 * The Board (SPEC 11.4): an eye, a six word directive, and a Consult button. The iris cycles
 * through the rainbow ramp while colour cycling is on, and the eye blinks every few seconds
 * unless reduced motion is asked for.
 */
import { useMemo } from 'preact/hooks';
import { useTick } from '../../clock';
import { RAMP, refIndex } from '../../palette';
import type { Sprite } from '../../sprites/sprite';
import { SpriteCanvas } from '../../sprites/SpriteCanvas';
import type { AppProps } from '../../types';
import { consultBoard, useDirective } from './directive';

const EYE_W = 14;
const EYE_H = 9;
const BLINK_EVERY = 40; // ticks, about six and a half seconds
const BLINK_FOR = 2;

/** Inside the almond shape of the eye (14 by 9), as in the prototype. */
function inEye(x: number, y: number): boolean {
  const nx = (x - 6.5) / 7;
  const ny = (y - 4) / 4.5;
  return nx * nx + ny * ny <= 1 && Math.abs(ny) <= 1 - nx * nx * 0.55;
}

/** The eye, built by rule. A dark outline keeps the white of the eye visible on white. */
function eyeSprite(irisSlot: number, blinking: boolean): Sprite {
  const black = refIndex('black');
  const white = refIndex('white');
  const lid = refIndex('board.3');
  const edge = refIndex('board.0');
  const shut = refIndex('scroll-dark');
  const pixels: (number | null)[] = [];
  for (let y = -1; y <= EYE_H; y++) {
    for (let x = -1; x <= EYE_W; x++) {
      const nx = (x - 6.5) / 7;
      const ny = (y - 4) / 4.5;
      let slot: number | null = null;
      if (blinking) {
        if (y === 4 && Math.abs(nx) <= 1) slot = shut;
      } else if (inEye(x, y)) {
        const r = Math.hypot(x - 6.5, y - 4);
        slot = r < 1.2 ? black : r < 2.8 ? irisSlot : white;
        if (nx * nx + ny * ny > 0.62 && Math.abs(ny) > 0.55) slot = lid;
      } else if (inEye(x - 1, y) || inEye(x + 1, y) || inEye(x, y - 1) || inEye(x, y + 1)) {
        slot = edge;
      }
      pixels.push(slot);
    }
  }
  return { w: EYE_W + 2, h: EYE_H + 2, pixels };
}

export function Board({ clock }: AppProps) {
  const directive = useDirective();
  const tick = useTick(clock.motion);
  const cycle = RAMP.cycle;
  const iris = cycle[clock.cycling ? (tick * 2) % cycle.length : 0]!;
  const blinking = clock.motion && tick % BLINK_EVERY < BLINK_FOR;
  const eye = useMemo(() => eyeSprite(iris, blinking), [iris, blinking]);

  return (
    <div class="hs-board">
      <SpriteCanvas sprite={eye} scale={6} class="hs-board-eye" />
      <div class="hs-board-main">
        <p class="hs-board-directive" aria-live="polite">
          {directive}
        </p>
        <div class="hs-board-actions">
          <button type="button" class="hs-btn" onClick={consultBoard}>
            Consult the Board
          </button>
          <span class="hs-muted">Interpretation is your responsibility.</span>
        </div>
      </div>
    </div>
  );
}
