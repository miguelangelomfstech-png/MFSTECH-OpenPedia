#!/usr/bin/env bash
# Nightly backup: Postgres dump + (optional) media mirror, shipped to an S3-compatible bucket with rclone.
# Cron:  15 3 * * *  cd /opt/openpedia && ./deploy/backup.sh >> /var/log/openpedia-backup.log 2>&1
# Requires: rclone remote named "backup" (rclone config) and .env.production.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.production; set +a

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DEST="${BACKUP_REMOTE:-backup}:${BACKUP_BUCKET:?set BACKUP_BUCKET}"
mkdir -p backups

echo "==> pg_dump"
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-wiki}" -d "${POSTGRES_DB:-wiki}" --format=custom --compress=9 \
  > "backups/db-$STAMP.dump"

rclone copy "backups/db-$STAMP.dump" "$DEST/db/" --s3-no-check-bucket

echo "==> media mirror (server-side copy, additive only)"
rclone copy "${MEDIA_REMOTE:-media}:${S3_BUCKET}" "$DEST/media/" --s3-no-check-bucket --ignore-existing --transfers 8 || true

echo "==> retention (keep 14 days of dumps)"
rclone delete "$DEST/db/" --min-age 14d || true
find backups -name 'db-*.dump' -mtime +3 -delete

echo "==> done $STAMP"
# NOTE: Meilisearch is derived data. Rebuild with: docker compose exec worker pnpm reindex
