# Credits and licences

Record every third party font, library and asset here with its licence.

## Fonts

| Asset | Author | Licence | Where | Notes |
|---|---|---|---|---|
| VT323 | Peter Hull, The VT323 Project Authors (2011) | SIL Open Font Licence 1.1 | `public/fonts/vt323-*.woff2`, licence text in `public/fonts/VT323-OFL.txt` | Placeholder pixel font for UI and terminal until the final choice (SPEC 4.2, 20). Latin and Latin Extended subsets, taken from the Fontsource package `@fontsource/vt323` 5.3.0. Self-hosted, never loaded from Google. |
| System sans serif | (the visitor's own system) | n/a | `--font-prose` in `src/styles/global.css` | Used for long prose. Nothing is downloaded. |

If we switch to the Ultimate Oldschool PC Font Pack: VileR, CC BY-SA 4.0,
https://int10h.org/oldschool-pc-fonts/. Credit must be shown on the site as well as here.

## Software

These are build and runtime libraries. Only Preact will ever be sent to visitors' browsers.

| Package | Licence | Use |
|---|---|---|
| Astro | MIT | Static site builder |
| @astrojs/preact | MIT | Preact integration for Astro |
| Preact | MIT | The desktop shell island |
| @astrojs/check, TypeScript | MIT, Apache 2.0 | `npm run check` (development only) |

## Inspiration

TempleOS by Terry A. Davis (public domain).
