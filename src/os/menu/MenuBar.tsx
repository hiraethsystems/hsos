/**
 * The menu bar (SPEC 6). Click a title to open its menu; while one is open, hovering another
 * title switches to it. Keyboard: Tab reaches the titles, arrows move between menus and items,
 * Enter activates, Escape closes. Disabled items stay focusable so their reason can be read.
 */
import type { TargetedKeyboardEvent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { MenuDef, MenuItem } from './menus';
import { Clock } from './Clock';

interface Props {
  menus: MenuDef[];
}

type Focus = { menu: number; item: 'first' | 'last' | number } | null;

export function MenuBar({ menus }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus>(null);
  const bar = useRef<HTMLElement>(null);
  const titles = useRef<(HTMLButtonElement | null)[]>([]);
  const popup = useRef<HTMLDivElement>(null);

  const items = (m: number) => menus[m]!.items.filter((i): i is MenuItem => i !== 'separator');

  // Close when clicking anywhere outside the bar.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  // Move focus into the open menu when asked to (keyboard use).
  useEffect(() => {
    if (open === null || !focus || focus.menu !== open) return;
    const buttons = popup.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    if (!buttons?.length) return;
    const i = focus.item === 'first' ? 0 : focus.item === 'last' ? buttons.length - 1 : focus.item;
    buttons[(i + buttons.length) % buttons.length]?.focus();
  }, [open, focus]);

  const openMenu = (m: number, item: 'first' | 'last' | null = null) => {
    setOpen(m);
    setFocus(item ? { menu: m, item } : null);
  };
  const close = (returnFocus: boolean) => {
    const m = open;
    setOpen(null);
    setFocus(null);
    if (returnFocus && m !== null) titles.current[m]?.focus();
  };
  const wrap = (m: number) => (m + menus.length) % menus.length;

  const onTitleKey = (m: number) => (e: TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu(m, 'first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu(m, 'last');
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = wrap(m + (e.key === 'ArrowRight' ? 1 : -1));
      titles.current[next]?.focus();
      if (open !== null) openMenu(next);
    } else if (e.key === 'Escape' && open !== null) {
      e.preventDefault();
      close(true);
    }
  };

  const onItemKey = (m: number, i: number) => (e: TargetedKeyboardEvent<HTMLButtonElement>) => {
    const count = items(m).length;
    const go = (item: number | 'first' | 'last') => {
      e.preventDefault();
      setFocus({ menu: m, item: typeof item === 'number' ? (item + count) % count : item });
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go('first');
    else if (e.key === 'End') go('last');
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = wrap(m + (e.key === 'ArrowRight' ? 1 : -1));
      titles.current[next]?.focus();
      openMenu(next, 'first');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  const activate = (item: MenuItem) => {
    if (item.disabled) return;
    close(true);
    item.run?.();
  };

  return (
    <header class="hs-menubar" ref={bar}>
      <nav aria-label="HSOS menus">
        <ul class="hs-menutitles">
          {menus.map((menu, m) => (
            <li class="hs-menuwrap">
              <button
                ref={(el) => {
                  titles.current[m] = el;
                }}
                type="button"
                class={`hs-menutitle${open === m ? ' is-open' : ''}`}
                aria-haspopup="menu"
                aria-expanded={open === m}
                aria-controls={`hs-menu-${menu.id}`}
                onClick={() => (open === m ? close(false) : openMenu(m))}
                onPointerEnter={() => open !== null && open !== m && openMenu(m)}
                onKeyDown={onTitleKey(m)}
              >
                {menu.label}
              </button>
              {open === m && (
                <div class="hs-menu" role="menu" id={`hs-menu-${menu.id}`} aria-label={menu.label} ref={popup}>
                  {(() => {
                    let n = -1;
                    return menu.items.map((item) => {
                      if (item === 'separator') return <div class="hs-menusep" role="separator" />;
                      const i = ++n;
                      return (
                        <button
                          type="button"
                          role="menuitem"
                          class="hs-mi"
                          tabIndex={-1}
                          aria-disabled={item.disabled ? 'true' : undefined}
                          onClick={() => activate(item)}
                          onKeyDown={onItemKey(m, i)}
                        >
                          <span>{item.label}</span>
                          {item.hint && <span class="hs-mi-hint">{item.hint}</span>}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div class="hs-menustatus">
        <span class="hs-morale" role="img" aria-label="Morale: within tolerance">
          <span class="hs-morale-label" aria-hidden="true">
            MORALE
          </span>
          <span class="hs-morale-bars" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span style={{ background: `var(--ramp-morale-${i})` }} />
            ))}
          </span>
        </span>
        <Clock />
      </div>
    </header>
  );
}
