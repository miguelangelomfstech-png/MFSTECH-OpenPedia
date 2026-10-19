# Step-by-Step Production Deployment Guide

This guide walks you through publishing Openpedia to production from scratch on a clean Linux server (Ubuntu 22.04/24.04 LTS) using our recommended **Hybrid VPS + Cloudflare R2** setup.

---

## Prerequisites

1. A domain name (e.g., `openpedia.org` or `wiki.example.com`).
2. A Cloudflare account (for DNS, CDN, and R2 Object Storage).
3. A VPS or Dedicated Server (minimum 2 vCPU, 4GB RAM, 50GB SSD; recommended 4 vCPU, 8GB RAM).
4. GitHub repository access for GitHub Actions CI/CD.

---

## Step 1: Cloudflare & Media Storage Setup (R2)

1. Log into your Cloudflare Dashboard and navigate to **R2**.
2. Click **Create Bucket**:
   - Bucket name: `wiki-media`.
   - Location: Automatic.
3. In bucket **Settings**:
   - Click **Add Custom Domain** under *Public access*.
   - Assign a domain, e.g., `media.openpedia.org`.
   - Enable Cloudflare caching on this domain (Cache Everything rule or standard CDN caching).
4. Go to **R2 > Manage R2 API Tokens**:
   - Create an API token with **Object Read & Write** permissions targeting the `wiki-media` bucket.
   - Note down:
     - Access Key ID
     - Secret Access Key
     - S3 Endpoint URL (format: `https://<account-id>.r2.cloudflarestorage.com`)

---

## Step 2: DNS Configuration

In your DNS manager (e.g., Cloudflare DNS):

| Type | Name | Target | Proxy Status | Note |
|---|---|---|---|---|
| `A` | `wiki` (or `@`) | `<YOUR_SERVER_IP>` | DNS only (Grey Cloud) during initial ACME cert issuance, or Proxied (Orange Cloud) | Main site |
| `CNAME` | `media` | Custom R2 bucket endpoint | Proxied (Orange Cloud) | Media CDN |

> **Note on Caddy with Cloudflare Proxy**: If Cloudflare's proxy (Orange Cloud) is enabled for the main domain, ensure your Cloudflare SSL/TLS encryption mode is set to **Full (strict)**.

---

## Step 3: Server Provisioning

SSH into your server and prepare the base environment:

```bash
# 1. Update OS packages
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw fail2ban jq rclone

# 2. Configure UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Caddy ACME)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 443/udp   # HTTP/3 (QUIC)
sudo ufw --force enable

# 3. Install Docker Engine and Compose Plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## Step 4: Clone Repository & Configure Environment

Create the application directory:

```bash
sudo mkdir -p /opt/openpedia
sudo chown $USER:$USER /opt/openpedia
git clone https://github.com/<your-org>/openpedia.git /opt/openpedia
cd /opt/openpedia
```

Copy and edit the production environment file:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Generate secure 32-character random keys for secrets:

```bash
# Generate secret tokens:
openssl rand -base64 32
```

Fill in the required values in `.env.production`:
- `SITE_DOMAIN`: e.g. `wiki.openpedia.org`
- `ACME_EMAIL`: Your operational email for SSL expiry alerts.
- `AUTH_SECRET`: Random 32+ byte string.
- `POSTGRES_PASSWORD`: Strong random database password.
- `REDIS_PASSWORD`: Strong random Redis password.
- `MEILI_MASTER_KEY`: Strong random key (minimum 16 bytes).
- `S3_ENDPOINT`: Your Cloudflare R2 endpoint (`https://<accountid>.r2.cloudflarestorage.com`).
- `S3_PUBLIC_BASE_URL`: `https://media.openpedia.org`
- `S3_ACCESS_KEY_ID`: Your R2 access key.
- `S3_SECRET_ACCESS_KEY`: Your R2 secret key.
- `REGISTRY`: e.g. `ghcr.io/<your-org>`

---

## Step 5: Initial Database Setup & Migrations

Before launching web traffic, boot the backing services and execute migrations:

```bash
# Make deploy scripts executable
chmod +x deploy/*.sh

# Start backing services
docker compose -f docker-compose.prod.yml up -d postgres redis meilisearch

# Wait 10 seconds for PostgreSQL and Redis healthchecks to pass
docker compose -f docker-compose.prod.yml ps

# Build and execute database migrations
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

### (Optional) Seed Initial Content & Admin Account:
To populate the database with default categories, foundational articles, test media, and create the default bureaucrat administrator:

```bash
# Optional: set a custom admin password (default: changeme-admin)
export SEED_ADMIN_PASSWORD="YourSecureAdminPassword123!"

docker compose -f docker-compose.prod.yml --profile tools run --rm \
  -e SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  migrate pnpm --filter @wiki/db seed
```

---

## Step 6: Initial Deployment

Execute the zero-downtime deployment script:

```bash
./deploy/deploy.sh latest
```

Verify all containers are healthy:

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see:
- `caddy`: Up (ports 80, 443)
- `web`: Up (healthy)
- `worker`: Up (healthy)
- `postgres`: Up (healthy)
- `redis`: Up (healthy)
- `meilisearch`: Up

Test the public health endpoint:

```bash
curl -i https://<your-domain>/api/health
```

Expected output:
```json
HTTP/2 200
content-type: application/json

{"ok":true,"checks":{"db":true,"redis":true}}
```

---

## Step 7: Automated Nightly Backups Setup

Set up a cron job to dump PostgreSQL and mirror media nightly using `deploy/backup.sh`:

1. Configure an rclone remote for your backup destination:
   ```bash
   rclone config
   # Follow prompts to configure an S3, Backblaze B2, or Wasabi remote named "backup"
   ```
2. Add the cron job:
   ```bash
   sudo crontab -e
   ```
3. Add the line:
   ```cron
   15 3 * * * /opt/openpedia/deploy/backup.sh >> /var/log/openpedia-backup.log 2>&1
   ```

---

## Step 8: Continuous Deployment (GitHub Actions)

To enable automatic zero-downtime deploys on every push to `main`:

1. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
2. Add the following secrets:
   - `PROD_HOST`: Your server's public IP or hostname.
   - `PROD_USER`: The SSH user (e.g., `ubuntu` or `deploy`).
   - `PROD_SSH_KEY`: The private SSH key matching the server's `~/.ssh/authorized_keys`.
3. Push to `main`. The `CI & Docker Build` workflow will build and publish your images to GHCR, and the `Production Deploy` workflow will connect via SSH and execute `./deploy/deploy.sh <short-sha>`.
