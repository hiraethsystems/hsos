#!/usr/bin/env node
// Browser tests for HSOS. Serves dist/ locally, runs every *.test.mjs in headless Firefox.
// Usage: npm run build && npm run test:e2e
import http from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../../dist/', import.meta.url).pathname;
const port = 4330;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.txt': 'text/plain', '.png': 'image/png', '.svg': 'image/svg+xml' };

// A tiny static server that behaves like the nginx config: directory index, 404.html.
const server = http.createServer(async (req, res) => {
  let p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
  } catch {
    p = join(root, '404.html');
    res.statusCode = 404;
  }
  try {
    const body = await readFile(p);
    res.setHeader('Content-Type', types[extname(p)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 500;
    res.end();
  }
});
await new Promise((ok) => server.listen(port, ok));

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
  ok ? passed++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const only = process.argv[2];
const dir = new URL('./', import.meta.url).pathname;
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.test.mjs')).sort()) {
  if (only && !file.includes(only)) continue;
  console.log(`\n== ${file}`);
  const test = (await import(join(dir, file))).default;
  try {
    await test({ base: `http://localhost:${port}`, check });
  } catch (e) {
    check(`${file} ran to the end`, false, e.message);
  }
}
server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
