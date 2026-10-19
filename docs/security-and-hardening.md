# Security Hardening & Abuse Prevention

This document details the security architecture, hardening procedures, and anti-vandalism controls built into Openpedia.

---

## 1. Perimeter & Transport Security

### Firewall Configuration (UFW)
Only the minimal required ports are exposed:
- `22/tcp`: SSH (Restricted to public key authentication; root password login disabled).
- `80/tcp`: HTTP (Redirected automatically to HTTPS by Caddy).
- `443/tcp`: HTTPS (TLS 1.2 and TLS 1.3).
- `443/udp`: HTTP/3 (QUIC transport protocol).

All internal services (`postgres:5432`, `redis:6379`, `meilisearch:7700`, `worker:3001`, `web:3000`) communicate strictly over Docker internal bridge networks and are never bound to the public host interface.

### Fail2ban
Configured to prevent SSH brute force:
```ini
[sshd]
enabled = true
port = 22
maxretry = 3
findtime = 600
bantime = 86400
```

---

## 2. Web Application Security Headers & CSP

Implemented in `apps/web/next.config.ts` across all HTTP responses:

- **Content-Security-Policy (CSP)**:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (evaluated scripts strictly forbidden in production)
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data: blob: <S3_PUBLIC_BASE_URL>`
  - `media-src 'self' blob: <S3_PUBLIC_BASE_URL>`
  - `connect-src 'self' <S3_ENDPOINT> <S3_PRESIGN_ENDPOINT>`
  - `frame-ancestors 'none'` (Prevents clickjacking)
- **Strict-Transport-Security (HSTS)**: `max-age=63072000; includeSubDomains; preload`
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()`

---

## 3. Rich Text & Markdown Sanitization

All user-submitted content is rendered through a hardened `unified` pipeline (`apps/web/src/lib/render.ts`):
1. **Parser**: `remark-parse` + `remark-gfm` + custom `remarkWiki` AST transformation.
2. **Rehype Pipeline**: `remark-rehype` -> `rehype-raw` -> `rehype-sanitize`.
3. **Strict Whitelist**:
   - `rehype-sanitize` strips all `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, and `on*` event handlers.
   - External links automatically receive `rel="nofollow ugc noopener noreferrer"` via AST visitation.
   - Only approved CSS classes (`redlink`, `external`, `wiki-figure`, footnote refs) are preserved.

---

## 4. Anti-Vandalism & Abuse Prevention

### Role Hierarchy & Permissions
- **Anonymous**: Can read all pages; can edit non-protected articles (IP hash recorded).
- **Registered**: Can upload files, watch pages, receive notifications.
- **Autoconfirmed**: Accounts older than 4 days with at least 10 edits. Can edit semi-protected pages and bypass automated spam heuristics.
- **Admin**: Can protect articles (`none`, `semi`, `full`), toggle featured status, and temporarily or permanently block vandal accounts.
- **Bureaucrat**: Full administrative rights and role promotion.

### Automated Heuristics Filter
Before an edit is committed in `packages/db/src/articles.ts`, unconfirmed editors are evaluated:
1. **Mass Blanking Detection**: If an article > 500 bytes is reduced in size by > 90%, the edit is blocked instantly.
2. **Link Spam Filter**: Edits adding more than 8 external URLs from non-autoconfirmed users are rejected.
3. **Hash-Based Anonymous Tracking**: Anonymous edits do not store raw IP addresses in the database. Instead, an HMAC-SHA256 hash (`sha256(AUTH_SECRET + IP)`) is stored. This protects contributor privacy while still enabling administrators to block problematic IP ranges.

### Multi-Tier Rate Limiting
Backed by atomic Redis sliding/fixed-window counters (`packages/shared/src/ratelimit.ts`):

| Action | Limit | Window | Scope |
|---|---|---|---|
| **Anonymous Edit** | 6 edits | 60 seconds | IP Address |
| **Logged-In Edit** | 20 edits | 60 seconds | User ID |
| **File Upload** | 10 uploads | 10 minutes | User ID |
| **Account Creation** | 5 registrations | 1 hour | IP Address |
| **Authentication** | 10 attempts | 5 minutes | Email Address |
| **Public API** | 120 requests | 60 seconds | IP Address |

---

## 5. Storage & Presigned Upload Protection

- Storage credentials are never shared with client browsers.
- Browser uploads use pre-signed Amazon S3 / Cloudflare R2 URLs with a strict **15-minute expiration window**.
- Server validates file dimensions, MIME type magic numbers, and maximum size limits before issuing presigned URLs.
- Step 2 completion endpoint (`/api/media/complete`) performs an `S3 HeadObject` check to verify that the byte size matches the original manifest before queuing the transcode job.

---

## 6. Container Runtime Hardening

- The web container runs as a non-privileged system user (`useradd -r -u 1001 app`), never as root.
- Memory and CPU limits are enforced in `docker-compose.prod.yml` to prevent denial-of-service via worker resource exhaustion:
  - `web`: 768MB limit.
  - `worker`: 2.0 CPU cores, 2GB RAM limit.
