/**
 * The Board's current directive, held outside the window so the `board` terminal command and
 * the Board window always agree (SPEC 10: "print a directive and update the Board window").
 */
import { useEffect, useState } from 'preact/hooks';
import { boardDirective } from '../../text/board-words';

let current = boardDirective();
const listeners = new Set<(d: string) => void>();

/** Ask the Board for a new directive. Everyone listening hears it. */
export function consultBoard(): string {
  current = boardDirective();
  listeners.forEach((l) => l(current));
  return current;
}

export function useDirective(): string {
  const [d, setD] = useState(current);
  useEffect(() => {
    listeners.add(setD);
    setD(current);
    return () => void listeners.delete(setD);
  }, []);
  return d;
}
