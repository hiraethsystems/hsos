/** Estate Survey (working title), /usr/games/survey: free flight over the company estate. */
import type { HsosApp } from '../../types';
import { Survey } from './Survey';

export const surveyApp: HsosApp = {
  id: 'survey',
  title: 'Estate Survey',
  chrome: () => ({ path: '/usr/games/survey', ramp: 'files' }),
  icon: 'survey',
  defaultSize: () => ({ w: 680, h: 540 }),
  minSize: { w: 340, h: 300 },
  commands: [
    {
      name: 'survey',
      usage: 'survey',
      summary: 'survey the estate (a game)',
      completes: 'nothing',
      run: (ctx) => {
        ctx.open('survey');
        ctx.print('Survey drone requisitioned. Please return it in one piece.');
      },
    },
  ],
  vfs: [
    { path: '/usr/games/survey', opens: { app: 'survey' }, title: 'Estate Survey' },
    {
      path: '/usr/games/README',
      text: 'Games are provided for morale purposes only. Time spent is deducted from your annual leave.',
    },
  ],
  component: Survey,
};
