# HSOS: instructions for Claude Code

This repository is **HSOS**, the website at **hiraeth.systems**. It presents itself as the
operating system of Hiraeth Systems, a fictional, faintly sinister 1990s mega corporation.
It is the owner's main online identity and a home for her projects, and it must keep growing
over time as new apps slot into one consistent "suite".

**Before doing any work, read `docs/SPEC.md`.** It is the source of truth for every design
and behaviour decision already made. Do not re-decide things the spec has settled. If the
spec is silent or contradicts itself, ask the owner, then record the answer in the spec.

`docs/reference/prototype.dc.html` is a working design prototype built in a design tool.
Use it as a **behaviour and look reference only**. Its file format (`<x-dc>`, `{{holes}}`,
`DCLogic`) belongs to that tool, so never copy its structure or runtime into this codebase.

## The owner

- Works on Debian 13 (KDE Plasma), this machine is called Saoirse. Uses Linux, not Windows.
- British English in all copy and comments (colour, behaviour, licence, organise).
- Never use em dashes or double hyphens as punctuation in copy, docs or commit messages.
  Use commas, full stops or line breaks.
- Explain decisions plainly and thoroughly. Say when something is a guess.
- Humour in the site copy is dry corporate satire aimed at corporations, never at visitors.

## Stack (decided)

- **Astro** (latest major) with **TypeScript**, static output (`output: 'static'`).
- The desktop shell is one client-side island using **Preact** (`@astrojs/preact`).
- No backend in v1. Nothing a visitor types ever executes on the server.
- Content lives in Markdown content collections under `src/content/`.
- Node.js **26 LTS**. Package manager: npm.

## Commands

- `npm run dev` : local dev server
- `npm run build` : production build into `dist/`
- `npm run preview` : serve the built site locally
- `npm run check` : `astro check` plus TypeScript
- `./scripts/deploy.sh` : rsync `dist/` to the VPS (see `docs/SPEC.md`, Deployment)

## Rules

1. Every project and memo must exist as a real static page with a real URL that works with
   JavaScript turned off. The desktop opens that same content in windows. Never make content
   that only exists inside the JS shell.
2. All colours come from `src/os/palette.ts` (the 256 entry palette). No hard-coded colours
   elsewhere. Gradients must be **stepped bands**, never smooth, to keep the 256 colour look.
3. Every interactive element is a real `<button>`, `<a>`, `<input>` or `<label>`. Menus and
   windows must be keyboard usable. Respect `prefers-reduced-motion` (no colour cycling,
   no CRT flicker, boot runs instantly).
4. New apps follow the app contract in `docs/SPEC.md` section 12. No app reaches into
   another app's internals.
5. Keep the filesystem Linux-flavoured (`/home/employee`, `/srv/divisions`, `/opt/board`...).
   Window titles show the path of what they display.
6. Font files and any third party assets must have their licence recorded in
   `docs/CREDITS.md`.
7. Work in small steps. After each step: build, check, and summarise what changed in plain
   English. Commit with a clear message after each working step.
8. Never touch anything on the VPS outside `/var/www/hiraeth.systems` and the
   `hiraeth.systems` nginx files. The Ghost site `hiraeth.club` shares that server and must
   not be disturbed.
