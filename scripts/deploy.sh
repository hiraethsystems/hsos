#!/usr/bin/env bash
# Deploy the built site to the VPS.
# Usage:  HSOS_DEPLOY_HOST=ubuntu@your.vps.address ./scripts/deploy.sh
# Optional: HSOS_DEPLOY_PATH (default /var/www/hiraeth.systems)
set -euo pipefail

HOST="${HSOS_DEPLOY_HOST:?Set HSOS_DEPLOY_HOST, for example ubuntu@your.vps.address}"
DEST="${HSOS_DEPLOY_PATH:-/var/www/hiraeth.systems}"

cd "$(dirname "$0")/.."

echo "Building..."
npm run build

if [ ! -f dist/index.html ]; then
  echo "dist/index.html missing, refusing to deploy an empty site." >&2
  exit 1
fi

echo "Deploying dist/ to ${HOST}:${DEST}/ ..."
rsync -avz --delete --exclude '.well-known/' dist/ "${HOST}:${DEST}/"

echo "Done. The Board thanks you for your compliance."
