# HSOS Design and Build Specification

Version 1.1, 10 November 2026. Owner: Aisling (Hiraeth Systems).

Changes in 1.1: decisions taken before Phase 0 (title bar contrast, prose font, transparency,
boot on deep links, palette details, content slugs). See the sections marked "Decided 1.1".
Domain: hiraeth.systems. Repository: `hsos` on the `hiraethsystems` GitHub account.

This document records every decision made during the design phase. It is the source of truth.
If something here turns out to be wrong or impractical, change this document first, then the code.

---

## 1. What HSOS is

HSOS (Hiraeth Systems Operating System) is a personal website disguised as the in-browser
operating system of **Hiraeth Systems**, a fictional mega corporation with a vaporwave, early
1990s corporate soul. Visitors "log in" as an employee and explore the owner's projects as
corporate assets filed under Divisions.

Inspirations, in order of importance:

- **TempleOS** (Terry A. Davis): the idea that the whole OS is one living hypertext document,
  where any underlined word opens something, and that an OS can have an oracle. In HSOS the
  religious framing is replaced by the corporation and its Board.
- **Late 1980s to mid 1990s operating systems**: chunky windows, menu bars, desktop icons,
  256 colour VGA era graphics, palette animation.
- **Unix/Linux**: the filesystem, terminal and boot log are Linux flavoured, because the owner
  uses Linux and because a Linux tree looks suitably cursed for a corporate portal.

### 1.1 Lore (keep consistent)

- HSOS 1.0 was a text mode system. It still runs underneath, mounted at `/mnt/legacy`, because
  nobody signed the decommissioning form. The terminal is the "legacy text layer".
- The current version is **HSOS 256**, kernel `2.0.36-corp`. Finance approved 256 colours and
  is worried about the 248 still unspent.
- **The Board** is the corporation's oracle. It speaks in random corporate and melancholy words
  (a parody of TempleOS's random word oracle). It lives at `/opt/board/boardd`.
- The visitor is `employee`, uid 1000, group `assets`. They are not in the sudoers file.
- Products are filed into Divisions (more can be added in `src/os/divisions.ts`):
  - Signals: radio.
  - Legacy Acquisitions: ports of other people's software.
  - Leisure Compliance: games.
  - General Services: everything else, such as TV, sound and desktop tools.
  - Countermeasures: defence, and tools that push back (RBR-1, UnThreader).
  - Occupational Health: health and wellbeing.
  Renamed by the owner on 11 November 2026: Defence Contracts became Countermeasures, Morale
  became Occupational Health, and General Services was added. Leisure Compliance now holds
  games only. The old addresses forward to the new ones (`redirects` in `astro.config.mjs`).
  The MORALE meter, `/proc/morale` and the Ledger are company jokes, not the division, and stay.
- Nothing can be deleted, resigned from, or logged out of. Redundancies are handled by HR.

### 1.2 Tone of voice

Dry corporate satire, with occasional genuine warmth and melancholy (hiraeth means a longing
for a home you cannot return to). Punch up at corporations and bureaucracy. Never mock the
visitor, never mock the owner. Jokes should be short. Real project information must stay
accurate and readable underneath the satire; the joke is the wrapper, never the content.

Examples of the house style: "All feelings reserved." "Curiosity is billable."
"Resignation is not available on your plan." "Bugs are features awaiting budget approval."

---

## 2. Goals and non-goals

**Goals (v1)**

- A mouse driven desktop with draggable, resizable, scrollable windows, dropdown menus and
  desktop icons.
- A boot sequence.
- Every project has a dossier, readable both inside the OS and as a plain static page.
- A working terminal with a fake but navigable Linux filesystem.
- Settings (wallpaper, colour cycling, scanlines) remembered in the visitor's browser.
- A clean app contract so new apps can be added for years without breaking the look.
- Deployable as static files to the owner's existing VPS.

**Non-goals (v1)**

- No accounts, no database, no server-side code.
- Visitors never run code on the server. Any future scripting runs in their own browser only.
- No real emulators yet (see Roadmap for later ideas such as v86).

---

## 3. Architecture

### 3.1 Two layers, one content source

1. **Static layer (Astro pages).** Every piece of content has its own HTML page generated at
   build time: home, project dossiers, memos, about. These pages work without JavaScript, are
   readable by search engines and screen readers, and use a simple HSOS-styled document layout.
2. **Shell layer (Preact island).** On capable desktop browsers the shell boots on top of the
   page and becomes the desktop. Windows display the same content as the static pages.

Deep links: visiting `/srv/divisions/signals/vitasdr/` (or whatever URL scheme we settle on,
see 3.3) boots the shell and opens that dossier window directly. With JS off, the same URL
shows the static dossier page.

### 3.2 Suggested source layout

```
src/
  content/
    projects/        one Markdown file per project (dossiers)
    memos/           blog posts, written as internal memos
    pages/           welcome.md (WELCOME.dd), about, etc.
  content.config.ts  collection schemas
  pages/             Astro routes for the static layer
  layouts/           static page layout (HSOS document style)
  os/                the shell
    palette.ts       the 256 entry palette and named ramps
    boot/            boot sequence script and component
    wm/              window manager (Window, drag, resize, focus, z-order)
    menu/            menu bar and dropdowns
    desktop/         wallpaper and icons
    vfs/             virtual filesystem (tree + content mounts)
    term/            terminal and command registry
    apps/            one folder per app (see section 12)
    sprites/         pixel art defined as palette index arrays
    settings.ts      settings store (localStorage, wrapped in try/catch)
  styles/            global CSS, fonts, scrollbar styling
public/
  fonts/             bitmap webfonts (licences in docs/CREDITS.md)
  shots/             project screenshots (dithered to the palette at build, optional)
```

### 3.3 URLs

Use Linux paths as URLs where sensible, they reinforce the joke and stay readable:

- `/` home (boots the desktop)
- `/srv/divisions/` list of divisions and products
- `/srv/divisions/<division>/<slug>/` a project dossier
- `/home/employee/memos/<slug>/` a memo (blog post)
- `/home/employee/WELCOME.dd` may stay a window only, with `/welcome/` as its static page

### 3.4 State

- Settings persist in `localStorage` under key `hsos.settings.v1`. Every read and write is in
  try/catch; the site must work when storage is blocked.
- Window positions do not persist in v1 (fresh desktop each visit), except the boot preference.

---

## 4. Visual system

### 4.1 Palette (256 colours)

- Implement a real indexed palette in `src/os/palette.ts`: an array of exactly 256 hex colours.
  **Decided 11 November 2026:** each theme is its own 256 colour palette (a palette swap, see
  4.9), and each wallpaper loads its own colours into the slots the system leaves free. Any
  theme with any wallpaper must still come to 256 or fewer; the build fails otherwise.
- Slots 0 to 15: the classic 16 colour set (used by the legacy terminal and text mode).
- Remaining slots: named ramps used across the UI, generated once at build time by stepping
  between key colours. Ramps used in the prototype:
  - `heat` (32): `#04001a #14005a #4a0a8a #a0208a #ff4a4a #ffaa2a #ffee66 #ffffff` (waterfall)
  - `cycle` (24): `#ff3a8a #ff8a3a #ffd23a #3ad27a #3aa8ff #8a3aff` and back (rainbow text)
  - `sky` (12): `#140030 #2a0a5a #5a1280 #9a2090 #e0407a #ff8a5a #ffc04a` (sunset wallpaper)
  - `sun` (10): `#fff27a #ffc04a #ff8a4a #ff5a6a #e03a8a`
  - `grid` (16): `#ff3ad1 #a03aff #3ad1ff` and back (wallpaper grid lines)
  - Window title ramps (4 steps each), see 4.3.
- UI ink colours: text `#1a1a6b`, links `#b0105a`, link hover background `#ffe066`, muted
  `#6a6a8a`, success `#14874a`, terminal green `#7dff9a`.
- **Rule:** gradients are always stepped bands built from palette entries. No smooth gradients.
- **Decided 1.1:**
  - Every colour the site uses, including one-off colours from the prototype (icons, ledger
    bars, wallpapers, scrollbars, window shadows), is a named slot in the palette. Smooth
    gradients in the prototype are converted to stepped bands.
  - Ramps own their own slots, even when a colour repeats in another ramp (real VGA palettes
    had duplicates too).
  - Slots not used by anything are filled with black and marked unspent. The `palette`
    terminal command prints the real number of unspent slots for Finance to worry about.
  - No transparency, with one exception: the CRT scanline overlay may use a palette colour
    at reduced opacity. Shadows are solid palette colours.
  - The palette reaches CSS as custom properties (`--c-ink`, `--ramp-files-0` and so on),
    generated from `palette.ts` at build time. Stylesheets use only those variables.
    `npm run check` fails if a hex colour appears anywhere in `src/` outside `palette.ts`.

### 4.2 Typography

- Primary UI font: a bitmap style font. The prototype used VT323 as a stand-in. For the build,
  evaluate fonts from the Ultimate Oldschool PC Font Pack (https://int10h.org/oldschool-pc-fonts/),
  which ships `.woff` web versions under CC BY-SA 4.0 (credit VileR in `docs/CREDITS.md`).
  Pick one for UI text and keep VT323 or a PC font for the terminal. Owner signs off the choice.
- **Decided 1.1:** the pixel font is for chrome, headings, labels and the terminal only. Long
  prose (dossier and memo bodies) uses a plain readable font. Until the owner picks one, prose
  uses the system sans serif stack. VT323 is self-hosted as the placeholder pixel font; no
  font is ever loaded from Google or another third party.
- Body text in dossiers and memos must stay comfortable to read at length (the owner finds
  dense reading hard): generous line height, short paragraphs, never tiny pixel fonts for prose.

### 4.3 Window chrome

- White window body, 2px solid border in the app's dark colour, 5px offset drop shadow in a
  light tint of the app colour.
- Title bar: 4 stepped bands left to right of the app's ramp, white text, path as title,
  `[X]` close button on the right. Title bars are the drag handle.
- App colour ramps (dark to light):
  - Documents/Welcome: `#1a1a8c #2a2aa8 #3b3bc4 #4d4de0`
  - Divisions/Files: `#0d6b3a #14874a #1ca35a #26bf6c`
  - The Board: `#5a0d6b #741a87 #8f2aa3 #ab3dbf`
  - Listening Post: `#0a5a6b #0f7387 #178ca3 #21a6bf`
  - Ledger: `#8a3a00 #a85000 #c66a10 #e08a28`
  - Dossier/HR: `#8a1a3a #a82a4a #c63a5a #e04a6a`
  - **Decided 1.1:** white title text must reach 4.5:1 on every band, so four ramps are
    darkened from the prototype values above. The build uses:
    - Divisions/Files: `#0d6b3a #127440 #167d46 #1b864c`
    - Listening Post: `#0a5a6b #0f6778 #147386 #198093`
    - Ledger: `#8a3a00 #93490a #9d5714 #a6661e`
    - Dossier/HR: `#8a1a3a #a02847 #b63553 #cc4360`
  - Settings/System: `#3a3a4e #4a4a62 #5a5a76 #6a6a8a`
  - Terminal: `#2a2a3a #3a3a4e #4a4a62 #5a5a76` on a `#05050f` body
- Menu bar: stepped purple ramp `#1a0a4a #2a0f63 #3d167d #531e96 #6b28b0`, yellow
  `#ffe066` bottom rule.

### 4.4 Scrollbars

Every window content area is a scroll container. Style scrollbars to match:
16px wide, purple bevelled thumb (`#741a87 / #ab3dbf / #5a0d6b` bands, light top-left and
dark bottom-right border), lilac checkered track, bevelled arrow buttons. Use
`::-webkit-scrollbar` rules for Chromium and Safari, and `scrollbar-color` only where
`::-webkit-scrollbar` is unsupported (Firefox), via `@supports not selector(::-webkit-scrollbar)`.

### 4.5 Pixel art and graphics

- Sprites are defined as arrays of palette indices (or palette names) and drawn to `<canvas>`
  with `image-rendering: pixelated`, or as CSS grids for tiny ones. Keep them crisp: integer
  scaling only.
- Logo: 24x24, drawn at 3x (masthead and boot screen). An enso brush circle in the logo ramp,
  landing heavy at the top and lifting thin at the upper right, with a sea wave breaking
  inside it in the wave ramp. Replaced the prototype's sliced sun diamond in November 2026.
- From the prototype: 14x9 Board eye whose iris colour cycles and which blinks every few
  seconds.
- Graphics are allowed and encouraged (charts, waterfall, icons), always within the palette.

### 4.6 Palette animation (colour cycling)

- A single shared clock (about 6 ticks per second) drives all animation.
- Cycling effects: rainbow title text, Board eye iris, sunset sun bands, wallpaper grid lines.
- Implement as palette rotation (shifting which ramp entry each element uses), not as
  per-frame redraws of large images where avoidable.
- Off when the Settings checkbox is off, and always off under `prefers-reduced-motion`.

### 4.7 Wallpapers

Eleven built in, chosen in Settings. Each owns its colours (`--wp-<id>-...` in CSS), so it looks
the same under every theme.

1. **Sunset** (default): 12 band sky, sliced sun, mountain silhouette, neon grid floor.
2. **Corporate**: purple checkerboard with small gold dots, conference carpet energy.
3. **Workbench**: stepped blue bands.
4. **DolDoc Paper**: pale lilac page with a faint dot grid (the TempleOS look).

Added 11 November 2026, one per new theme. These are drawn pictures, not CSS: indexed pixel art
200 pixels tall, as wide as the screen's shape needs, drawn by code in `src/os/desktop/drawn.ts`
and scaled up crisply. Colour cycling rotates the ramps each one names. All are original scenes
made for HSOS, in the spirit of an era or genre; none copies a real wallpaper, logo or album
cover.

5. **Teal Horizon** (Workstation 95): the company sunset as a dithered sixteen colour picture,
   teal sky, hills and grid.
6. **READY.** (Home Office 64): a blue screen inside a striped loading border, a banner ("256
   COLOURS APPROVED. 0 FEELINGS FREE"), a blinking cursor and a raster sunset. The lettering is
   HSOS's own 5x7 font, not a machine's character ROM.
7. **Pinboard** (Archimedes): textured grey backdrop with the sunset pinned up in a frame.
8. **Copper** (Workbench 1.3): copper bars across a blue screen over a checkered floor.
9. **Plaza** (Plaza 1999): marble bust before a sliced sun, two columns, a leaping dolphin, a
   palm and a neon grid.
10. **Closing Time** (Late Appointment): a barber's at dusk in a pastel city, crescent moon,
    lit windows, neon sign, a turning barber's pole.
11. **Poolside** (Resort '84): blue sky, flat white clouds, a white villa, palms and a rippling
    pool.

### 4.9 Themes (decided 11 November 2026)

A theme is a palette swap: it keeps the palette's slot layout and gives the slots new values,
then adds small era touches to the chrome (`src/styles/themes.css`): bevels, borders, where the
close button sits. Windows, menus, fonts and keyboard behaviour are the same in every theme.
Choosing a theme also loads its wallpaper; afterwards any wallpaper can be worn with any theme.
The theme is a desktop setting: static pages and Plain View always use the house theme.

| Id | Name | After | Wallpaper | Chrome touches |
|---|---|---|---|---|
| `hsos` | HSOS 256 | the house style | Sunset | none |
| `win9x` | Workstation 95 | Windows 95 and 98 | Teal Horizon | grey bevelled windows, sunken page, navy title bars, grey menu bar |
| `c64` | Home Office 64 | the Commodore 64 | READY. | blue pages, thick light blue frame, capitals in the chrome |
| `riscos` | Archimedes | RISC OS 3 on the Acorn Archimedes | Pinboard | black outlines, cream title bar for the window with focus, close at top left |
| `amiga` | Workbench 1.3 | Workbench on the Amiga | Copper | blue pages, white frames, white title bar for the window with focus, close at top left |
| `vaporwave` | Plaza 1999 | vaporwave | Plaza | pastel bevels with pink shadows |
| `barber` | Late Appointment | Barber Beats album art | Closing Time | dusky purple title bars, lavender shadows |
| `citypop` | Resort '84 | Japanese city pop artwork of the 1980s | Poolside | racing stripes under title bars |

- Names are in-house names, not the products' own. "After" lines in Settings say what each is
  in the spirit of.
- Every theme keeps the contrast rules: title, menu and button text reach 4.5:1 on every band,
  body text 7:1 on its page, links and muted text 4.5:1.
- Home Office 64 and Workbench 1.3 have dark blue pages with light text, as those machines did.
  Their text is lightened from the real machines' colours so it stays comfortable to read.
- The chosen theme is applied in the page head before the desktop starts, so there is no flash
  of the house colours.
- Themes and wallpapers add about 22 KB of custom properties to each page's inline style block (the whole block is about 6 KB
  compressed). If that grows, move the theme blocks to their own stylesheet.

### 4.8 CRT scanlines

Optional full screen overlay of faint horizontal lines. Off by default. Never flickers.

---

## 5. Window manager

- Open, focus (click anywhere in a window brings it to front), close.
- Drag by title bar, using pointer events. Clamp so a window can never be lost off screen
  (title bar always reachable).
- Resize from a grip in the bottom right corner. Minimum size 240x140.
- **Initial size fits the content** (owner's request, so visitors are not made to scroll
  straight away). Document windows (the page viewer: WELCOME.dd, Divisions, dossiers, memos)
  open at their app's default width, and once their page has loaded the height is set so the
  content fits with no scrollbar. An app can also ask for its width to fit: then the window
  widens until every line marked `data-fit-line` in the page sits on a single line, or for
  all the width it has (`'wide'`, up to 1400px) when its page reflows into columns.
- That fitted size is **capped to the visible desktop**: 16px clear of the menu bar, of the
  desktop icon column on the right, and of the bottom of the screen, measured from where the
  window was placed. Content bigger than the cap scrolls (section 4.4).
- Fitting follows the content while it loads (fetched pages, images arriving) and stops for
  good the moment the visitor resizes that window by hand, by the grip or the keyboard. Moving
  a window does not stop it. Apps with their own layouts (Terminal, Board, Ledger and so on)
  keep their fixed default sizes, and Handheld windows are always full screen.
- Content areas scroll automatically when content is larger than the window (section 4.4).
- Singleton apps (most of them) re-focus their existing window instead of opening another.
- Keyboard: windows are focusable; Escape closes the focused dialog; future shortcut to cycle
  windows. (Built in Phase 6 as Ctrl+backquote, see 12.4.)
- Later (not v1): minimise to desktop, maximise, window list, snapping.

---

## 6. Menu bar

A permanent menu bar across the top, with dropdown menus. Behaviour:

- Click a menu title to open it. While one menu is open, hovering another title switches to it.
- Clicking outside, pressing Escape, or choosing an item closes the menu.
- Keyboard: menus reachable by Tab, arrow keys move between items and menus, Enter activates.
- Disabled items are shown greyed with a reason on the right.
- Right side of the bar: a MORALE meter and a live clock.

Menus and items (v1):

- **◆ HSOS**: About HSOS, (separator), Workplace Settings, Reboot (`Ctrl+Alt+Del` label),
  Log Out (disabled: "not on your plan")
- **Files**: Home (`~/`), Divisions (`/srv/divisions`), Ledger (`/var/lib/ledger`),
  (separator), Mount /mnt/legacy (HR memo: it has always been mounted),
  Shred (disabled: "needs 3 signatures")
- **Applications**: Terminal, The Board (`F7`), Listening Post 7, Ledger, (separator), Settings
- **Divisions**: one item per project, labelled with its division, opening its dossier.
  Generated from content.
- **Help**: Employee Handbook (opens WELCOME.dd), man hsos (HR memo), (separator),
  Report a Bug (HR memo: "Bugs are features awaiting budget approval.")

---

## 7. Desktop icons

A column of icons down the right edge, each a small piece of pixel art with a white label tag:
`divisions/`, `boardd`, `/dev/lp7`, `ledger`, `terminal`, `/etc/hsos`, `/dev/null`.
Single click opens. `/dev/null` shows an HR memo ("Anything sent to /dev/null is reviewed by
the Board within 0 working days.").

---

## 8. Boot sequence (must have)

Full screen black screen, logo sprite and BIOS header, then lines appear one at a time,
then a stepped rainbow progress bar fills, then the desktop appears.

Script (keep the jokes, timing about 160ms per line):

```
HIRAETH SYSTEMS BIOS v4.04
(C) 1987-2026 Hiraeth Systems. All feelings reserved.
CPU: Synergy Processor 486DX2-66 ........ OK
Memory test: 640K ......................... ENOUGH
Detecting employee ........................ found (uid 1000)
Detecting longing ......................... SEVERE
Booting HSOS kernel 2.0.36-corp ...
[    0.000000] HSOS version 2.0.36-corp (board@hiraeth) #1 SMP PREEMPT_BOARD
[    0.104221] Command line: ro quiet compliance=strict appeals=0
[    0.882013] palette: 256 colours approved by Finance
[    1.320557] lp7: listening post registered on /dev/lp7
[  OK  ] Mounted /srv/divisions.
[  OK  ] Mounted /mnt/legacy (read-only, mostly).
[  OK  ] Started Compliance Daemon (complianced).
[  OK  ] Started The Board (boardd).
[  OK  ] Started Listening Post 7 (lp7d).
[ WARN ] Longing exceeds safe operating levels. Continuing anyway.
[ FAIL ] Failed to start Work-Life Balance Service.
         See 'journalctl -u balance' for details. Details unavailable.
[  OK  ] Reached target Morale (within tolerance).
[  OK  ] Started HSOS Display Manager.

hsos login: employee
Password: ********
Last login: forever ago from the cafeteria.
```

Status tags: `[  OK  ]` green `#3aff7a`, `[ WARN ]` yellow `#ffd23a`, `[ FAIL ]` red `#ff4a6a`.
Kernel lines in muted `#8a8aa8`.

Rules:

- Click anywhere, or press any key, to skip.
- **First visit** in a browser: full boot. **Later visits**: a short boot (about one second,
  just the BIOS header and "Last login") unless the visitor runs `reboot`.
- `prefers-reduced-motion`: show the final screen instantly, then the desktop.
- **Decided 1.1:** the full first-visit boot only plays on `/`. A first visit that lands on any
  other URL (a deep link to a dossier or memo) gets the short boot, so content is not delayed.
- **As built (Phase 3):** 160ms per line, then a 0.8 second hold on the finished screen (about
  4.5 seconds in all). The short boot lasts 1 second. Under reduced motion the finished screen
  is shown still for 0.5 seconds. "Seen the full boot" is stored as `seenBoot` in
  `hsos.settings.v1`; only a full boot sets it, so a visitor who first arrives on a deep link
  still gets the full boot on their first visit to `/`. While booting, the desktop is `inert`
  and the "Click to skip" button has focus; screen readers hear "HSOS is starting. Press any
  key or click to skip." rather than every log line.
- `reboot` in the terminal and Reboot in the menu replay the full boot.

---

## 9. Virtual filesystem

A Linux style tree. Content collections are mounted into it automatically.

```
/
├── bin/          bash  board  comply  resign (disabled)
├── boot/         vmlinuz-2.0.36-corp  initrd-of-optimism.img
├── corp/         mission.txt  org-chart.svg (classified)
├── dev/          lp7  null  synergy  tty0
├── etc/          hsos/workplace.conf  passwd (redacted)  motd
├── home/employee/ WELCOME.dd  memos/  .bash_history (seized)
├── mnt/legacy/   hsos-1.0-textmode/STILL_RUNNING.txt
├── opt/board/    boardd  oracle.words
├── proc/         1/cmdline  longing  morale  uptime
├── srv/divisions/<division>/<project>/DOSSIER
└── var/          lib/ledger/morale.csv  log/morale.log  log/complianced.log
```

Fixed file contents (from the prototype):

- `/corp/mission.txt`: "To synergise longing at scale, for ever, for shareholders."
- `/proc/longing`: "longing: 100% (all cores)"
- `/proc/morale`: "morale: WITHIN TOLERANCE"
- `/proc/uptime`: "uptime: since before you were hired"
- `/proc/1/cmdline`: "/sbin/board --forever --no-appeals"
- `/etc/motd`: "Message of the day: there is no day, only the quarter."
- `/mnt/legacy/hsos-1.0-textmode/STILL_RUNNING.txt`: "Yes. Nobody signed the decommissioning form."
- `/var/log/morale.log`: permission denied (write-only)

Opening certain files opens apps: `WELCOME.dd` opens the document viewer, `morale.csv` opens
the Ledger, `workplace.conf` opens Settings, any `DOSSIER` opens that project's dossier.

---

## 10. Terminal

- Prompt: `employee@hsos:<path>$`, with the home directory shown as `~`.
- Output scrolls (newest at bottom), keeps the last 120 lines, coloured per line.
- Command history with Up/Down arrows (new in build). Tab completion of paths (new in build).
- Note: browsers use F7 for caret browsing. Test in Phase 5 whether it can be intercepted
  while the terminal has focus; if not, document `board` as the main way in. (See 12.3.)
- Commands are registered through a command registry so apps can add their own.

v1 commands:

| Command | Behaviour |
|---|---|
| `help` | List commands |
| `ls [path]` | List a directory (`dir` alias) |
| `cd [path]` | Change directory, `~` and `..` supported, refuse non-directories |
| `pwd` | Print working directory |
| `cat FILE` | Print a file, or open the matching app (see section 9) |
| `open X` | Open an app or a project by name/slug |
| `board` / F7 | Print a Board directive and update the Board window |
| `wall X` | Set wallpaper: sunset, corporate, workbench, paper, teal, ready, pinboard, copper, plaza, salon, poolside |
| `theme X` | Set theme (and its wallpaper): hsos, win9x, c64, riscos, amiga, vaporwave, barber, citypop |
| `palette` | Print colour bars, the real count of unspent slots, and Finance's concern |
| `uname -a` | `HSOS hsos 2.0.36-corp #1 SMP PREEMPT_BOARD i486 Hiraeth/Systems` |
| `whoami` | `employee (uid=1000 gid=1000(assets) groups=1000(assets),27(sudo-pending))` |
| `sudo`, `su` | Not in the sudoers file, incident reported to the Board |
| `rm` | Refuses: redundancies are handled by HR |
| `exit`, `logout`, `resign` | Not available on your plan |
| `reboot`, `shutdown` | Broadcast message, then full boot |
| `clear` | Clears output |
| anything else | `<cmd>: command not found. This incident has been logged.` |

Later: a small scripting language (working name CorpScript), or real Lua via a WebAssembly
build, running only in the visitor's browser. Not in v1.

---

## 11. Apps in v1

All behaviours below exist in the prototype unless marked (new).

1. **WELCOME.dd** (`/home/employee/WELCOME.dd`): the handbook. Logo sprite, colour cycling
   "HIRAETH SYSTEMS" title, hyperlinked text where underlined words open apps, sections:
   Getting started, Filesystem orientation, Your rights (under review by Legal).
   Content comes from `src/content/pages/welcome.md`; links in it use a custom syntax to open
   apps (for example `[Listening Post](hsos:open/listening)`).
   Default size: 660px wide, height fitted to the content (section 5). On the owner's monitor
   that is about 28% of the screen width and 85% of the desktop height.
2. **Divisions** (`/srv/divisions/`): list of projects with small icons, slug and division.
   Clicking opens the dossier. Default size: as wide as the room allows (up to 1400px), then
   height fitted to the content. Once the page is at least 900px wide the divisions sit in two
   balanced columns, so the window stays short enough to need no scrolling on the owner's
   monitor; summaries may wrap to two lines there. Narrower, it is one column as before.
   (Changed on 11 November 2026, when the project list grew to fourteen and the single column
   ran off the bottom of the screen. Before that, the width fitted each summary on one line.) On the home page it opens 16px to the right of WELCOME.dd, side by side and never
   overlapping, capped so it stops 16px short of the icons; if the screen is too narrow for
   both, it cascades over the handbook as before.
3. **Dossier** (`/srv/divisions/<division>/<slug>/DOSSIER`): screenshot panel, name, division,
   platform, status, description, links (new: repo and download links).
4. **The Board** (`/opt/board/boardd`): eye sprite, a six word directive drawn from the word
   list, Consult button. Word list is in section 15.
5. **Listening Post 7** (`/dev/lp7`): animated waterfall (56 columns x 18 rows, heat ramp),
   four fake drifting signals, two keying like Morse, drifting frequency readout around
   7.074.000 kHz LSB. Only animates while the window is open. Later: optional live data.
6. **Ledger** (`/var/lib/ledger/morale.csv`): stepped colour bar chart "Morale by Quarter",
   Q1 to Q7 and Q∞, Reforecast randomises it.
7. **Settings** (`/etc/hsos/workplace.conf`): theme picker with swatches (4.9), wallpaper picker with thumbnails, colour cycling
   toggle, CRT scanline toggle, (new) "full boot every visit" toggle. Saved to localStorage.
8. **Terminal**: section 10.
9. **HR memo dialog**: small modal used for jokes and system messages, single Acknowledge button.
10. (new, after v1) **Estate Survey** (working title, `/usr/games/survey`): see 11.1 below.

### 11.1 Estate Survey (decided 1.1, first version built 11 November 2026)

The owner asked for a game in the style of Lander and Zarch on the Acorn Archimedes. It is an
**original** HSOS game in that genre, not a recreation: no names, ship, levels, enemies or
look are taken from those games. What it shares is the genre: a craft that thrusts along its
own tilt over a 3D landscape of flat shaded tiles, with gravity, momentum and fuel.

- First version is **free flight only** (owner's choice): fly, land, refuel, crash. The goal
  of the game is decided once the owner has tried it. Ideas so far: containing red tape that
  spreads across the estate, or deliveries between pads.
- **Controls** (owner's choice): the mouse tilts (further from the middle tilts harder) and the
  button thrusts; arrow keys tilt and Space thrusts; Escape pauses. On touch screens, drag on
  the view to tilt and hold the Thrust button.
- **Colours** (owner's choice): only ramps HSOS already has, no new palette slots. Grass is the
  Divisions greens running into the Ledger's Q4 greens; sea is the Listening Post teals into Q5;
  sand, rock and snow likewise. The sky is the sunset ramp.
- A small software renderer draws into an **indexed framebuffer** (one palette slot per pixel)
  and shows it scaled up by whole numbers, so no blended colour can ever appear. A test checks
  every pixel on screen against the palette.
- The estate is 64 by 64 tiles and wraps round. **Every new game generates a new estate**
  from a random seed (owner's request): lowlands, hills and snow capped mountain ridges, the
  sea, lakes, woods of trees on the grass, and three 3 by 3 landing pads placed on dry, gentle
  ground well apart. Water only lies where it really would (after the owner spotted lakes
  hanging on hillsides): all ground below sea level is sea, and a lake fills a basin only up to
  its lowest rim, where it would spill. A few hollows are pressed into level hilltops and
  valley floors so most estates have hill lakes. Puddle sized basins stay dry dips, and basins
  bigger than 140 vertices stay dry valleys, taken to be drained by rivers that are not drawn.
  Pads never sit in or by water, and the water settles after the pads are laid. A crash keeps the same
  estate; "New estate" on the pause card makes another. Pads refuel the drone; landing
  anywhere else is allowed if it is gentle, level and on even ground. Water (sea or lake) is
  always a crash, and so is flying into a tree or a boat. A crash issues a replacement drone
  at Pad A.
- **Landing pads** look like landing pads (owner's request): dark tarmac, yellow and black
  hazard stripes round the edge, the pad's letter (A, B or C) painted large in white, and a
  green lamp on a post at each corner. The lamps blink slowly (owner's request), on for 0.8s
  and off for 0.4s, each pad out of step with the others; under reduced motion they stay lit.
  Pads stay yellow on the minimap.
- **Boats** potter about on the sea (owner's request), never on lakes: one per 110 sea tiles
  with no cap, so every estate is equally busy for its size (owner's request); the three kinds
  take turns so they come out evenly. Three kinds: a wooden rowing dinghy, a sailing boat with a company
  red sail, and a tug with a red hull, white wheelhouse and yellow funnel. They drift slowly,
  bob on the swell, wander now and then, and turn away before they run aground. They only move
  while the game runs, and show on the minimap as red specks (owner's request).
- **Draw distance** is 96 tiles ahead (owner's request; it was 30, which left the sky filling
  half the view). Land is drawn tile by tile out to 32, in 2 by 2 blocks out to 60, then 4 by 4
  blocks, which keeps a frame around 2ms. Trees and pad lamps stop at 60. The estate is only 64
  wide, so the far distance shows the land repeating, which is honest: it wraps round.
- A **minimap** sits in the top left of the view (owner's request): the whole estate, one
  pixel per tile (two on big views), north up and centred on the drone, drawn into the same
  framebuffer. Pads are yellow, woods dark green, the drone a white cross.
- The camera faces north, follows from behind and above, pulls back as the drone climbs, and
  aims between the drone and its shadow so both stay in view.
- It runs on its own animation frame loop (smooth flight needs it), not the shared six tick
  clock. It **only starts when the player asks**, and pauses on Escape, a press outside it,
  losing focus, or a hidden tab. Under reduced motion the start card says it moves a lot.
- Added: desktop icon `survey`, Applications > Estate Survey, terminal command `survey`, and
  `/usr/games/survey` plus `/usr/games/README` in the filesystem.

---

## 12. App contract (how to add new apps)

Every app is a folder in `src/os/apps/<id>/` exporting a manifest:

```ts
export interface HsosApp {
  id: string;                    // 'ledger'
  title: string;                 // 'Ledger'
  path: string;                  // '/var/lib/ledger/morale.csv', shown in the title bar
  ramp: RampName;                // title bar colour ramp from palette.ts
  icon?: Sprite;                 // desktop / menu icon
  defaultRect: { x: number; y: number; w: number; h: number };
  minSize?: { w: number; h: number };
  fitContent?: (args) => 'height' | 'both' | 'wide' | undefined; // fit the first size to the content (section 5)
  singleton?: boolean;           // default true
  menu?: { menu: 'files' | 'apps' | 'help'; label: string; key?: string }[];
  commands?: TerminalCommand[];  // terminal commands this app adds
  vfs?: VfsMount[];              // files/dirs this app adds to the filesystem
  component: (props: AppProps) => JSX.Element; // window contents only
}
```

`AppProps` gives the app a small context: `open(appId, args?)`, `memo(text)`, `vfs`,
`settings`, `palette`, `clock` (the shared animation tick) and `args`.

Apps draw only their window contents. The window manager owns chrome, title, drag, resize,
scrolling and focus. This is what keeps every future app looking like part of one suite.

---

### 12.1 Decided 1.1, as built in Phase 2

- The manifest uses `chrome(args)` (title bar path and ramp) instead of a fixed `path`, and
  `defaultSize(args)` instead of `defaultRect`: the window manager chooses the position and
  keeps it on screen. Apps with many windows give a `windowKey(args)`; opening the same key
  again focuses the existing window. `menu`, `commands` and `vfs` arrive with the phases that
  need them (menus are built centrally in `src/os/menu/menus.ts` until then).
- `AppProps` currently has `args`, `open`, `memo` and `settings`. `vfs` (Phase 5) and `clock`
  (Phases 4 and 6) are added when they exist.
- **Page viewer** (`src/os/apps/page/`): one window per static page. It fetches the real page
  and shows its `.doc-body`, so windows and static pages share one source. Links to HSOS pages
  open in windows, outside links open in a new tab, and `hsos:open/<app>` words become buttons.
- Apps not built yet (The Board, Listening Post, Ledger, Settings, Terminal) open an HR memo
  saying they are awaiting budget approval.
- The address bar follows the focused page window (`history.replaceState`), so any window can
  be shared. It is left alone on first load. Closing every window returns it to `/`.
- The desktop starts only at 900px wide and above; narrower screens keep the static pages
  until Handheld mode (Phase 6). (Superseded by 12.4: smaller screens now run Handheld.)
- **Plain View** (◆ HSOS menu) turns the desktop off for the rest of the tab session
  (`sessionStorage` key `hsos.plain`) and shows a "Return to the desktop" button. This is for
  anyone who would rather just read.
- Home opens WELCOME.dd with Divisions beside it. A deep link opens just that page. An unknown
  URL opens the 404 page in a window.
- The Files menu also has **Memos** (`~/memos`), as memos are the blog.
- Disabled menu items stay focusable (`aria-disabled`) so their reason can be read.
- Closing a window moves keyboard focus to the window now on top.

### 12.2 Decided 1.1, as built in Phase 4

- `AppProps` gains `updateSettings(patch)` (the desktop saves the change and every window sees
  it) and `clock`, which says what an app may animate: `cycling` (palette rotation, off when
  the Settings checkbox is off or reduced motion is asked for) and `motion` (any movement, off
  under reduced motion). Apps call `useTick(...)` from `src/os/clock.ts` with whichever
  applies. One shared timer, 160ms a tick, runs only while something listens and the tab is
  visible.
- **WELCOME.dd** stays a page viewer window on the real static page. The static page now has
  the logo (drawn as SVG at build time, so it works without JavaScript) and the title letters
  carry their starting step on the cycle ramp; the window moves them along it each tick.
- **Divisions** and **Dossier** stay as page viewer windows on their static pages, which
  already show everything 11.2 and 11.3 ask for. Small icons per project can come later.
- **The Board**: the eye has a one pixel dark outline so the white of the eye shows on the
  white window. The iris cycles only with colour cycling on; the blink (every 40 ticks) stops
  only under reduced motion. The word list lives in `src/os/text/board-words.ts` so the
  terminal can consult the Board without reaching into the app.
- **Ledger**: new figures each time the window opens. The chart is decorative and the same
  figures are in a hidden table for screen readers.
- **Listening Post 7**: two signals key real Morse ("CQ CQ DE HSOS" and "HIRAETH"). The
  waterfall moves whether or not colour cycling is on, as it is motion rather than palette
  rotation, and under reduced motion it shows one still frame. It is scaled by whole numbers
  only, so it does not always fill the window width.
- **Workplace Settings**: wallpaper thumbnails are small copies of the real wallpapers, and the
  chosen one is marked with `aria-pressed`. Under reduced motion the colour cycling checkbox
  is shown off and disabled, with a note saying why.

### 12.3 Decided 1.1, as built in Phase 5

- The manifest gains `commands` (terminal commands the app adds) and `vfs` (files it adds), as
  section 12 always intended. The Board adds `board` and `/opt/board/*`; Settings adds `wall`
  and `workplace.conf`; the Ledger, Listening Post and terminal add their own files. Core
  commands live with the terminal (`src/os/apps/terminal/commands.ts`).
- `AppProps` gains `vfs`, `commands` (every app-added command) and `reboot`.
- The filesystem is built once when the desktop starts: the fixed tree (`src/os/vfs/base.ts`),
  then every dossier and memo from content, then app files. Names carry tags shown in listings
  ("passwd (redacted)"), so Tab completion uses the real name.
- The Board's current directive lives in `src/os/apps/board/directive.ts`, so the `board`
  command, F7 and the Consult button always agree with the Board window.
- The terminal window's title is `/dev/tty0`. The working directory is shown in the prompt.
- Tab completes only when something has been typed. On an empty line Tab moves focus as
  usual, so keyboard users are never trapped. Shift+Tab always moves focus.
- F7 in the terminal is caught and its default prevented, and the tests confirm the terminal
  receives it. Whether a given browser still toggles caret browsing has to be checked by hand
  in a real browser (the test browser has no caret browsing prompt). `board` is the documented
  way in either way.
- Texts not given in section 9 are house style and can be changed freely: binary files ("would
  only upset you"), `/dev/synergy`, `/var/log/complianced.log`, the redacted, classified,
  seized and disabled files, and the replies to `cat` or `open` with nothing after them.
- The output is a `role="log"` live region, and `palette` draws each colour as a swatch with
  its name and hex code beside it in normal text, so dark colours stay readable.

### 12.4 Decided 1.1, as built in Phase 6

- **Colour cycling:** the sunset sun's bands roll and the grid lines step through the grid ramp
  every third tick (about twice a second), only with colour cycling on.
- **Switching windows:** Ctrl+backquote (the key left of 1) goes to the next window in opening
  order, Ctrl+Shift+backquote to the previous one. Chosen by the owner, as Alt+Tab, Ctrl+Tab,
  F6 and Alt+letters already belong to the system or the browser.
- **Moving and resizing without a mouse:** with a window frame focused (as it is when it
  opens or is switched to), arrow keys move it 20px and Shift with arrow keys resizes it. Every
  window describes this to screen readers, and Help has a Keyboard Shortcuts memo.
- **Reduced motion** now follows the system setting live, without a reload.
- **HSOS Handheld** runs when the screen is under 900 by 560 pixels (so a phone held sideways
  counts as handheld too). The static page is hidden at every size while the shell runs,
  except in Plain View, and still shows if the shell has not started within 4 seconds.
  - One app fills the screen below the menu bar. Windows behind it stay open (so the terminal
    keeps its history) but hidden. Closing the app shows the one underneath, then the home
    screen. Title bars cannot be dragged and there is no resize grip.
  - The menu bar folds into one ◆ HSOS menu with every item, groups split by separators.
  - The desktop icons become a home screen grid, out of reach of Tab while an app is open.
  - `/` opens just WELCOME.dd; a deep link opens just that page.
  - Handheld always plays the short boot, unless "Full boot every visit" is ticked or the
    visitor chooses Reboot.
  - Turning a tablet, or resizing a browser, switches between Handheld and the desktop live.
    Windows keep their desktop positions for when there is room again.
  - The WELCOME.dd copy is worded to suit both Handheld and the desktop (no mention of
    dragging or resizing windows).

## 13. Content model

`src/content/projects/<slug>.md` frontmatter:

```yaml
name: VitaSDR
slug: vitasdr
division: signals            # signals | legacy-acquisitions | leisure-compliance | general-services | countermeasures | occupational-health
platform: PS Vita, C, VitaSDK
status: in-development      # planned | in-development | prototype | released | archived
summary: One or two plain sentences, no satire.
screenshot: /shots/vitasdr.png   # optional
icon: vitasdr                    # sprite id, optional
links:
  repo: https://github.com/hiraethsystems/...
  release: ...
order: 10
```

`slug` must match the file name (the build fails otherwise).

The Markdown body is the full description. Satire may live in the dossier chrome; the
description itself stays factual so people can actually learn about the project.

`src/content/memos/<slug>.md`: title, date, from (a Division), to (default "All Employees"),
summary, body. Rendered as an internal memorandum.

Initial projects: VitaSDR (Signals), DX Garden (Signals), Moon Child Vita (Legacy
Acquisitions), DreamKartsU (Leisure Compliance), RBR-1 (Defence Contracts, now Countermeasures). The first four
were written from their GitHub READMEs with screenshots from their repositories. RBR-1 has
no repository yet and stays a placeholder until the owner supplies it (`docs/CONTENT.md`).

Added on 11 November 2026, also written from their GitHub READMEs: EtherLog, OWTR Viewer and
DX Garden Stations (Signals), NetSplitElectron, Bonsai and ByteNoise (General Services),
UnThreader (Countermeasures) and Flare Enough (Occupational Health). EtherLog, OWTR
Viewer, DX Garden Stations and ByteNoise have no screenshot in their repositories yet. Other
repositories on the owner's GitHub (Ionosonde, DX-Garden-Win, the vita-homebrew and
wiiu-homebrew catalogues, and this site) were left off by the owner's choice.

Extra screenshots may sit in a dossier's Markdown body as `<img>` tags with `width` and
`height` set, so the space is reserved before they load and fitted windows do not jump.

---

## 14. Phones and small screens

Below 900px wide, run **HSOS Handheld** mode:

- No dragging or overlapping. One app fills the screen at a time.
- The menu bar collapses to a single ◆ menu listing everything.
- Desktop icons become a home screen grid.
- Boot sequence still plays (short version), skippable by tap.

---

## 15. Text resources

**Board word list** (extend freely, keep the corporate plus melancholy mix):
QUARTERLY ripple LEVERAGE yearning dividend SEAMLESS synergy impermanence PIVOT gently ALIGN
longing stakeholder TIDE "circle back" bandwidth HIRAETH dawn SCALE static compliance grace
DISRUPT mist offboard ETERNAL headcount moth DELIVERABLE harbour optimise silence KPI
reception onboarding ghost VERTICAL sea runway dusk.
Capitalisation is part of the effect: mixed upper and lower case words.

**Welcome copy**: lives in `src/content/pages/welcome.md` and no longer follows the prototype.
Rewritten in November 2026 to be flatter and more procedural: plain manual language with the
odd dry line, rather than a punchline on every line. The masthead has no tagline: just the
logo and HIRAETH SYSTEMS, sized to fill the width of the black box.

**Bilingual (later)**: Cymraeg and English toggle. Any Welsh must be checked by a fluent
speaker before going live.

---

## 16. Accessibility and quality bar

- Real semantic controls. Visible focus outlines styled to match.
- Text contrast at least 4.5:1 against its background.
- Decorative sprites `aria-hidden`; meaningful graphics have labels.
- No-JS and reduced motion both fully supported (section 3, 4.6, 8).
- No layout shift during boot. The shell must stay responsive while animating.
- Lighthouse style checks on the static pages: fast, accessible, indexable.

---

## 17. Deployment

- Build on Saoirse: `npm run build` produces `dist/`.
- Deploy with `scripts/deploy.sh`, which rsyncs `dist/` to `/var/www/hiraeth.systems/` on the
  VPS over SSH. Host and user come from environment variables, never committed.
- **Decided 1.1, deploying through Claude Code:**
  - On Saoirse, `~/.ssh/config` has a `hsos-vps` entry (user `ubuntu`, key `~/.ssh/id_ed25519`,
    installed on the VPS with `ssh-copy-id`). The untracked `.env` sets `HSOS_DEPLOY_HOST=hsos-vps`.
  - The owner types `/deploy`. The skill (`.claude/skills/deploy/SKILL.md`) runs a dry run,
    summarises what will change, waits for the owner's yes, deploys, and verifies.
  - `scripts/deploy.sh` refuses uncommitted changes, runs `npm run check` and the build, writes
    `/version.txt` (commit and build time), only ever writes to `/var/www/hiraeth.systems`,
    never creates folders or uses sudo, and confirms the server reports the new commit.
  - `--dry-run` lists the changes without uploading.
- The VPS also serves **`websdr.hiraeth.systems`** (its own nginx file). Like Ghost, it must not
  be disturbed.
- VPS: Ubuntu 22.04 with nginx, already serving the Ghost site hiraeth.club. HSOS gets its own
  server block (`deploy/nginx/hiraeth.systems.conf`) and its own TLS certificate. Never edit
  the Ghost nginx files.
- TLS: the Ghost install appears to manage certificates with acme.sh in `/etc/letsencrypt`.
  Check that first, and reuse it for hiraeth.systems; otherwise use certbot. See README.
- **Decided 1.1, HTTPS live 11 November 2026:** Ghost does use acme.sh (its certificate is in
  `/etc/letsencrypt/hiraeth.club/`), but certbot is also installed and already renews the two
  websdr certificates on `certbot.timer`. HSOS uses **certbot**, webroot method, certificate
  name `hiraeth.systems` (covers `www` too), with a deploy hook that reloads nginx. This keeps
  HSOS entirely clear of Ghost's acme.sh setup and never lets a tool edit nginx files. The
  owner approved Claude Code doing this over SSH with sudo, once, for this step only; the
  deploy script still never uses sudo. `www` and plain HTTP redirect to `https://hiraeth.systems`.
  HSTS is not switched on yet (it is hard to undo); add it once the site has run well for a while.
- Caching (11 November 2026): pages, screenshots and `version.txt` are served with
  `Cache-Control: no-cache`, so browsers check with the server (a cheap 304 when nothing
  changed) and a deploy shows straight away. Hashed files in `/_astro/` keep their one year
  cache. Before this, nginx sent no header and Firefox kept showing old dossiers after a
  deploy. The desktop's document windows also fetch with `cache: 'no-cache'`.
- Note for later: Ubuntu 22.04 leaves standard support in May 2027. Plan the VPS upgrade
  before then.

---

## 18. Build phases

Each phase ends with a working build, a commit, and a plain English summary to the owner.

0. **Scaffold**: Astro + TypeScript + Preact, content collections, palette.ts, fonts,
   CREDITS.md, check scripts (`astro check`, TypeScript, colour check; no ESLint for now). Static page layout in HSOS document style.
1. **Static layer**: home, divisions list, dossier pages, memo pages, all working with JS off.
2. **Shell core**: desktop, wallpapers, window manager (drag, resize, focus, scroll),
   menu bar with dropdowns, desktop icons, HR memo dialog.
3. **Boot sequence** (section 8), including first visit / later visit logic.
4. **Apps**: WELCOME.dd, Divisions, Dossier, The Board, Ledger, Settings, Listening Post 7.
5. **Terminal and VFS**: command registry, history, tab completion, filesystem mounts.
6. **Polish**: colour cycling, scanlines, keyboard support, reduced motion, Handheld mode.
7. **Deploy**: nginx server block, TLS, deploy script, go live.

## 19. Ideas backlog (after v1)

From the design session, in rough priority order:

- Crash screen easter egg (blue "Synergy Exception" screen, triggered by commands like
  `unionise` or `rm -rf /`).
- Visitor ID badge with promotions earned by exploring, stored locally only.
- Memo archive (blog) styling and RSS feed.
- Screensaver after idle time ("Your manager has been notified").
- Cafeteria Radio music player for the owner's own tracks.
- Sprite Studio, a 16/256 colour pixel editor.
- Built-in mini games (Quarterly Targets).
- Live Listening Post fed from the owner's own receiver.
- Cymraeg / English toggle.
- Suggestion Box guestbook and shared Employee Wall (these need a small server API).
- CorpScript or Lua scripting in the terminal.
- v86 based "legacy division" running a real old OS in a window.

## 20. Open decisions (owner to confirm)

- Final UI and terminal fonts, and the font for long prose (system sans serif until then).
- Exact URL scheme (section 3.3 proposal).
- Whether the boot plays in full on every visit or only the first (spec default: first only).
- RBR-1 description and screenshot (`docs/CONTENT.md`).
