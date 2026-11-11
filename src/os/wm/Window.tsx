/**
 * A window: chrome, dragging, resizing, focus and scrolling. Apps only ever draw the contents.
 */
import type { ComponentChildren, TargetedKeyboardEvent, TargetedPointerEvent } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import type { Rect, WindowChrome } from '../types';
import { clampRect, type Bounds } from './geometry';

/** Pixels per arrow key press when moving or resizing from the keyboard. */
const KEY_STEP = 20;
/** Id of the hidden text that explains the keyboard controls (rendered once by the shell). */
export const WINDOW_HELP_ID = 'hs-win-help';

interface Props {
  /** Identifies the window in the document, for focusing it from outside. */
  winId: string;
  rect: Rect;
  /** Handheld: the window fills the screen and cannot be dragged or resized. */
  fixed?: boolean;
  /** Handheld: windows behind the one on show stay open (keeping their state) but hidden. */
  hidden?: boolean;
  z: number;
  chrome: WindowChrome;
  active: boolean;
  bounds: Bounds;
  minSize?: { w: number; h: number };
  /** Move keyboard focus into the window when it first appears. */
  focusOnMount?: boolean;
  onFocus: () => void;
  onClose: () => void;
  onRect: (r: Rect) => void;
  children: ComponentChildren;
}

type Drag = { mode: 'move' | 'resize'; px: number; py: number; start: Rect; id: number };

export function Window({ winId, rect, fixed = false, hidden = false, z, chrome, active, bounds, minSize, focusOnMount, onFocus, onClose, onRect, children }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    if (focusOnMount) ref.current?.focus({ preventScroll: true });
  }, []);

  const begin = (mode: Drag['mode']) => (e: TargetedPointerEvent<HTMLElement>) => {
    if (fixed || e.button !== 0 || (e.target as Element).closest('button')) return;
    e.preventDefault();
    onFocus();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, px: e.clientX, py: e.clientY, start: rect, id: e.pointerId };
  };
  const move = (e: TargetedPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    const next =
      d.mode === 'move'
        ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy }
        : { ...d.start, w: d.start.w + dx, h: d.start.h + dy };
    onRect(clampRect(next, bounds, minSize));
  };
  const end = (e: TargetedPointerEvent<HTMLElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  // Keyboard alternative to dragging (WCAG 2.5.7): with the window frame itself focused,
  // arrow keys move it and Shift with arrow keys resizes it.
  const onKeyDown = (e: TargetedKeyboardEvent<HTMLElement>) => {
    if (fixed || e.target !== e.currentTarget || e.ctrlKey || e.altKey || e.metaKey) return;
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const [dx, dy] = [d[0]! * KEY_STEP, d[1]! * KEY_STEP];
    const next = e.shiftKey ? { ...rect, w: rect.w + dx, h: rect.h + dy } : { ...rect, x: rect.x + dx, y: rect.y + dy };
    onRect(clampRect(next, bounds, minSize));
  };

  const style = {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    zIndex: z,
    '--win-bands': `var(--bands-${chrome.ramp})`,
    '--win-dark': `var(--ramp-${chrome.ramp}-0)`,
    '--win-shadow': `var(--c-shadow-${chrome.ramp})`,
  };

  return (
    <section
      ref={ref}
      class={`hs-win${active ? ' is-active' : ''}${fixed ? ' is-fixed' : ''}`}
      hidden={hidden}
      style={style}
      data-win={winId}
      aria-labelledby={titleId}
      aria-describedby={fixed ? undefined : WINDOW_HELP_ID}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={onFocus}
      onFocusIn={onFocus}
    >
      <div class="hs-tb" onPointerDown={begin('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <h2 id={titleId} class="hs-tb-title">
          {chrome.path}
        </h2>
        <button type="button" class="hs-x" aria-label={`Close ${chrome.path}`} onClick={onClose}>
          [X]
        </button>
      </div>
      <div class="hs-win-body hs-scroll">{children}</div>
      {!fixed && <div class="hs-grip" aria-hidden="true" onPointerDown={begin('resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />}
    </section>
  );
}
