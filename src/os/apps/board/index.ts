/** The Board, /opt/board/boardd (SPEC 11.4). */
import type { HsosApp } from '../../types';
import { Board } from './Board';

export const boardApp: HsosApp = {
  id: 'board',
  title: 'The Board',
  chrome: () => ({ path: '/opt/board/boardd', ramp: 'board' }),
  icon: 'eye',
  defaultSize: () => ({ w: 500, h: 220 }),
  minSize: { w: 300, h: 160 },
  component: Board,
};
