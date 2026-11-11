/** Workplace Settings, /etc/hsos/workplace.conf (SPEC 11.7). */
import { WALLPAPERS, type WallpaperId } from '../../settings';
import type { HsosApp } from '../../types';
import { WorkplaceSettings } from './WorkplaceSettings';

export const settingsApp: HsosApp = {
  id: 'settings',
  title: 'Workplace Settings',
  chrome: () => ({ path: '/etc/hsos/workplace.conf', ramp: 'system' }),
  icon: 'gear',
  defaultSize: () => ({ w: 560, h: 420 }),
  minSize: { w: 300, h: 200 },
  commands: [
    {
      name: 'wall',
      aliases: ['wallpaper'],
      usage: 'wall X',
      summary: `wallpaper: ${WALLPAPERS.join(', ')}`,
      completes: WALLPAPERS,
      run: (ctx) => {
        const pick = ctx.args[0]?.toLowerCase();
        if (pick && (WALLPAPERS as readonly string[]).includes(pick)) {
          ctx.updateSettings({ wallpaper: pick as WallpaperId });
          ctx.print(`Wallpaper approved: ${pick}. Morale adjusted accordingly.`);
        } else {
          ctx.print({ text: `Unapproved wallpaper. Choose: ${WALLPAPERS.join(', ')}.`, tone: 'error' });
        }
      },
    },
  ],
  vfs: [{ path: '/etc/hsos/workplace.conf', opens: { app: 'settings' }, title: 'Workplace Settings' }],
  component: WorkplaceSettings,
};
