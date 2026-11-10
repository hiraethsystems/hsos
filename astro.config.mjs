// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import { satteri } from '@astrojs/markdown-satteri';
import { hsosLinks } from './src/os/markdown-hsos-links.ts';

// HSOS is a fully static site. Nothing a visitor does ever runs on the server.
export default defineConfig({
  site: 'https://hiraeth.systems',
  output: 'static',
  // Every page is a folder with an index.html, which suits the Linux path URLs.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [preact()],
  markdown: {
    // Sätteri is Astro 7's native Markdown processor. hsosLinks rewrites hsos:open/ links.
    processor: satteri({ hastPlugins: [hsosLinks] }),
  },
});
