/** Workplace Settings, /etc/hsos/workplace.conf (SPEC 11.7). */
import { themeName, themeWallpaper } from '../../palette';
import { THEMES, WALLPAPERS, type ThemeId, type WallpaperId } from '../../settings';
import type { HsosApp } from '../../types';
import { WorkplaceSettings } from './WorkplaceSettings';

export const settingsApp: HsosApp = {
  id: 'settings',
  title: 'Workplace Settings',
  chrome: () => ({ path: '/etc/hsos/workplace.conf', ramp: 'system' }),
  icon: 'gear',
  defaultSize: () => ({ w: 600, h: 460 }),
  minSize: { w: 300, h: 200 },
  commands: [
    {
      name: 'theme',
      usage: 'theme X',
      summary: `colour theme: ${THEMES.join(', ')}`,
      completes: THEMES,
      run: (ctx) => {
        const pick = ctx.args[0]?.toLowerCase();
        if (pick && (THEMES as readonly string[]).includes(pick)) {
          const id = pick as ThemeId;
          ctx.updateSettings({ theme: id, wallpaper: themeWallpaper(id) });
          ctx.print(`Palette swapped: ${themeName(id)}. The previous 256 colours have been archived.`);
        } else {
          ctx.print({ text: `Unapproved theme. Choose: ${THEMES.join(', ')}.`, tone: 'error' });
        }
      },
    },
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
