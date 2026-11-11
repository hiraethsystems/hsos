/** Listening Post 7, /dev/lp7 (SPEC 11.5). */
import type { HsosApp } from '../../types';
import { ListeningPost } from './ListeningPost';

export const listeningApp: HsosApp = {
  id: 'listening',
  title: 'Listening Post 7',
  chrome: () => ({ path: '/dev/lp7', ramp: 'listening' }),
  icon: 'waterfall',
  defaultSize: () => ({ w: 520, h: 240 }),
  minSize: { w: 300, h: 180 },
  vfs: [{ path: '/dev/lp7', opens: { app: 'listening' }, title: 'Listening Post 7' }],
  component: ListeningPost,
};
