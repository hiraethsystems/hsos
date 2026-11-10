// Minimal WebDriver BiDi client for headless Firefox, used by the HSOS browser tests.
// Firefox speaks BiDi natively, so no extra drivers or downloads are needed.
// Note: synthetic Enter/Space key presses do not activate buttons in this driver, so tests
// check focus with keys and then activate with element.click().
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** prefs: extra Firefox preferences, for example { 'ui.prefersReducedMotion': 1 }. */
export async function launch({ width = 1280, height = 800, port = 9333, prefs = {} } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'hsos-ff-'));
  const lines = { 'remote.active-protocols': 1, ...prefs };
  writeFileSync(join(profile, 'user.js'), Object.entries(lines).map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n') + '\n');
  const ff = spawn('firefox', ['--headless', '--no-remote', '--profile', profile, `--remote-debugging-port=${port}`, `--window-size=${width},${height}`], { stdio: ['ignore', 'ignore', 'pipe'] });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const sock = new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise((ok, bad) => { sock.onopen = ok; sock.onerror = bad; });
      ws = sock;
    } catch {}
  }
  if (!ws) throw new Error('could not connect to Firefox');
  let id = 0; const pending = new Map();
  const logs = [];
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.method === 'log.entryAdded') logs.push(`${msg.params.level}: ${msg.params.text}`); if (msg.id && pending.has(msg.id)) { const { ok, bad } = pending.get(msg.id); pending.delete(msg.id); msg.type === 'error' ? bad(new Error(`${msg.error}: ${msg.message}`)) : ok(msg.result); } };
  const send = (method, params = {}) => new Promise((ok, bad) => { const n = ++id; pending.set(n, { ok, bad }); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('session.new', { capabilities: {} });
  await send('session.subscribe', { events: ['log.entryAdded'] });
  const tree = await send('browsingContext.getTree', {});
  const context = tree.contexts[0].context;
  await send('browsingContext.setViewport', { context, viewport: { width, height } });
  const api = {
    send,
    logs,
    goto: (url) => send('browsingContext.navigate', { context, url, wait: 'complete' }),
    eval: async (expression) => {
      const r = await send('script.evaluate', { expression, target: { context }, awaitPromise: true, resultOwnership: 'none' });
      if (r.type === 'exception') throw new Error(r.exceptionDetails.text);
      return r.result.value;
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    pointer: (steps) => send('input.performActions', { context, actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: steps }] }),
    keys: (keys) => send('input.performActions', { context, actions: [{ type: 'key', id: 'kbd', actions: keys.flatMap((k) => [{ type: 'keyDown', value: k }, { type: 'keyUp', value: k }]) }] }),
    click: (x, y) => api.pointer([{ type: 'pointerMove', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }]),
    drag: (x1, y1, x2, y2) => api.pointer([{ type: 'pointerMove', x: Math.round(x1), y: Math.round(y1) }, { type: 'pointerDown', button: 0 }, { type: 'pointerMove', x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), duration: 100 }, { type: 'pointerMove', x: Math.round(x2), y: Math.round(y2), duration: 100 }, { type: 'pointerUp', button: 0 }]),
    /** Skip the boot screen if it is showing. */
    skipBoot: async () => {
      if (await api.eval(`!!document.querySelector('.hs-boot')`)) {
        await api.eval(`document.querySelector('.hs-boot').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
        await api.wait(150);
      }
    },
    shot: async (file) => { const r = await send('browsingContext.captureScreenshot', { context }); writeFileSync(file, Buffer.from(r.data, 'base64')); },
    viewport: async (w, h) => send('browsingContext.setViewport', { context, viewport: { width: w, height: h } }),
    close: async () => { try { await send('session.end'); } catch {} ff.kill(); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500); },
  };
  return api;
}
