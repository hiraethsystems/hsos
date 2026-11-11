/** Workplace Settings, /etc/hsos/workplace.conf (SPEC 11.7). */
import type { HsosApp } from '../../types';
import { WorkplaceSettings } from './WorkplaceSettings';

export const settingsApp: HsosApp = {
  id: 'settings',
  title: 'Workplace Settings',
  chrome: () => ({ path: '/etc/hsos/workplace.conf', ramp: 'system' }),
  icon: 'gear',
  defaultSize: () => ({ w: 560, h: 420 }),
  minSize: { w: 300, h: 200 },
  component: WorkplaceSettings,
};
