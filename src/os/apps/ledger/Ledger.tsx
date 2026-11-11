/**
 * The Ledger (SPEC 11.6): Morale by Quarter as a stepped colour bar chart. Reforecast draws a
 * new set of figures, which is how figures work here. The chart is decorative; the same
 * numbers are in a table for screen readers.
 */
import { useState } from 'preact/hooks';
import { bands, type RampName } from '../../palette';
import type { AppProps } from '../../types';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q∞'] as const;
const MAX = 125;

/** Each bar is four stepped bands of its own ramp, left to right. */
const barBands = (i: number) => {
  const name = `ledger-q${i + 1}` as RampName;
  return bands([0, 1, 2, 3].map((k) => `var(--ramp-${name}-${k})`), 'h');
};

const forecast = () => QUARTERS.map(() => 20 + Math.floor(Math.random() * (MAX - 20)));

export function Ledger(_: AppProps) {
  const [figures, setFigures] = useState(forecast);
  return (
    <div class="hs-ledger">
      <h2 class="hs-app-heading">Morale by Quarter</h2>
      <div class="hs-ledger-chart" aria-hidden="true">
        {figures.map((f, i) => (
          <div class="hs-ledger-bar" style={{ height: `${f}px`, background: barBands(i) }} />
        ))}
      </div>
      <div class="hs-ledger-labels" aria-hidden="true">
        {QUARTERS.map((q) => (
          <span>{q}</span>
        ))}
      </div>
      <div class="visually-hidden">
      <table>
        <caption>Morale by quarter, out of {MAX}</caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col">Morale</th>
          </tr>
        </thead>
        <tbody>
          {QUARTERS.map((q, i) => (
            <tr>
              <th scope="row">{q === 'Q∞' ? 'Q infinity' : q}</th>
              <td>{figures[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p class="hs-ledger-foot">
        <button type="button" class="hs-link" onClick={() => setFigures(forecast())}>
          Reforecast
        </button>{' '}
        <span class="hs-muted">(numbers are illustrative, like all numbers)</span>
      </p>
      <p class="visually-hidden" aria-live="polite">
        {figures.map((f, i) => `${QUARTERS[i] === 'Q∞' ? 'Q infinity' : QUARTERS[i]} ${f}`).join(', ')}
      </p>
    </div>
  );
}
