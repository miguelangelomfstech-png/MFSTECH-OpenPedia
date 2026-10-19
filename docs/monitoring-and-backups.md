# Monitoring, Logging & Disaster Recovery

This document outlines the observability, metrics collection, and disaster recovery strategy for Openpedia.

---

## 1. Health Probes & Uptime Monitoring

Openpedia exposes two lightweight healthcheck endpoints designed for container orchestrators, Caddy load balancers, and external uptime monitors (Uptime Kuma, Better Stack, Pingdom):

### Web Health Endpoint
- **URL**: `https://<your-domain>/api/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "ok": true,
    "checks": {
      "db": true,
      "redis": true
    }
  }
  ```
- **Status Codes**:
  - `200 OK`: All backing services responsive.
  - `503 Service Unavailable`: PostgreSQL connection dropped or Redis unreachable.

### Worker Health Endpoint
- **Port**: `3001` (Internal container network)
- **Response**: `200 OK` (Simple ping responding while BullMQ event loop is unblocked).

---

## 2. Container Logging Strategy

All production containers log directly to `stdout`/`stderr`. In `docker-compose.prod.yml`, the `json-file` log driver is configured with rotation limits to prevent disk exhaustion:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

### Inspecting Production Logs:
```bash
# View aggregated live logs across the stack
docker compose -f docker-compose.prod.yml logs -f --tail 100

# Inspect worker media transcoding logs
docker compose -f docker-compose.prod.yml logs -f worker

# Inspect web access and errors
docker compose -f docker-compose.prod.yml logs -f web
```

---

## 3. Metrics & Monitoring Recommendations

For production environments, we recommend pairing the stack with a lightweight Prometheus + Grafana agent or Grafana Cloud:

1. **Host Metrics**: Install `node_exporter` or Grafana Alloy to monitor CPU, RAM, disk I/O, and network bandwidth.
2. **Postgres Metrics**: Use `postgres_exporter` to monitor active connections, transaction throughput, and slow queries.
3. **Queue Health (BullMQ)**: Monitor BullMQ queue depth in Redis:
   ```bash
   docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD \
     LLEN bull:media-processing:wait
   ```
4. **Alerting Rules**:
   - Web container restart rate > 2 in 10 minutes.
   - Host free disk space < 15%.
   - Database connection pool utilization > 80%.
   - Queue wait length > 50 jobs for longer than 15 minutes.

---

## 4. Automated Backup Procedure (`deploy/backup.sh`)

PostgreSQL data and Cloudflare R2 media are backed up using `deploy/backup.sh`:

1. **Database Dump**: Runs `pg_dump` with custom binary format and maximum gzip compression (`-Fc -Z9`).
2. **Encrypted Off-site Sync**: Transmits the dump file to an independent off-site bucket (Backblaze B2, AWS S3, or Wasabi) using `rclone`.
3. **Media Sync**: Uses `rclone copy` with `--ignore-existing` to perform fast, additive mirroring of all uploaded images and video files.
4. **Retention**: Automatically deletes database dumps older than 14 days.

```bash
# Manual test of the backup workflow:
./deploy/backup.sh
```

---

## 5. Disaster Recovery & Restoration (`deploy/restore.sh`)

In the event of database corruption, accidental table dropping, or hardware migration:

1. Ensure target Docker containers are running:
   ```bash
   docker compose -f docker-compose.prod.yml up -d postgres redis meilisearch
   ```
2. Execute the restore script with the chosen dump file:
   ```bash
   ./deploy/restore.sh backups/db-20260101T031500Z.dump
   ```
3. Rebuild the Meilisearch search index from the restored PostgreSQL database:
   ```bash
   docker compose -f docker-compose.prod.yml exec worker pnpm reindex
   ```
4. Restart web containers to ensure all connection pools refresh cleanly:
   ```bash
   docker compose -f docker-compose.prod.yml restart web
   ```
