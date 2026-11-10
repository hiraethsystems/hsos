/** The boot script (SPEC 8). Keep the jokes. */
export type BootKind = 'text' | 'notice' | 'kernel' | 'ok' | 'warn' | 'fail' | 'blank';

export interface BootLine {
  kind: BootKind;
  text: string;
}

/** BIOS header, shown beside the logo on every boot. */
export const BIOS_HEADER = (year: number) => [
  'HIRAETH SYSTEMS BIOS v4.04',
  `(C) 1987-${Math.max(2026, year)} Hiraeth Systems. All feelings reserved.`,
];

const t = (text: string): BootLine => ({ kind: 'text', text });

export const FULL_BOOT: readonly BootLine[] = [
  t('CPU: Synergy Processor 486DX2-66 ........ OK'),
  t('Memory test: 640K ......................... ENOUGH'),
  t('Detecting employee ........................ found (uid 1000)'),
  t('Detecting longing ......................... SEVERE'),
  { kind: 'notice', text: 'Booting HSOS kernel 2.0.36-corp ...' },
  { kind: 'kernel', text: '[    0.000000] HSOS version 2.0.36-corp (board@hiraeth) #1 SMP PREEMPT_BOARD' },
  { kind: 'kernel', text: '[    0.104221] Command line: ro quiet compliance=strict appeals=0' },
  { kind: 'kernel', text: '[    0.882013] palette: 256 colours approved by Finance' },
  { kind: 'kernel', text: '[    1.320557] lp7: listening post registered on /dev/lp7' },
  { kind: 'ok', text: 'Mounted /srv/divisions.' },
  { kind: 'ok', text: 'Mounted /mnt/legacy (read-only, mostly).' },
  { kind: 'ok', text: 'Started Compliance Daemon (complianced).' },
  { kind: 'ok', text: 'Started The Board (boardd).' },
  { kind: 'ok', text: 'Started Listening Post 7 (lp7d).' },
  { kind: 'warn', text: 'Longing exceeds safe operating levels. Continuing anyway.' },
  { kind: 'fail', text: 'Failed to start Work-Life Balance Service.' },
  { kind: 'kernel', text: "         See 'journalctl -u balance' for details. Details unavailable." },
  { kind: 'ok', text: 'Reached target Morale (within tolerance).' },
  { kind: 'ok', text: 'Started HSOS Display Manager.' },
  { kind: 'blank', text: '' },
  t('hsos login: employee'),
  t('Password: ********'),
  { kind: 'notice', text: 'Last login: forever ago from the cafeteria.' },
];

/** Later visits: straight to the login. */
export const SHORT_BOOT: readonly BootLine[] = [{ kind: 'notice', text: 'Last login: forever ago from the cafeteria.' }];

export const STATUS_TAG: Partial<Record<BootKind, string>> = {
  ok: '[  OK  ] ',
  warn: '[ WARN ] ',
  fail: '[ FAIL ] ',
};

/** Milliseconds per line (SPEC 8: about 160). */
export const LINE_MS = 160;
/** Pause on the finished screen before the desktop appears. */
export const HOLD_MS = 800;
/** Total length of the short boot. */
export const SHORT_MS = 1000;
/** Under reduced motion the final screen is shown, still, for this long. */
export const STILL_MS = 500;
