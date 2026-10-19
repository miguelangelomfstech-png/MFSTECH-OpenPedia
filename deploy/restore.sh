#!/usr/bin/env bash
# Restore a pg_dump custom-format file into the running postgres container.
#   ./deploy/restore.sh backups/db-20260101T031500Z.dump
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.production; set +a
FILE="${1:?usage: restore.sh <dump-file>}"
read -r -p "This REPLACES database '${POSTGRES_DB:-wiki}'. Type 'restore' to continue: " ok
[ "$ok" = restore ] || exit 1
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U "${POSTGRES_USER:-wiki}" -d "${POSTGRES_DB:-wiki}" --clean --if-exists --no-owner < "$FILE"
echo "Restored. Rebuild search: docker compose -f docker-compose.prod.yml exec worker pnpm reindex"
