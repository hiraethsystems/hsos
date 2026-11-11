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
  // Old addresses from before the divisions were renamed on 11 November 2026. Each becomes a
  // small static page that forwards to the new address, so no nginx change is needed.
  redirects: {
    '/srv/divisions/defence-contracts/': '/srv/divisions/countermeasures/',
    '/srv/divisions/defence-contracts/rbr-1/': '/srv/divisions/countermeasures/rbr-1/',
    '/srv/divisions/morale/': '/srv/divisions/occupational-health/',
  },
  integrations: [preact()],
  markdown: {
    // Sätteri is Astro 7's native Markdown processor. hsosLinks rewrites hsos:open/ links.
    processor: satteri({ hastPlugins: [hsosLinks] }),
  },
});
