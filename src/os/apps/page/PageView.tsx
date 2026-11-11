/**
 * The document viewer: shows a static HSOS page inside a window. It fetches the real page and
 * takes its `.doc-body`, so a window and its static page can never disagree (SPEC 3.1).
 * Links to other HSOS pages open in windows; `hsos:` app words become live buttons.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TargetedMouseEvent } from 'preact';
import { useTick } from '../../clock';
import { RAMP } from '../../palette';
import { describeUrl } from '../../routes';
import type { AppProps } from '../../types';

const cache = new Map<string, string>();

/** Seed the cache with a page already in the document (the page the visitor landed on). */
export function primePage(url: string, html: string): void {
  cache.set(url, html);
}

async function fetchBody(url: string): Promise<string> {
  // no-cache: always ask the server (a cheap 304 when unchanged), so a deploy shows at once.
  const res = await fetch(url, { headers: { Accept: 'text/html' }, cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  const body = doc.querySelector('.doc-body');
  if (!body) throw new Error('No document body');
  return body.innerHTML;
}

export function PageView({ args, open, clock }: AppProps) {
  const url = args.url ?? '/';
  const [html, setHtml] = useState<string | null>(cache.get(url) ?? null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (html !== null) return;
    let live = true;
    fetchBody(url)
      .then((h) => {
        cache.set(url, h);
        if (live) setHtml(h);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [url]);

  // Bring the fetched HTML to life: app words become buttons, outside links open a new tab.
  useEffect(() => {
    const root = ref.current;
    if (!root || html === null) return;
    root.querySelectorAll<HTMLElement>('span.hs-app-ref[data-hsos-open]').forEach((span) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hs-link';
      button.dataset.hsosOpen = span.dataset.hsosOpen ?? '';
      button.append(...span.childNodes);
      span.replaceWith(button);
    });
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
      if (a.origin !== window.location.origin) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  }, [html]);

  // Colour cycling (SPEC 4.6): letters marked data-cycle step along the cycle ramp each tick.
  const cycles = html?.includes('data-cycle') ?? false;
  const tick = useTick(clock.cycling && cycles);
  useEffect(() => {
    if (!cycles) return;
    const n = RAMP.cycle.length;
    ref.current?.querySelectorAll<HTMLElement>('[data-cycle]').forEach((el) => {
      el.style.color = `var(--ramp-cycle-${(Number(el.dataset.cycle) + tick) % n})`;
    });
  }, [tick, cycles]);

  const onClick = (e: TargetedMouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = (e.target as Element).closest<HTMLElement>('a[href], button[data-hsos-open]');
    if (!el) return;
    if (el.dataset.hsosOpen) {
      e.preventDefault();
      open(el.dataset.hsosOpen);
      return;
    }
    if (el instanceof HTMLAnchorElement && el.origin === window.location.origin) {
      const info = describeUrl(el.pathname);
      if (info && info.kind !== 'home') {
        e.preventDefault();
        open('page', { url: info.url });
      }
    }
  };

  if (failed) {
    return (
      <div class="hs-page-message">
        <p>This file could not be retrieved. It may have been restructured.</p>
        <p>
          <a href={url}>Open it as a plain page</a>
        </p>
      </div>
    );
  }
  if (html === null) return <p class="hs-page-message">Retrieving file…</p>;
  // The HTML is our own, built from our own Markdown at build time, from the same origin.
  return <div ref={ref} class="hs-page doc-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
