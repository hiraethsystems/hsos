/**
 * Listening Post 7 (SPEC 11.5): a waterfall of 56 columns by 18 rows in the heat ramp, four
 * drifting signals (two keying real Morse), and a frequency readout wandering around
 * 7.074.000 kHz LSB. It only animates while its window is open, and under reduced motion it
 * shows one still frame. The waterfall is decorative; the readout is plain text.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useTick } from '../../clock';
import { RAMP, slotRgb } from '../../palette';
import type { AppProps } from '../../types';

const COLS = 56;
const ROWS = 18;
const HEAT = RAMP.heat;

const MORSE: Record<string, string> = {
  A: '.-', C: '-.-.', D: '-..', E: '.', H: '....', I: '..', O: '---', Q: '--.-', R: '.-.', S: '...', T: '-',
};

/** Morse as one on/off value per tick: dit 1, dah 3, gaps of 1, 3 and 7. */
function keying(text: string): boolean[] {
  const out: boolean[] = [];
  for (const word of text.split(' ')) {
    for (const letter of word) {
      for (const sym of MORSE[letter] ?? '') out.push(...Array(sym === '.' ? 1 : 3).fill(true), false);
      out.push(false, false);
    }
    out.push(false, false, false, false);
  }
  return out;
}

interface Signal {
  x: number;
  power: number;
  key?: boolean[];
}

function newSignals(): Signal[] {
  return [
    { x: 9, power: 26 },
    { x: 22, power: 18, key: keying('CQ CQ DE HSOS') },
    { x: 36, power: 30 },
    { x: 47, power: 14, key: keying('HIRAETH') },
  ];
}

/** One waterfall row of heat ramp steps (0 to 31). */
function row(signals: readonly Signal[], t: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < COLS; c++) {
    let v = Math.random() * 7;
    for (const s of signals) {
      if (s.key && !s.key[t % s.key.length]) continue;
      const d = Math.abs(c - s.x);
      if (d < 0.6) v += s.power;
      else if (d < 1.6) v += s.power * 0.45;
      else if (d < 2.6) v += s.power * 0.15;
    }
    out.push(Math.max(0, Math.min(HEAT.length - 1, Math.floor(v))));
  }
  return out;
}

const frequency = (t: number) => {
  const f = String(7074000 + Math.round(Math.sin(t / 20) * 400));
  return `${f.slice(0, 1)}.${f.slice(1, 4)}.${f.slice(4)}`;
};

export function ListeningPost({ clock }: AppProps) {
  const signals = useMemo(newSignals, []);
  const [rows] = useState(() => Array.from({ length: ROWS }, (_, r) => row(signals, ROWS - r)));
  const tick = useTick(clock.motion);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(8);

  // Whole number scaling only (SPEC 4.5): fit the widest integer multiple into the window.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(Math.max(2, Math.floor((el.clientWidth - 4) / COLS)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Each tick: signals wander, a new row arrives at the top, the oldest falls off the bottom.
  useEffect(() => {
    if (!clock.motion || tick === 0) return;
    for (const s of signals) {
      if (Math.random() < 0.08) s.x = Math.max(2, Math.min(COLS - 3, s.x + (Math.random() < 0.5 ? -1 : 1)));
    }
    rows.pop();
    rows.unshift(row(signals, tick));
  }, [tick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(COLS, ROWS);
    rows.forEach((r, y) =>
      r.forEach((step, x) => {
        const [red, green, blue] = slotRgb(HEAT[step]!);
        img.data.set([red, green, blue, 255], (y * COLS + x) * 4);
      }),
    );
    ctx.putImageData(img, 0, 0);
  }, [tick, scale]);

  return (
    <div class="hs-lp">
      <p class="hs-lp-readout">
        <span class="hs-lp-freq">{frequency(tick)}</span> kHz LSB
        <span class="hs-muted hs-lp-note">intercepts are company property</span>
      </p>
      <div class="hs-lp-frame" ref={frame}>
        <canvas
          ref={canvas}
          class="hs-sprite hs-lp-waterfall"
          width={COLS}
          height={ROWS}
          style={{ width: `${COLS * scale}px`, height: `${ROWS * scale}px` }}
          aria-hidden="true"
        />
      </div>
      <p class="visually-hidden">
        A waterfall display showing four signals. Two of them are keying Morse code.
      </p>
      {!clock.motion && <p class="hs-muted">Paused while your system asks for reduced motion.</p>}
    </div>
  );
}
