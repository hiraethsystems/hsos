---
name: deploy
description: Deploy HSOS to the live server at hiraeth.systems. Checks, builds, shows a dry run, asks the owner to confirm, uploads, then verifies the server has the new commit.
disable-model-invocation: true
---

# Deploy HSOS

Publishing is outward facing, so the owner confirms every deploy. Follow these steps in order
and stop at the first failure. Explain each result in plain English.

## Rules

- Only ever use `./scripts/deploy.sh`. Never run rsync, scp or ssh commands that write to the
  server yourself.
- The script only writes to `/var/www/hiraeth.systems`. Never touch anything else on the VPS:
  not nginx, not Ghost (`hiraeth.club`), not `websdr.hiraeth.systems` (CLAUDE.md rule 8).
- Never use sudo on the server as part of a deploy.
- If something fails, report it and stop. Do not work around a safety check.

## Steps

1. **Working tree.** Run `git status --short`. If there are uncommitted changes, tell the owner
   and ask whether to commit them first. The script refuses to deploy uncommitted work.
2. **Dry run.** Run `./scripts/deploy.sh --dry-run`. It runs `npm run check` and `npm run build`,
   then lists what would change on the server without uploading anything.
3. **Summarise and ask.** Tell the owner the commit being deployed (`git log --oneline -1`) and
   what the dry run says will change: roughly how many files are new, changed and deleted, and
   which pages. Mention deletions (lines starting `*deleting`) specifically. Then ask plainly:
   "Deploy this to hiraeth.systems?" Wait for a yes.
4. **Deploy.** Only after a clear yes, run `./scripts/deploy.sh`. It checks and builds again,
   uploads, and confirms the server reports the expected commit.
5. **Verify the public site.** If `hiraeth.systems` resolves, run
   `curl -sS https://hiraeth.systems/version.txt` and check the commit matches. If DNS or TLS
   is not set up yet, say so; the server-side check in step 4 still counts.
6. **Report.** One short paragraph: what went live, the commit, and anything odd.

## Troubleshooting

- "/var/www/hiraeth.systems does not exist": the one-off server setup is not done yet. Point
  the owner to README, "Going live". Do not create it yourself.
- "Permission denied (publickey)": the SSH key is not accepted. The host alias is `hsos-vps` in
  `~/.ssh/config`; the owner can run `! ssh-copy-id -i ~/.ssh/id_ed25519.pub hsos-vps`.
