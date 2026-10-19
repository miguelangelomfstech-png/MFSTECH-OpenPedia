# ADR 0002: Production Hosting & Deployment Strategy

- **Status**: Accepted
- **Deciders**: Senior Full-Stack Architect
- **Date**: 2026-10-19

## Context & Problem Statement

Openpedia needs a resilient, production-ready hosting strategy that minimizes operational complexity and monthly costs while supporting high read traffic, zero-downtime rolling updates, automated TLS, and high-bandwidth media distribution.

## Decision Drivers

- **Cost-to-Performance Ratio**: Media-heavy encyclopedias can suffer exorbitant bandwidth egress bills on standard cloud providers (e.g., AWS S3 $0.09/GB egress).
- **Zero-Downtime Releases**: Editing and reading must never be disrupted during code deployments or database migrations.
- **Automated SSL/TLS**: Frictionless certificates with automatic renewal.
- **Operational Simplicity**: Avoid over-engineering a full Kubernetes cluster for small-to-medium scale while providing a clean migration path.

## Considered Options

1. **Option 1: Fully Managed Serverless (Vercel + Neon DB + Upstash + Cloudflare R2 + Fly.io worker)**
   - *Pros*: Zero server management, serverless autoscaling.
   - *Cons*: Vendor fragmentation (5 different dashboards/billing), high costs under high query volume, cold starts on heavy pages.
2. **Option 2: Hybrid VPS / Dedicated Host + Cloudflare R2 CDN (Selected)**
   - *Pros*: Predictable, low fixed monthly cost ($20–$40/mo), Caddy handles reverse proxy + automatic Let's Encrypt TLS + HTTP/3, Cloudflare R2 provides $0 egress fees for all images and videos, local Postgres/Redis/Meilisearch has sub-millisecond network latency.
   - *Cons*: Single host failure domain unless paired with automated snapshots/backups or a hot standby replica.
3. **Option 3: Full Kubernetes (EKS/GKE + Ceph/EBS + Cloud Native PG)**
   - *Pros*: Multi-node redundancy, automatic pod rescheduling.
   - *Cons*: Overwhelming initial complexity, minimum baseline cost ($150+/mo just for control plane and node pools).

## Decision Outcome

Chosen **Option 2 (Hybrid VPS + Cloudflare R2 + Caddy + Docker Compose)**:

1. **Edge Tier**:
   - Cloudflare CDN caches static assets, page responses, and media renditions.
   - Media bucket on Cloudflare R2 with custom domain (`media.openpedia.org`) with **zero egress costs**.
2. **Host Ingress**:
   - Caddy 2 container listening on ports 80/443. Automatically issues and rotates Let's Encrypt certificates, terminates TLS, enforces HTTP/2 and HTTP/3 (QUIC), and performs dynamic load balancing across active web replicas.
3. **App & Worker Containers**:
   - Web container running Next.js Standalone server with memory capped at 768MB.
   - Worker container running BullMQ consumers with CPU quota (e.g. 2.0 cores) and 2GB RAM.
4. **Data Tier**:
   - PostgreSQL 16 Alpine, Redis 7 Alpine (AOF persistence), Meilisearch v1.11.
   - Nightly backup script (`deploy/backup.sh`) dumps PostgreSQL, syncs to remote storage via `rclone`, and verifies retention policies.

## Zero-Downtime Deployment Mechanism

`deploy/deploy.sh` achieves zero-downtime updates using Docker Compose scaling:
1. Pull new container images (`web`, `worker`, `tools`).
2. Run database migrations via one-off `migrate` container with PostgreSQL advisory locks (`select pg_advisory_lock(...)`).
3. Scale `web` up to `N + M` replicas without terminating existing containers.
4. Poll Docker healthchecks (`/api/health`) until all new replicas report healthy.
5. Gracefully drain and stop old containers (`docker stop -t 20`).
6. Roll the background worker container with in-flight BullMQ job draining.
