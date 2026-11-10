#!/usr/bin/env bash
# Deploy the built site to the VPS.
#
#   ./scripts/deploy.sh            check, build, upload
#   ./scripts/deploy.sh --dry-run  check and build, then list what would change on the server
#
# The SSH host comes from HSOS_DEPLOY_HOST, set in the environment or in the untracked .env
# file (for example HSOS_DEPLOY_HOST=hsos-vps, an entry in ~/.ssh/config).
#
# Safety rules (CLAUDE.md rule 8): this script only ever writes to /var/www/hiraeth.systems.
# It never creates folders, never uses sudo, and never touches nginx, Ghost or anything else.
set -euo pipefail

cd "$(dirname "$0")/.."

DEST="/var/www/hiraeth.systems"
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run | -n) DRY_RUN=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

# Settings from .env, if present. Only HSOS_ variables are read.
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    case "$key" in HSOS_*) export "$key=$value" ;; esac
  done < <(grep -E '^HSOS_[A-Z_]+=' .env)
fi
HOST="${HSOS_DEPLOY_HOST:?Set HSOS_DEPLOY_HOST in .env, for example HSOS_DEPLOY_HOST=hsos-vps}"

# The live site must always match a commit, so refuse uncommitted changes.
if [ -n "$(git status --porcelain)" ] && [ "${HSOS_ALLOW_DIRTY:-0}" != "1" ]; then
  echo "Uncommitted changes. Commit first, so the live site matches a commit." >&2
  git status --short >&2
  exit 1
fi
COMMIT="$(git rev-parse --short HEAD)"

echo "Checking..."
npm run --silent check

echo "Building..."
npm run --silent build
if [ ! -f dist/index.html ]; then
  echo "dist/index.html missing, refusing to deploy an empty site." >&2
  exit 1
fi
printf 'HSOS 256\ncommit %s\nbuilt %s\n' "$COMMIT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/version.txt

echo "Connecting to ${HOST}..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "test -d '$DEST' && test -w '$DEST'"; then
  echo "${DEST} does not exist on the server or is not writable by this user." >&2
  echo "It is created once during server setup (README, Going live, step 2). Not deploying." >&2
  exit 1
fi

RSYNC=(rsync -rlptz --delete --chmod=D755,F644 --exclude '.well-known/' -e "ssh -o BatchMode=yes")

if [ "$DRY_RUN" = "1" ]; then
  echo "Dry run. These changes WOULD be made in ${HOST}:${DEST}/ (nothing is uploaded):"
  "${RSYNC[@]}" --dry-run --itemize-changes dist/ "${HOST}:${DEST}/"
  echo "Dry run complete. Commit ${COMMIT}."
  exit 0
fi

echo "Deploying commit ${COMMIT} to ${HOST}:${DEST}/ ..."
"${RSYNC[@]}" --stats dist/ "${HOST}:${DEST}/" | grep -E '^(Number of (regular )?files transferred|Number of deleted files|Total transferred file size)'

LIVE="$(ssh -o BatchMode=yes "$HOST" "sed -n 2p '$DEST/version.txt'")"
if [ "$LIVE" != "commit ${COMMIT}" ]; then
  echo "Upload finished but the server reports '${LIVE}', expected 'commit ${COMMIT}'." >&2
  exit 1
fi
echo "Server now has commit ${COMMIT}. The Board thanks you for your compliance."
