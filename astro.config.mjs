// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// HSOS is a fully static site. Nothing a visitor does ever runs on the server.
export default defineConfig({
  site: 'https://hiraeth.systems',
  output: 'static',
  // Every page is a folder with an index.html, which suits the Linux path URLs.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [preact()],
});
