/** The Ledger, /var/lib/ledger/morale.csv (SPEC 11.6). */
import type { HsosApp } from '../../types';
import { Ledger } from './Ledger';

export const ledgerApp: HsosApp = {
  id: 'ledger',
  title: 'Ledger',
  chrome: () => ({ path: '/var/lib/ledger/morale.csv', ramp: 'ledger' }),
  icon: 'ledger',
  defaultSize: () => ({ w: 480, h: 300 }),
  minSize: { w: 300, h: 200 },
  vfs: [{ path: '/var/lib/ledger/morale.csv', opens: { app: 'ledger' }, title: 'Ledger' }],
  component: Ledger,
};
