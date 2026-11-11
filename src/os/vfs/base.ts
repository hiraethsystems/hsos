/**
 * The fixed part of the filesystem (SPEC 9). Files that belong to an app (morale.csv,
 * workplace.conf, boardd...) are added by that app's manifest instead, and dossiers and memos
 * are mounted from content. Texts marked "spec" are from SPEC 9; the rest are house style.
 */
import { DIVISIONS } from '../divisions';
import { HOME_DIR, url } from '../routes';
import type { VfsMount } from './vfs';

const dir = (path: string, tag?: string): VfsMount => ({ path, dir: true, tag });
const binary = (path: string): VfsMount => ({ path });

export const BASE_MOUNTS: readonly VfsMount[] = [
  binary('/bin/bash'),
  binary('/bin/board'),
  binary('/bin/comply'),
  { path: '/bin/resign', tag: 'disabled', denied: 'resign: disabled. See your contract, clause 0.' },

  binary('/boot/vmlinuz-2.0.36-corp'),
  binary('/boot/initrd-of-optimism.img'),

  { path: '/corp/mission.txt', text: 'To synergise longing at scale, for ever, for shareholders.' }, // spec
  { path: '/corp/org-chart.svg', tag: 'classified', denied: 'cat: /corp/org-chart.svg: Classified. Your clearance is pending.' },

  { path: '/dev/null', text: '' },
  { path: '/dev/synergy', denied: 'cat: /dev/synergy: Device busy. Synergy is being generated.' },

  dir('/etc/hsos'),
  { path: '/etc/passwd', tag: 'redacted', denied: 'cat: /etc/passwd: Redacted by Legal.' },
  { path: '/etc/motd', text: 'Message of the day: there is no day, only the quarter.' }, // spec

  { path: `${HOME_DIR}/WELCOME.dd`, opens: { app: 'page', args: { url: url.welcome } }, title: 'Employee Handbook' },
  dir(`${HOME_DIR}/memos`),
  { path: `${HOME_DIR}/.bash_history`, tag: 'seized', denied: 'cat: .bash_history: Seized by Compliance for review.' },

  { path: '/mnt/legacy/hsos-1.0-textmode/STILL_RUNNING.txt', text: 'Yes. Nobody signed the decommissioning form.' }, // spec

  dir('/opt/board'),

  { path: '/proc/1/cmdline', text: '/sbin/board --forever --no-appeals' }, // spec
  { path: '/proc/longing', text: 'longing: 100% (all cores)' }, // spec
  { path: '/proc/morale', text: 'morale: WITHIN TOLERANCE' }, // spec
  { path: '/proc/uptime', text: 'uptime: since before you were hired' }, // spec

  ...DIVISIONS.map((d) => dir(`/srv/divisions/${d.id}`)),

  dir('/var/lib/ledger'),
  { path: '/var/log/morale.log', denied: 'cat: /var/log/morale.log: Permission denied (write-only)' }, // spec
  { path: '/var/log/complianced.log', text: 'complianced: all employees within tolerance. No further action. No further action.' },
];
