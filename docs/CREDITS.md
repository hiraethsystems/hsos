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

## Project screenshots

Images in `public/shots/`, taken from each project's own repository. They are shown on that
project's dossier only.

| File | Source | Author | Licence |
|---|---|---|---|
| `vitasdr.png` | VitaSDR LiveArea background, `sce_sys/livearea/contents/bg0.png` | Hiraeth Systems | The owner's own work |
| `dx-garden.png`, `dx-garden-list.png`, `dx-garden-menu.png` | DX Garden `docs/screenshots/` | Hiraeth Systems | The owner's own work (GPL v3 project). Text in them is Noto, SIL OFL 1.1. The map is from Natural Earth, public domain |
| `moon-child-vita.png` | `vita-homebrew` catalogue, `docs/screenshots/moon-child.png`, the game's title screen | Graphics by Metin Seven | CC BY-NC 4.0 (the Moon Child FE asset licence). Non-commercial use with credit, which the dossier gives |
| `dreamkartsu.png` | DreamKartsU `port/wuhb/tv.png`, cropped | DreamKarts art by Rich Stokes | MIT (DreamKarts and DreamKartsU licence) |
| `netsplitelectron.png` | NetSplitElectron `docs/screenshot.png` | Hiraeth Systems, port of Netsplit by Rich Stokes | MIT (NetSplitElectron licence). Shows the built in demo server |
| `unthreader.png` | UnThreader `docs/screenshot.png`, scaled down | Hiraeth Systems | The owner's own work (MIT project). Shows the owner's own Threads account |
| `bonsai.png` | Bonsai `docs/screenshot.png`, scaled down | Hiraeth Systems | The owner's own work (GPL v3 project) |
| `flare-enough.png` | Flare Enough `fastlane/metadata/android/en-US/images/phoneScreenshots/01_today.jpg`, scaled down and saved as PNG | Hiraeth Systems | The owner's own work (GPL v3 or later project) |

## Themes and drawn wallpapers

The eight themes and seven drawn wallpapers (SPEC 4.7, 4.9) are original work made for HSOS. No
artwork, logo, icon or font from any of the systems or artists they are in the spirit of is used.
The theme colours for Home Office 64, Archimedes and Workbench 1.3 follow those machines' widely
published palette values, which are facts rather than artwork, lightened where needed so text
stays readable. The wallpaper lettering is HSOS's own 5x7 font (`src/os/desktop/pixel.ts`).

## Inspiration

TempleOS by Terry A. Davis (public domain).
