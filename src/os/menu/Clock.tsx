/** The menu bar clock. Updates once a second; not announced to screen readers. */
import { useEffect, useState } from 'preact/hooks';

const pad = (n: number) => String(n).padStart(2, '0');
const now = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function Clock() {
  const [time, setTime] = useState(now);
  useEffect(() => {
    const t = window.setInterval(() => setTime(now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <time class="hs-clock" aria-hidden="true">
      {time}
    </time>
  );
}
