/**
 * The terminal (SPEC 10): the legacy text layer. Output scrolls with the newest line at the
 * bottom and keeps the last 120 lines. Up and Down recall history; Tab completes when there is
 * something to complete, and otherwise moves focus as usual so the terminal is never a trap.
 * F7 consults the Board, where the browser lets us have the key.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { TargetedKeyboardEvent } from 'preact';
import { HOME_DIR } from '../../routes';
import type { Line, TerminalCommand } from '../../terminal/types';
import type { AppProps } from '../../types';
import { prettyPath } from '../../vfs/vfs';
import { coreCommands } from './commands';
import { complete } from './complete';

const MAX_LINES = 120;
const MAX_HISTORY = 50;

interface Shown extends Line {
  id: number;
}

let nextId = 0;
const shown = (l: string | Line): Shown => ({ ...(typeof l === 'string' ? { text: l } : l), id: nextId++ });

const GREETING: Line[] = [
  { text: 'HSOS 2.0.36-corp (tty0). Legacy text layer, restored from tape.' },
  { text: 'Message of the day: there is no day, only the quarter.', tone: 'notice' },
  { text: 'Type help for a list of commands.' },
];

export function Terminal(props: AppProps) {
  const { vfs, commands: appCommands } = props;
  const [lines, setLines] = useState<Shown[]>(() => GREETING.map(shown));
  const [cwd, setCwd] = useState(HOME_DIR);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [recall, setRecall] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;

  const commands = useMemo(() => {
    const list: TerminalCommand[] = [];
    list.push(...coreCommands(() => list), ...appCommands);
    return list;
  }, [appCommands]);
  const find = (verb: string) => commands.find((c) => c.name === verb || c.aliases?.includes(verb));

  const add = (more: (string | Line)[]) => setLines((ls) => [...ls, ...more.map(shown)].slice(-MAX_LINES));

  // Take keyboard focus when the window opens (after the window manager focuses the frame).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    const out = outRef.current;
    if (out) out.scrollTop = out.scrollHeight;
  }, [lines]);

  /** Run a command line. `echo` is off for F7, which is a shortcut rather than typing. */
  const run = (raw: string, echo = true) => {
    const text = raw.trim();
    const out: (string | Line)[] = echo ? [{ text: `employee@hsos:${prettyPath(cwd)}$ ${text}`, tone: 'prompt' }] : [];
    if (!text) return add(out);
    if (echo) setHistory((h) => [...h.filter((x) => x !== text), text].slice(-MAX_HISTORY));
    const verb = text.split(/\s+/)[0]!.toLowerCase();
    const command = find(verb);
    if (!command) return add([...out, { text: `${verb}: command not found. This incident has been logged.`, tone: 'error' }]);

    let cleared = false;
    const p = live.current;
    command.run({
      args: text.split(/\s+/).slice(1),
      rest: text.slice(verb.length).trim(),
      cwd,
      setCwd,
      vfs,
      print: (...ls) => void out.push(...ls),
      clear: () => {
        cleared = true;
      },
      open: p.open,
      memo: p.memo,
      settings: p.settings,
      updateSettings: p.updateSettings,
      reboot: p.reboot,
    });
    if (cleared) setLines([]);
    else add(out);
  };

  const onKeyDown = (e: TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run(input);
      setInput('');
      setRecall(null);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (history.length === 0) return;
      e.preventDefault();
      const up = e.key === 'ArrowUp';
      const at = recall ?? history.length;
      const next = Math.max(0, Math.min(history.length, at + (up ? -1 : 1)));
      setRecall(next === history.length ? null : next);
      setInput(history[next] ?? '');
    } else if (e.key === 'Tab' && !e.shiftKey && input.trim() !== '') {
      e.preventDefault();
      const c = complete(input, cwd, vfs, commands);
      setInput(c.value);
      if (c.options) add([{ text: `employee@hsos:${prettyPath(cwd)}$ ${input}`, tone: 'prompt' }, { text: c.options.join('   '), tone: 'listing' }]);
    } else if (e.key === 'F7') {
      e.preventDefault();
      run('board', false);
    }
  };

  return (
    <div class="hs-term" onClick={(e) => (e.target as Element).closest('.hs-term-out') && !window.getSelection()?.toString() && inputRef.current?.focus()}>
      <div class="hs-term-out hs-scroll" ref={outRef} role="log" aria-live="polite" aria-label="Terminal output">
        {lines.map((l) => (
          <div key={l.id} class={`hs-term-line is-${l.tone ?? 'text'}`}>
            {l.swatch && <span class="hs-term-swatch" style={{ background: l.swatch }} aria-hidden="true" />}
            {l.text}
          </div>
        ))}
      </div>
      <form class="hs-term-in" onSubmit={(e) => e.preventDefault()}>
        <label for="hs-term-input" class="hs-term-prompt">
          employee@hsos:{prettyPath(cwd)}$
        </label>
        <input
          id="hs-term-input"
          ref={inputRef}
          type="text"
          value={input}
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={onKeyDown}
        />
      </form>
    </div>
  );
}
