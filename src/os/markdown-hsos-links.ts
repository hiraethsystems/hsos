/**
 * Markdown (hast) plugin for Astro's Sätteri processor: rewrites `hsos:` links in rendered
 * Markdown. See ./links.ts for the rules.
 */
import { defineHastPlugin } from 'satteri';
import { APP_STATIC_URL, parseHsosHref } from './links';

export const hsosLinks = defineHastPlugin({
  name: 'hsos-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties.href;
      if (typeof href !== 'string' || !href.startsWith('hsos:')) return;
      const app = parseHsosHref(href);
      const staticUrl = APP_STATIC_URL[app];
      if (staticUrl) {
        ctx.setProperty(node, 'href', staticUrl);
        ctx.setProperty(node, 'dataHsosOpen', app);
        return;
      }
      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['hs-app-ref'], dataHsosOpen: app },
        children: [...node.children],
      });
    },
  },
});
