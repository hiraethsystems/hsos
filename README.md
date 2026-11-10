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
3. **nginx**: copy `deploy/nginx/hiraeth.systems.conf` to `/etc/nginx/sites-available/`,
   symlink it into `/etc/nginx/sites-enabled/`, keep only the port 80 block active, then
   `sudo nginx -t && sudo systemctl reload nginx`.
4. **Certificate**: first check how Ghost's certificates are managed:
   ```bash
   sudo ls /etc/letsencrypt
   sudo crontab -l
   ```
   If you see `acme.sh` there (Ghost's usual setup), issue one for HSOS with the same tool,
   as root:
   ```bash
   /etc/letsencrypt/acme.sh --home /etc/letsencrypt --issue \
     -d hiraeth.systems -d www.hiraeth.systems \
     --webroot /var/www/hiraeth.systems --reloadcmd "nginx -s reload"
   ```
   Then fill in the certificate paths in the 443 block, uncomment it, test and reload nginx.
   (If acme.sh isn't there, ask Claude Code to set up certbot instead.)
5. **Deploy** from Saoirse:
   ```bash
   HSOS_DEPLOY_HOST=ubuntu@<vps address> ./scripts/deploy.sh
   ```

Reminder: the VPS runs Ubuntu 22.04, whose standard support ends in May 2027. Plan an
upgrade before then.

---

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
- `scripts/check-colours.mjs`: fails `npm run check` if a colour is used outside the palette
- `deploy/nginx/`: server config for the VPS
- `scripts/deploy.sh`: build and upload
