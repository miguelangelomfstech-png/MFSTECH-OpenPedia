#!/usr/bin/env bash
# Zero-downtime deploy on a single Docker host.
#   ./deploy/deploy.sh <image-tag>
# Steps: pull -> migrate (backward-compatible, expand/contract) -> start new web replicas
#        -> wait healthy -> drain + remove old replicas -> roll worker.
set -euo pipefail

TAG="${1:?usage: deploy.sh <image-tag>}"
export TAG
COMPOSE="docker compose -f docker-compose.prod.yml"
REPLICAS="${WEB_REPLICAS:-2}"

cd "$(dirname "$0")/.."

echo "==> Pulling images ($TAG)"
$COMPOSE pull web worker migrate

echo "==> Starting data services"
$COMPOSE up -d postgres redis meilisearch

echo "==> Running migrations"
$COMPOSE --profile tools run --rm migrate

OLD=$($COMPOSE ps -q web || true)

echo "==> Starting new web replicas"
$COMPOSE up -d --no-deps --no-recreate --scale web=$((REPLICAS + $(echo "$OLD" | grep -c . || true))) web
NEW=$($COMPOSE ps -q web | grep -vxF -f <(echo "$OLD") || true)

if [ -z "$NEW" ] && [ -n "$OLD" ]; then
  # Nothing new was created (same tag redeploy): fall back to a rolling restart.
  for c in $OLD; do docker restart "$c"; sleep 15; done
else
  echo "==> Waiting for new replicas to become healthy"
  for c in $NEW; do
    for i in $(seq 1 60); do
      s=$(docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null || echo starting)
      [ "$s" = healthy ] && break
      [ "$i" = 60 ] && { echo "replica $c failed to become healthy"; docker logs --tail 50 "$c"; docker rm -f $NEW; exit 1; }
      sleep 2
    done
  done
  if [ -n "$OLD" ]; then
    echo "==> Draining old replicas"
    docker stop --time 20 $OLD
    docker rm $OLD
  fi
fi

echo "==> Rolling worker (graceful, finishes in-flight jobs)"
$COMPOSE up -d --no-deps worker
$COMPOSE up -d --no-deps caddy

docker image prune -f >/dev/null
echo "==> Deployed $TAG"
