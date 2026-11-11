/**
 * The HSOS desktop shell: the one client-side island (SPEC 3.1). It boots on top of the static
 * page and shows the same content in windows. Screens too small for a desktop get HSOS
 * Handheld (SPEC 14): one app at a time, filling the screen. Visitors who chose Plain View keep
 * the static page.
 */
import { useEffect, useMemo, useReducer, useState } from 'preact/hooks';
import { APP_COMMANDS, APP_MOUNTS, APPS, PENDING_APPS, resolveAppName } from './apps/registry';
import { primePage } from './apps/page/PageView';
import { BootScreen, type BootMode } from './boot/BootScreen';
import type { AnimationClock } from './clock';
import { DesktopIcons, type DesktopIcon } from './desktop/DesktopIcons';
import { Wallpaper } from './desktop/Wallpaper';
import { MemoDialog } from './memo/MemoDialog';
import { MenuBar } from './menu/MenuBar';
import { buildMenus, type MenuDef } from './menu/menus';
import type { DivisionId } from './divisions';
import { describeUrl, url as urls, vfsPath } from './routes';
import { loadSettings, plainViewChosen, prefersReducedMotion, saveSettings, setPlainView, type Settings } from './settings';
import type { AppArgs, Rect } from './types';
import { clampRect, ICONS_W, MENU_H, MIN_SIZE, placeNew, type Bounds } from './wm/geometry';
import { Window, WINDOW_HELP_ID } from './wm/Window';
import { BASE_MOUNTS } from './vfs/base';
import { Vfs } from './vfs/vfs';

export interface ShellProject {
  name: string;
  slug: string;
  division: DivisionId;
  url: string;
  divisionName: string;
}
export interface ShellMemo {
  slug: string;
  title: string;
  url: string;
}

interface Props {
  projects: ShellProject[];
  memos: ShellMemo[];
}

/** The filesystem: the fixed tree, then content, then what each app adds (SPEC 9). */
function buildVfs({ projects, memos }: Props): Vfs {
  return new Vfs([
    ...BASE_MOUNTS,
    ...projects.map((p) => ({ path: vfsPath.dossier(p.division, p.slug), opens: { app: 'page', args: { url: p.url } }, title: p.name })),
    ...memos.map((m) => ({ path: vfsPath.memo(m.slug), opens: { app: 'page', args: { url: m.url } }, title: m.title })),
    ...APP_MOUNTS,
  ]);
}

// ---- Window state ------------------------------------------------------------------------

interface Win {
  key: string;
  appId: string;
  args: AppArgs;
  rect: Rect;
  z: number;
  focusOnMount: boolean;
}
interface WmState {
  wins: Win[];
  top: number;
}
type WmAction =
  | { type: 'open'; key: string; appId: string; args: AppArgs; rect: Rect; focus: boolean }
  | { type: 'focus'; key: string }
  | { type: 'close'; key: string }
  | { type: 'rect'; key: string; rect: Rect }
  | { type: 'clamp'; bounds: Bounds };

function wmReducer(s: WmState, a: WmAction): WmState {
  switch (a.type) {
    case 'open': {
      const top = s.top + 1;
      if (s.wins.some((w) => w.key === a.key)) {
        return { top, wins: s.wins.map((w) => (w.key === a.key ? { ...w, z: top } : w)) };
      }
      return { top, wins: [...s.wins, { key: a.key, appId: a.appId, args: a.args, rect: a.rect, z: top, focusOnMount: a.focus }] };
    }
    case 'focus': {
      const win = s.wins.find((w) => w.key === a.key);
      if (!win || win.z === s.top) return s;
      const top = s.top + 1;
      return { top, wins: s.wins.map((w) => (w.key === a.key ? { ...w, z: top } : w)) };
    }
    case 'close':
      return { ...s, wins: s.wins.filter((w) => w.key !== a.key) };
    case 'rect':
      return { ...s, wins: s.wins.map((w) => (w.key === a.key ? { ...w, rect: a.rect } : w)) };
    case 'clamp':
      return {
        ...s,
        wins: s.wins.map((w) => ({ ...w, rect: clampRect(w.rect, a.bounds, APPS[w.appId]?.minSize ?? MIN_SIZE) })),
      };
  }
}

const viewport = (): Bounds => ({ w: window.innerWidth, h: window.innerHeight });

/** Big enough for overlapping windows. Smaller screens run Handheld. Also in Document.astro. */
const DESKTOP_QUERY = '(min-width: 900px) and (min-height: 560px)';
const isHandheld = () => !window.matchMedia(DESKTOP_QUERY).matches;

/** Handheld or not, following the screen as it rotates or the window is resized. */
function useHandheld(): boolean {
  const [handheld, setHandheld] = useState(isHandheld);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const on = () => setHandheld(!mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return handheld;
}

/** Every menu folded into one, for Handheld's single ◆ menu (SPEC 14). */
function foldMenus(menus: MenuDef[]): MenuDef[] {
  const items = menus.flatMap((m, i) => (i === 0 ? m.items : ['separator' as const, ...m.items]));
  return [{ id: 'all', label: '◆ HSOS', items }];
}

/** Give keyboard focus to the window on top, if any. */
function focusTopWindow(): void {
  window.requestAnimationFrame(() => {
    const wins = [...document.querySelectorAll<HTMLElement>('.hs-win')];
    wins.sort((x, y) => Number(y.style.zIndex) - Number(x.style.zIndex))[0]?.focus({ preventScroll: true });
  });
}

/**
 * Which boot to play (SPEC 8, decided 1.1). Full on a first visit to `/`, or every visit if the
 * visitor asked for it. Otherwise short: later visits, and first visits that land on a deep link.
 */
function chooseBoot(s: Settings, handheld: boolean): BootMode {
  if (s.fullBootEveryVisit) return 'full';
  if (handheld) return 'short'; // SPEC 14: Handheld plays the short boot
  return !s.seenBoot && window.location.pathname === '/' ? 'full' : 'short';
}
const windowKey = (appId: string, args: AppArgs) => `${appId}:${APPS[appId]?.windowKey?.(args) ?? ''}`;

/** The windows open when the desktop first appears. */
function initialWindows(bounds: Bounds, handheld: boolean): WmState {
  const here = describeUrl(window.location.pathname);
  const page = (u: string): AppArgs => ({ url: u });
  const size = (args: AppArgs) => APPS.page!.defaultSize(args);
  const wins: Win[] = [];
  const add = (args: AppArgs, rect: Rect) =>
    wins.push({ key: windowKey('page', args), appId: 'page', args, rect: clampRect(rect, bounds), z: wins.length + 1, focusOnMount: false });

  if (!here || here.kind === 'home') {
    // Home: the handbook, with the divisions beside it when there is room.
    const welcome = page(urls.welcome);
    const divisions = page(urls.divisions);
    const ws = size(welcome);
    const ds = size(divisions);
    // Handheld shows one app at a time, so only the handbook.
    if (!handheld) add(divisions, bounds.w - ICONS_W >= 20 + ws.w + 20 + ds.w ? { x: 20 + ws.w + 20, y: 44, ...ds } : { x: 70, y: 90, ...ds });
    add(welcome, { x: 20, y: 44, ...ws });
    if (!here) {
      // Not a page we know (the 404 page): show it on top, as it is what was asked for.
      const lost = page(window.location.pathname);
      add(lost, placeNew({ w: 520, h: 300 }, 2, bounds));
    }
  } else {
    const args = page(here.url);
    add(args, placeNew(size(args), 0, bounds));
  }
  return { wins, top: wins.length };
}

const KEYBOARD_HELP =
  'Arrow keys move this window, Shift and arrow keys resize it. Control and backquote switches to the next window.';

// ---- The shell -----------------------------------------------------------------------------

export default function Shell(props: Props) {
  const [mode] = useState<'desktop' | 'plain'>(() => (plainViewChosen() ? 'plain' : 'desktop'));

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'desktop') root.classList.add('hsos-shell', 'hsos-shell-ready');
    else root.classList.remove('hsos-shell');
  }, [mode]);

  if (mode === 'plain') {
    return (
      <button
        type="button"
        class="hs-btn hs-plain-return"
        onClick={() => {
          setPlainView(false);
          window.location.reload();
        }}
      >
        Return to the desktop
      </button>
    );
  }
  return <Desktop {...props} />;
}

function Desktop({ projects, memos }: Props) {
  const [vfs] = useState(() => buildVfs({ projects, memos }));
  const handheld = useHandheld();
  const [bounds, setBounds] = useState<Bounds>(viewport);
  const [settings, setSettings] = useState(loadSettings);
  const [memo, setMemo] = useState<string | null>(null);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [boot, setBoot] = useState<BootMode | null>(() => chooseBoot(settings, isHandheld()));
  const updateSettings = (patch: Partial<Settings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  const clock = useMemo<AnimationClock>(
    () => ({ motion: !reducedMotion, cycling: !reducedMotion && settings.cycle }),
    [reducedMotion, settings.cycle],
  );

  const bootDone = (mode: BootMode) => {
    if (mode === 'full') {
      setSettings((s) => {
        if (s.seenBoot) return s;
        const next = { ...s, seenBoot: true };
        saveSettings(next);
        return next;
      });
    }
    setBoot(null);
    focusTopWindow();
  };
  const reboot = () => setBoot('full');
  const [wm, dispatch] = useReducer(wmReducer, undefined, () => {
    // The page the visitor landed on is already in the document: no need to fetch it again.
    const body = document.querySelector('.doc-body');
    if (body) primePage(describeUrl(window.location.pathname)?.url ?? window.location.pathname, body.innerHTML);
    return initialWindows(viewport(), isHandheld());
  });

  useEffect(() => {
    const onResize = () => {
      const b = viewport();
      setBounds(b);
      // Handheld windows fill the screen whatever their rect, so keep the desktop rects for
      // when the screen is big enough again.
      if (!isHandheld()) dispatch({ type: 'clamp', bounds: b });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /** Close a window and hand keyboard focus to the one now on top, so focus is never lost. */
  const close = (key: string) => {
    dispatch({ type: 'close', key });
    focusTopWindow();
  };

  const open = (name: string, args?: AppArgs) => {
    const target = name === 'page' ? { appId: 'page', args } : resolveAppName(name);
    const app = APPS[target.appId];
    if (!app) {
      setMemo(PENDING_APPS[target.appId] ?? `${name}: no such asset. It may have been restructured.`);
      return;
    }
    const a = target.args ?? args ?? {};
    const key = windowKey(app.id, a);
    dispatch({ type: 'open', key, appId: app.id, args: a, rect: placeNew(app.defaultSize(a), wm.wins.length, bounds), focus: true });
  };

  // Keep the address bar on the focused page, so any window can be shared or bookmarked.
  const active = wm.wins.reduce<Win | null>((best, w) => (!best || w.z > best.z ? w : best), null);
  const activeKey = active?.key ?? null;
  const [firstActive] = useState(activeKey);
  useEffect(() => {
    if (activeKey === firstActive) return;
    const pageUrl = active?.appId === 'page' ? active.args.url : active ? null : urls.home;
    if (pageUrl && window.location.pathname !== pageUrl) window.history.replaceState(null, '', pageUrl);
    if (active) document.title = `${APPS[active.appId]!.chrome(active.args).path} · HSOS`;
    else document.title = 'HSOS';
  }, [activeKey]);

  // Ctrl+` switches to the next window, Ctrl+Shift+` to the previous one, in opening order.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Backquote' || !e.ctrlKey || e.altKey || e.metaKey) return;
      if (boot !== null || memo !== null || wm.wins.length === 0) return;
      e.preventDefault();
      const i = wm.wins.findIndex((w) => w.key === activeKey);
      const n = wm.wins.length;
      const next = wm.wins[(i + (e.shiftKey ? n - 1 : 1)) % n]!;
      dispatch({ type: 'focus', key: next.key });
      document.querySelector<HTMLElement>(`.hs-win[data-win="${CSS.escape(next.key)}"]`)?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [wm.wins, activeKey, boot, memo]);

  const menus = useMemo(
    () =>
      buildMenus({
        open: (n) => open(n),
        openUrl: (u) => open('page', { url: u }),
        memo: setMemo,
        reboot,
        shortcuts: () =>
          setMemo(
            'Keyboard shortcuts. Ctrl+` switches to the next window, Ctrl+Shift+` to the previous one. With a window selected, arrow keys move it and Shift with arrow keys resizes it. Tab moves between controls; menus open with Enter or the down arrow. Shortcuts are a privilege, not a right.',
          ),
        plainView: () => {
          setPlainView(true);
          window.location.reload();
        },
        projects,
      }),
    [projects, bounds, wm.wins.length],
  );
  const barMenus = useMemo(() => (handheld ? foldMenus(menus) : menus), [menus, handheld]);
  const full: Rect = { x: 0, y: MENU_H, w: bounds.w, h: bounds.h - MENU_H };

  const icons: DesktopIcon[] = [
    { label: 'divisions/', icon: 'folder', description: 'every project, by division', run: () => open('divisions') },
    { label: 'boardd', icon: 'eye', description: 'The Board', run: () => open('board') },
    { label: '/dev/lp7', icon: 'waterfall', description: 'Listening Post 7', run: () => open('listening') },
    { label: 'ledger', icon: 'ledger', description: 'morale by quarter', run: () => open('ledger') },
    { label: 'terminal', icon: 'terminal', description: 'the legacy text layer', run: () => open('terminal') },
    { label: '/etc/hsos', icon: 'gear', description: 'Workplace Settings', run: () => open('settings') },
    {
      label: '/dev/null',
      icon: 'bin',
      description: 'the suggestion box',
      run: () => setMemo('Anything sent to /dev/null is reviewed by the Board within 0 working days.'),
    },
  ];

  return (
    <>
    <div class={`hs-shell${handheld ? ' hs-handheld' : ''}`} inert={boot !== null}>
      <Wallpaper id={settings.wallpaper} cycling={clock.cycling} />
      <MenuBar menus={barMenus} />
      <div class="hs-windows">
        {wm.wins.map((w) => {
          const app = APPS[w.appId]!;
          const App = app.component;
          return (
            <Window
              key={w.key}
              winId={w.key}
              rect={handheld ? full : w.rect}
              fixed={handheld}
              hidden={handheld && w.key !== activeKey}
              z={w.z}
              chrome={app.chrome(w.args)}
              active={w.key === activeKey}
              bounds={bounds}
              minSize={app.minSize}
              focusOnMount={w.focusOnMount}
              onFocus={() => dispatch({ type: 'focus', key: w.key })}
              onClose={() => close(w.key)}
              onRect={(rect) => dispatch({ type: 'rect', key: w.key, rect })}
            >
              <App
                args={w.args}
                open={open}
                memo={setMemo}
                settings={settings}
                updateSettings={updateSettings}
                clock={clock}
                vfs={vfs}
                commands={APP_COMMANDS}
                reboot={reboot}
              />
            </Window>
          );
        })}
      </div>
      <DesktopIcons icons={icons} inert={handheld && wm.wins.length > 0} />
      <p id={WINDOW_HELP_ID} hidden>
        {KEYBOARD_HELP}
      </p>
      {settings.scanlines && <div class="hs-scanlines" aria-hidden="true" />}
      {memo !== null && <MemoDialog text={memo} onClose={() => setMemo(null)} />}
    </div>
    {boot && <BootScreen key={boot} mode={boot} reducedMotion={reducedMotion} onDone={() => bootDone(boot)} />}
    </>
  );
}
