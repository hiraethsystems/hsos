/** The Board, /opt/board/boardd (SPEC 11.4). */
import { BOARD_WORDS } from '../../text/board-words';
import type { HsosApp } from '../../types';
import { Board } from './Board';
import { consultBoard } from './directive';

export const boardApp: HsosApp = {
  id: 'board',
  title: 'The Board',
  chrome: () => ({ path: '/opt/board/boardd', ramp: 'board' }),
  icon: 'eye',
  defaultSize: () => ({ w: 500, h: 220 }),
  minSize: { w: 300, h: 160 },
  commands: [
    {
      name: 'board',
      usage: 'board',
      summary: 'consult the Board (or press F7)',
      completes: 'nothing',
      run: (ctx) => ctx.print({ text: consultBoard(), tone: 'notice' }),
    },
  ],
  vfs: [
    { path: '/opt/board/boardd', opens: { app: 'board' }, title: 'The Board' },
    { path: '/opt/board/oracle.words', text: `${BOARD_WORDS.slice(0, 10).join(' ')} ...` },
  ],
  component: Board,
};
