#!/usr/bin/env node
// Fails if a colour value appears in src/ outside src/os/palette.ts (CLAUDE.md rule 2).
// Catches hex colours and rgb()/hsl() style functions. Markdown is skipped, because "#123"
// in prose is usually an issue number, not a colour.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const allowed = new Set(['src/os/palette.ts']);
const exts = /\.(ts|tsx|js|jsx|mjs|astro|css)$/;
const pattern = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (exts.test(name)) yield p;
  }
}

const problems = [];
for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file);
  if (allowed.has(rel)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(pattern)) problems.push(`${rel}:${i + 1}: ${m[0]}`);
    });
}

if (problems.length) {
  console.error('Colours found outside src/os/palette.ts. Add them to the palette and use a variable:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('Colour check: all colours come from the palette.');
