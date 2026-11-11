/** The menus (SPEC 6). Built from the desktop's actions, so menus never reach into apps. */
export interface MenuItem {
  label: string;
  /** Shown on the right: a shortcut, a path, or (for disabled items) the reason. */
  hint?: string;
  disabled?: boolean;
  run?: () => void;
}
export type MenuEntry = MenuItem | 'separator';
export interface MenuDef {
  id: string;
  label: string;
  items: MenuEntry[];
}

export interface MenuActions {
  open: (name: string) => void;
  openUrl: (url: string) => void;
  memo: (text: string) => void;
  reboot: () => void;
  plainView: () => void;
  shortcuts: () => void;
  projects: readonly { name: string; url: string; divisionName: string }[];
}

export function buildMenus(a: MenuActions): MenuDef[] {
  return [
    {
      id: 'hsos',
      label: '◆ HSOS',
      items: [
        { label: 'About HSOS', run: () => a.memo('HSOS 256, build 2026.11. Property of Hiraeth Systems. Licensed, never owned.') },
        'separator',
        { label: 'Workplace Settings', hint: '/etc/hsos', run: () => a.open('settings') },
        { label: 'Plain View', hint: 'no desktop', run: a.plainView },
        { label: 'Reboot', hint: 'Ctrl+Alt+Del', run: a.reboot },
        { label: 'Log Out', hint: 'not on your plan', disabled: true },
      ],
    },
    {
      id: 'files',
      label: 'Files',
      items: [
        { label: 'Home', hint: '~/', run: () => a.open('desk') },
        { label: 'Memos', hint: '~/memos', run: () => a.open('memos') },
        { label: 'Divisions', hint: '/srv/divisions', run: () => a.open('divisions') },
        { label: 'Ledger', hint: '/var/lib/ledger', run: () => a.open('ledger') },
        'separator',
        { label: 'Mount /mnt/legacy', run: () => a.memo('/mnt/legacy is already mounted. It has always been mounted. It will always be mounted.') },
        { label: 'Shred', hint: 'needs 3 signatures', disabled: true },
      ],
    },
    {
      id: 'apps',
      label: 'Applications',
      items: [
        { label: 'Terminal', hint: 'tty0', run: () => a.open('terminal') },
        { label: 'The Board', hint: 'F7', run: () => a.open('board') },
        { label: 'Listening Post 7', hint: '/dev/lp7', run: () => a.open('listening') },
        { label: 'Ledger', run: () => a.open('ledger') },
        { label: 'Estate Survey', hint: '/usr/games', run: () => a.open('survey') },
        'separator',
        { label: 'Settings', run: () => a.open('settings') },
      ],
    },
    {
      id: 'divisions',
      label: 'Divisions',
      items: a.projects.length
        ? a.projects.map((p) => ({ label: p.name, hint: p.divisionName, run: () => a.openUrl(p.url) }))
        : [{ label: 'No assets on file', disabled: true }],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Employee Handbook', hint: 'WELCOME.dd', run: () => a.open('welcome') },
        { label: 'Keyboard Shortcuts', hint: 'Ctrl+`', run: a.shortcuts },
        { label: 'man hsos', run: () => a.memo('No manual entry for hsos. Please ask your line manager, who will ask theirs.') },
        'separator',
        { label: 'Report a Bug', run: () => a.memo('Bugs are features awaiting budget approval. Thank you for your feedback.') },
      ],
    },
  ];
}
