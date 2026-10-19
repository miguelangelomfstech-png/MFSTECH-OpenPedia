# Openpedia

> A modern, high-performance collaborative encyclopedia platform inspired by Wikipedia — built from scratch with Next.js 15, TypeScript, PostgreSQL, Drizzle ORM, Meilisearch, Redis, BullMQ, and an automated FFmpeg multi-resolution video transcoding pipeline.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             Cloudflare CDN & Edge            │
                      └───────┬──────────────────────────────┬───────┘
                              │                              │
                    HTTPS / HTTP/3 Requests            Media Reads (0$ Egress)
                              │                              │
                              ▼                              ▼
                 ┌───────────────────────────┐  ┌────────────────────────────┐
                 │     Caddy 2 Web Server    │  │     Cloudflare R2 Bucket   │
                 │   (Auto Let's Encrypt)    │  │        (wiki-media)        │
                 └─────────────┬─────────────┘  └──────────────▲─────────────┘
                               │                               │
                      Dynamic Reverse Proxy                    │ Presigned PUTs /
                               │                               │ Derived Renditions
                               ▼                               │
┌────────────────────────────────────────────────────────────┐ │
│                     Application Host                       │ │
│                                                            │ │
│   ┌────────────────────────────────────────────────────┐   │ │
│   │         Next.js 15 App Router (Web Pods)           │───┼─┘
│   │  - Server Actions, Markdown Renderer, Diff Viewer  │   │
│   │  - REST API (/api/v1/*), GraphQL (/api/graphql)    │   │
│   │  - Auth.js v5 (OAuth + Passwords)                  │   │
│   └──────────┬─────────────────┬───────────────────────┘   │
│              │                 │                           │
│              ▼                 ▼                           │
│       ┌─────────────┐   ┌─────────────┐                    │
│       │ PostgreSQL  │   │    Redis    │                    │
│       │  (Drizzle)  │   │  (BullMQ)   │                    │
│       └─────────────┘   └──────┬──────┘                    │
│                                │                           │
│                                ▼                           │
│       ┌────────────────────────────────────────────────┐   │
│       │          Background Worker (BullMQ)            │───┘
│       │  - FFmpeg Video Transcoding (360p/720p/1080p)  │
│       │  - Sharp Image Processing (400w/800w/1600w)    │
│       │  - Meilisearch Search Indexer                  │
│       └────────────────────────┬───────────────────────┘
│                                │
│                                ▼
│                       ┌─────────────────┐
│                       │   Meilisearch   │
│                       │ (Autocomplete)  │
│                       └─────────────────┘
└────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Content & Revision Engine
- **Rich Markdown + Sanitized HTML**: Powered by a custom `remark` + `rehype` AST pipeline with strict tag whitelisting (XSS-safe).
- **Wikilinks & Automatic Redlinks**: Inter-page linking via `[[Article Title]]` with automatic detection of missing pages (displayed as red links prompting creation).
- **Full Revision History & Diff Viewer**: Line-by-line colored diff comparisons between any two revisions.
- **One-Click Revert**: Registered users can restore previous revisions with automated revert attribution.
- **Hierarchical Categories**: Automated subcategory resolution and page grouping via `[[Category:Name]]`.
- **Talk & Discussion Pages**: Dedicated discussion namespaces (`/wiki/:slug/talk`) for editorial consensus.
- **Article Protection**: Administrative protection levels (`none`, `semi` for autoconfirmed users, `full` for admins).
- **Table of Contents**: Dynamically generated from headings (`h2` through `h4`) with smooth scrolling anchors.

### 2. Media Upload & FFmpeg Video Pipeline
- **Direct-to-Storage Streaming**: Client browsers upload directly to S3 / Cloudflare R2 using temporary presigned URLs, bypassing web server bandwidth bottlenecks.
- **Automated Video Transcoding**:
  - `360p`, `720p`, and `1080p` H.264 MP4 with web-optimized `+faststart` moov atom placement.
  - AAC stereo audio encoding.
  - Poster frame extraction at 10% duration.
  - Responsive WebP video thumbnails (`400w`).
- **Image Optimization**:
  - WebP conversion with multiple responsive densities (`400w`, `800w`, `1600w`).
  - Supports JPEG, PNG, WebP, GIF, and sanitized SVG.
- **Custom HTML5 Video Player**: Preserves playback timestamp when switching resolution qualities dynamically.
- **Article Media Embedding**: Simple markup syntax `[[File:Filename.mp4|Caption|alt=Description]]`.

### 3. Search Engine
- **Typo-Tolerant Full-Text Search**: Sub-50ms query latency powered by Meilisearch.
- **Search-As-You-Type Autocomplete**: Keyboard-navigable dropdown with highlight snippets and debounce protection.
- **Media Search**: Search for images, illustrations, and videos by filename or description.

### 4. User System & Anti-Vandalism
- **Authentication**: Email/password authentication and OAuth (GitHub, Google) via Auth.js v5.
- **Role Progression**: Anonymous $\to$ Registered $\to$ Autoconfirmed ($>4$ days old + $\ge 10$ edits) $\to$ Admin $\to$ Bureaucrat.
- **Privacy-Preserving IP Tracking**: Anonymous edits store a salted SHA-256 HMAC of the IP address, allowing moderation blocks without publishing personal IP data.
- **Automated Abuse Filters**: Rejects mass blanking (>90% reduction of content) and link-spam heuristics from non-autoconfirmed users.
- **Rate Limiting**: Multi-tiered Redis rate limiting across edits, uploads, logins, and API queries.

### 5. Developer APIs & SEO
- **REST API**:
  - `GET /api/v1/articles`: Paginated list of recent articles.
  - `GET /api/v1/articles/:slug?format=html|markdown`: Complete article metadata, AST-rendered HTML, table of contents, and raw Markdown.
- **GraphQL API**: Interactive endpoint at `/api/graphql` powered by GraphQL Yoga.
- **SEO & Accessibility**: Fully compliant WCAG 2.1 AA markup, Schema.org `Article` JSON-LD, automated `sitemap.xml`, and `robots.txt`.

---

## Monorepo Structure

```
├── apps/
│   ├── web/                    # Next.js 15 App Router application
│   │   ├── src/app/            # Routes, layouts, server actions & APIs
│   │   ├── src/components/     # UI components (Editor, VideoPlayer, Header, Search)
│   │   └── src/lib/            # Markdown renderer, viewer model, i18n
│   └── worker/                 # Background Node.js processing daemon
│       └── src/                # FFmpeg transcoder, Sharp image resizer, Meili indexer
├── packages/
│   ├── db/                     # Drizzle ORM schema, relations, migrations & seed
│   └── shared/                 # Storage (S3), Queues (BullMQ), Search & Rate Limiter
├── deploy/                     # Production infrastructure scripts & configurations
│   ├── Caddyfile               # Caddy reverse proxy with automatic SSL & load balancer
│   ├── deploy.sh               # Zero-downtime rolling deployment script
│   ├── backup.sh               # Automated database dump + R2 media sync
│   └── restore.sh              # Disaster recovery database restoration
├── docs/                       # Architecture Decision Records & operational manuals
│   ├── adr/                    # ADRs (Media, Hosting, Search, Architecture)
│   ├── hosting-options.md      # Detailed cost & architecture comparison
│   ├── production-deployment-guide.md # Step-by-step production publication guide
│   ├── security-and-hardening.md      # Security & anti-vandalism documentation
│   ├── monitoring-and-backups.md      # Health checks & disaster recovery
│   └── publication-checklist.md       # Pre-flight go-live checklist
├── docker-compose.yml          # Local development backing services
├── docker-compose.prod.yml     # Full production stack compose
└── Dockerfile                  # Multi-stage container build (web, worker, tools)
```

---

## Quickstart: Local Development

### 1. Prerequisites
- [Node.js](https://nodejs.org/) >= 22.9
- [pnpm](https://pnpm.io/) >= 9.15
- [Docker & Docker Compose](https://www.docker.com/)
- [FFmpeg](https://ffmpeg.org/) (optional on host if running via Docker; required for local video transcoding without Docker)

### 2. Clone & Install
```bash
git clone https://github.com/<your-org>/openpedia.git
cd openpedia
pnpm install
```

### 3. Start Backing Infrastructure (Docker)
Start PostgreSQL, Redis, Meilisearch, and MinIO:
```bash
pnpm infra:up
```
MinIO console is accessible at `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin`).

### 4. Initialize Database & Seed Content
Copy local environment variables and run database migrations and the seed script:
```bash
cp .env.example .env

# Run migrations
pnpm db:migrate

# Seed demo articles, images, and videos
pnpm db:seed
```
*Default admin credentials: `admin@example.com` / `changeme-admin`.*

### 5. Start Development Servers
Run the web application and background worker concurrently:
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Testing & Quality Assurance

```bash
# Run typechecking across all packages
pnpm typecheck

# Run Vitest unit tests
pnpm test
```

---

## Running Full Stack in Docker (Simulating Production)

To run the complete stack including the web application and worker with containerized FFmpeg:

```bash
docker compose --profile app up --build
```
The application will be available at `http://localhost:3000`.

---

## Production Deployment

Detailed step-by-step instructions for deploying to a VPS (e.g., Hetzner, DigitalOcean) with Cloudflare R2 are available in:
- **[Step-by-Step Production Deployment Guide](docs/production-deployment-guide.md)**
- **[Hosting Options & Cost Comparison](docs/hosting-options.md)**
- **[Security Hardening & Abuse Prevention](docs/security-and-hardening.md)**
- **[Monitoring, Logging & Backups](docs/monitoring-and-backups.md)**
- **[Go-Live Publication Checklist](docs/publication-checklist.md)**

### Quick Production Deployment Summary:

1. Setup server with Ubuntu 22.04/24.04 and install Docker.
2. Clone repository to `/opt/openpedia`.
3. Configure `.env.production` (see `.env.production.example`).
4. Run migrations:
   ```bash
   docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
   ```
5. Deploy with zero downtime:
   ```bash
   ./deploy/deploy.sh latest
   ```

---

## License

Code is licensed under the [MIT License](LICENSE). Encyclopedic content is licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
