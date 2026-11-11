# HSOS

The Hiraeth Systems Operating System. The website at https://hiraeth.systems.

All feelings reserved.

---

## Getting started (for Aisling, on Saoirse)

### 1. One-off installs

- **Node.js 26 LTS**: install from the official site, https://nodejs.org/en/download
  (pick Linux, version 26). Check with `node --version`.
- **Claude Code**: install with the official script, then open a new terminal:

  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  claude --version
  ```

  Docs: https://code.claude.com/docs/en/overview

- **git** and **rsync** from Debian if not already present: `sudo apt install git rsync`

### 2. Put the starter kit into the repo

```bash
git clone git@github.com:hiraethsystems/hsos.git
cd hsos
# copy everything from the starter kit zip into this folder (including the hidden .gitignore)
chmod +x scripts/deploy.sh
git add .
git commit -m "Add HSOS spec, Claude Code instructions and deploy files"
git push
```

### 3. Start Claude Code

```bash
cd hsos
claude
```

Sign in when asked, then paste the prompt from `docs/FIRST_PROMPT.md`.

### 4. Whenever you have time

Fill in `docs/CONTENT.md` with real project descriptions and add screenshots to
`public/shots/`. Claude Code will turn them into dossiers.

---

## Going live (Phase 7, later)

Do these when the site is ready. Nothing here touches the Ghost site.

1. **DNS**: add `A` records for `hiraeth.systems` and `www.hiraeth.systems` pointing at the
   VPS's IPv4 address.
2. **Folder on the VPS**:
   ```bash
   sudo mkdir -p /var/www/hiraeth.systems
   sudo chown ubuntu:ubuntu /var/www/hiraeth.systems
   ```
3. **nginx** (done 11 November 2026): `deploy/nginx/hiraeth.systems.conf` is installed at
   `/etc/nginx/sites-available/hiraeth.systems.conf` and enabled. Plain HTTP and `www`
   redirect to `https://hiraeth.systems`. `deploy/nginx/hiraeth.systems.stage1-http.conf` is
   the HTTP only fallback, kept for rolling back (a copy sits on the server as
   `hiraeth.systems.conf.bak-stage1`, not enabled).
   To change it: copy the file up, then `sudo nginx -t && sudo systemctl reload nginx`.
4. **Certificate** (done 11 November 2026): issued by certbot, which was already on the server
   for the websdr sites. Ghost's own certificate uses acme.sh and is left alone.
   ```bash
   sudo certbot certonly --webroot -w /var/www/hiraeth.systems \
     -d hiraeth.systems -d www.hiraeth.systems --cert-name hiraeth.systems \
     --deploy-hook "systemctl reload nginx"
   ```
   `certbot.timer` renews it automatically. To check: `sudo certbot certificates`.
5. **Deploy** from Saoirse. In Claude Code, type `/deploy`: it shows what will change, asks
   you to confirm, uploads and checks. Or by hand:
   ```bash
   ./scripts/deploy.sh --dry-run   # see what would change
   ./scripts/deploy.sh             # deploy
   ```
   Both read the SSH host from `.env` (`HSOS_DEPLOY_HOST=hsos-vps`, an entry in `~/.ssh/config`).

Reminder: the VPS runs Ubuntu 22.04, whose standard support ends in May 2027. Plan an
upgrade before then.

---

## Tests

- `npm run check`: types, Astro and the colour rule.
- `npm run build && npm run test:e2e`: browser tests in headless Firefox (`tests/e2e/`). They
  drive the real site: windows, menus, keyboard, boot, reduced motion, blocked storage.

## Pinned dependencies

- `@astrojs/preact` is pinned to exactly **6.1.2**. Version 6.1.3 (published 10 November 2026)
  imports `@astrojs/internal-helpers/renderer`, which the helper version it depends on does not
  contain, so the build fails to load the config. Try upgrading again once a fixed release is out.

## Repository map

- `CLAUDE.md`: standing instructions Claude Code reads every session
- `docs/SPEC.md`: the full design and build specification (source of truth)
- `docs/FIRST_PROMPT.md`: what to paste into Claude Code first
- `docs/CONTENT.md`: project descriptions to fill in
- `docs/CREDITS.md`: licences for fonts and assets
- `docs/reference/prototype.dc.html`: the design prototype (reference only)
- `src/os/palette.ts`: the 256 colour palette, the only place colours are defined
- `src/content/`: projects, memos and pages (Markdown)
- `src/layouts/Document.astro`: the static page layout
- `src/pages/`: one file per URL (Linux style paths, for example `srv/divisions/[division]/[slug].astro`)
- `src/os/routes.ts`: every URL and filesystem path is built here
- `src/os/links.ts`: the `hsos:open/<app>` link scheme used in Markdown
- `scripts/check-colours.mjs`: fails `npm run check` if a colour is used outside the palette
- `deploy/nginx/`: server config for the VPS
- `scripts/deploy.sh`: build and upload
