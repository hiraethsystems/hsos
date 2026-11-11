/** The terminal, /dev/tty0 (SPEC 10). */
import type { HsosApp } from '../../types';
import { Terminal } from './Terminal';

export const terminalApp: HsosApp = {
  id: 'terminal',
  title: 'Terminal',
  chrome: () => ({ path: '/dev/tty0', ramp: 'terminal' }),
  icon: 'terminal',
  defaultSize: () => ({ w: 640, h: 380 }),
  minSize: { w: 320, h: 180 },
  vfs: [{ path: '/dev/tty0', opens: { app: 'terminal' }, title: 'Terminal' }],
  component: Terminal,
};
