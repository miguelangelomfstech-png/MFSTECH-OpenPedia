# Hosting Options & Cost Projections

This document compares the three primary deployment architectures for Openpedia: **Hybrid VPS / Dedicated Host (Recommended)**, **Fully Managed Serverless**, and **Self-Hosted Kubernetes**.

---

## 1. Architecture Comparison

| Dimension | Hybrid VPS + Cloudflare R2 (Recommended) | Fully Managed Serverless | Self-Hosted Kubernetes |
|---|---|---|---|
| **Primary Compute** | Hetzner / DigitalOcean / Linode / OVH | Vercel (Web) + Fly.io / Railway (Worker) | EKS / GKE / Self-managed K8s |
| **Database** | Postgres container or Managed DB | Neon Postgres / Supabase | CloudNativePG / Crunchy Data |
| **Cache & Queues** | Redis container | Upstash Redis | Redis Operator |
| **Search Engine** | Meilisearch container | Meilisearch Cloud / Bonsai OpenSearch | OpenSearch / Meilisearch Helm |
| **Object Storage** | Cloudflare R2 + Cloudflare CDN | Cloudflare R2 / AWS S3 | S3 / MinIO / Ceph |
| **Monthly Cost (Base)** | **$20 – $40 / mo** | $60 – $120 / mo | $150 – $300 / mo |
| **Operational Overhead** | Low (Docker Compose + Caddy) | Very Low (managed dashboards) | High (k8s manifests, ingress, helm) |
| **Zero-Downtime Deploys** | Included (`deploy/deploy.sh`) | Native on Vercel | Native via RollingUpdate pods |
| **Media Egress Cost** | **$0.00 / GB** (Cloudflare R2) | **$0.00 / GB** (Cloudflare R2) | Cloud provider egress fees ($0.08–0.12/GB) unless R2 is used |

---

## 2. Detailed Breakdown of Options

### Option A: Hybrid VPS + Cloudflare R2 (Recommended)

- **Best for**: Projects wanting maximum performance, lowest possible monthly bill, and clean architecture without cloud lock-in.
- **Components**:
  - 1× VPS (e.g., Hetzner CPX31: 4 vCPU, 8 GB RAM, 160 GB NVMe for ~€15/month).
  - Caddy 2 container: automatic Let's Encrypt TLS, HTTP/3, and dynamic load balancing across web containers.
  - Next.js Standalone web replicas (memory limited to 768MB each).
  - FFmpeg + Sharp worker (BullMQ consumer with pinned CPU/RAM limits).
  - Postgres 16 Alpine, Redis 7 Alpine, Meilisearch v1.11 running on host internal Docker bridge.
  - Cloudflare R2 for all image and video storage ($0 egress fees, standard $0.015/GB/month storage).
- **Pros**:
  - Lowest predictable cost.
  - Sub-millisecond latency between Web, Postgres, Redis, and Meilisearch.
  - Simple git-push CI/CD deployment script.
- **Cons**:
  - Single server failure domain unless paired with off-site automated backups (`deploy/backup.sh`) and an automated DNS failover or standby server.

---

### Option B: Fully Managed Serverless

- **Best for**: Teams with no server administration desire who prefer cloud console management.
- **Components**:
  - **Frontend / API**: Vercel Pro ($20/seat/month).
  - **Database**: Neon Serverless Postgres or Supabase ($19–$25/month).
  - **Cache & BullMQ**: Upstash Serverless Redis ($10–$20/month).
  - **Background Worker**: Railway or Fly.io Docker container with FFmpeg ($15–$30/month).
  - **Search**: Meilisearch Cloud ($30/month) or Algolia.
  - **Storage**: Cloudflare R2 ($5/month).
- **Pros**:
  - Managed backups, point-in-time recovery on DB, instant global edge routing.
- **Cons**:
  - Fragmented services across 5 different billing dashboards.
  - Potential connection pool exhaustion without PgBouncer.
  - Higher costs under sustained traffic.

---

### Option C: Self-Hosted Kubernetes (K8s)

- **Best for**: High-scale enterprise deployments with existing platform engineering teams.
- **Components**:
  - Managed Kubernetes cluster (AWS EKS, GCP GKE, or Hetzner Cloud K8s via k3s/kubeadm).
  - Ingress-NGINX or Traefik with cert-manager.
  - CloudNativePG operator for high-availability multi-pod PostgreSQL replication.
  - Horizontal Pod Autoscalers (HPA) for Web and Worker pods.
- **Pros**:
  - Multi-node high availability, automatic self-healing.
- **Cons**:
  - High operational complexity and base infrastructure cost.

---

## 3. Cost Estimations Across Traffic Tiers

| Cost Item | Small Wiki (~10k visits/mo) | Growing (~1M visits/mo) | High Scale (~20M visits/mo) |
|---|---|---|---|
| **Compute (VPS / App)** | $10 / mo (2 vCPU, 4GB RAM) | $35 / mo (4–8 vCPU, 16GB RAM) | $160 / mo (2× Dedicated servers) |
| **Database** | Included on host | Included on host / $25 Managed | $80 / mo (Dedicated Primary + Replica) |
| **Object Storage (R2)** | $1 / mo (< 50 GB media) | $8 / mo (~500 GB media) | $75 / mo (~5 TB media) |
| **Bandwidth / Egress** | **$0.00** (Cloudflare R2 + CDN) | **$0.00** (Cloudflare R2 + CDN) | **$0.00** (Cloudflare R2 + CDN) |
| **Domain & DNS** | $1 / mo ($12/yr) | $1 / mo ($12/yr) | $1 / mo ($12/yr) |
| **Off-site Backups** | $1 / mo (Wasabi / Backblaze) | $5 / mo (Backblaze B2) | $20 / mo (Encrypted geo-replicated) |
| **Estimated Total** | **~$13 / month** | **~$49 / month** | **~$336 / month** |
