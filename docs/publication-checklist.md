# Go-Live Publication Checklist

Use this pre-flight checklist before routing public user traffic to Openpedia.

---

## 1. Domain, DNS & SSL

- [ ] **DNS Records**: A/AAAA records point to server IP with low TTL (300s) during migration.
- [ ] **Custom Media Domain**: `media.<your-domain>` points to Cloudflare R2 bucket with SSL active.
- [ ] **Caddy SSL**: `https://<your-domain>` responds with valid Let's Encrypt certificate without browser warnings.
- [ ] **HTTP to HTTPS Redirection**: Visiting `http://<your-domain>` automatically upgrades to `https://`.
- [ ] **WWW Redirection**: Visiting `www.<your-domain>` redirects cleanly to root or vice-versa.

---

## 2. Secrets & Environment Configuration

- [ ] `.env.production` is present and permissions are restricted (`chmod 600 .env.production`).
- [ ] `AUTH_SECRET` is generated with `openssl rand -base64 32` (not the default placeholder).
- [ ] `POSTGRES_PASSWORD` is unique and strong.
- [ ] `REDIS_PASSWORD` is set and matches in both Redis command and `REDIS_URL`.
- [ ] `MEILI_MASTER_KEY` is set with a minimum of 16 random characters.
- [ ] `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are tested with valid read/write permissions.
- [ ] `S3_PUBLIC_BASE_URL` matches the public media CDN URL with no trailing slash.

---

## 3. Database, Migrations & Content

- [ ] Migrations applied successfully (`docker compose --profile tools run --rm migrate`).
- [ ] Admin user seeded or created with a secure password.
- [ ] Base categories seeded (`Science`, `Astronomy`, `Geography`, `Computing`).
- [ ] Test article created with formatting, wikilinks, and references.
- [ ] Test image uploaded and verified (thumbnails and renditions viewable).
- [ ] Test video uploaded and transcoded to `360p`, `720p`, and `1080p`.

---

## 4. Search & Caching

- [ ] Meilisearch indexes created (`articles` and `media`).
- [ ] Full re-index run completed (`pnpm --filter @wiki/worker reindex`).
- [ ] Autocomplete dropdown returns search hits in under 100ms.
- [ ] Typo tolerance tested (e.g. searching "solr systm" finds "Solar System").

---

## 5. Security & Rate Limiting

- [ ] Host firewall (UFW) active; only ports 22, 80, 443 are open.
- [ ] Fail2ban active on SSH.
- [ ] CSP headers verified in response headers (`curl -I https://<your-domain>`).
- [ ] Rate limiting tested: sending rapid requests to `/api/suggest` triggers HTTP 429 when threshold exceeded.
- [ ] Anti-vandalism filter tested: mass blanking is blocked.

---

## 6. Backups & Monitoring

- [ ] External uptime monitor (e.g., Uptime Kuma, Better Stack) pinging `/api/health` every 60s.
- [ ] Backup script (`deploy/backup.sh`) executed manually and verified.
- [ ] Backup archive verified in remote bucket (`rclone ls backup:<bucket>/db/`).
- [ ] Disaster recovery drill performed once using `deploy/restore.sh` on a test copy.
- [ ] Nightly backup cron job installed and active in root crontab.
