#!/usr/bin/env bash
# ==============================================================================
# MFSTECH-OpenPedia - Oracle Cloud "Always Free" Automated Setup Script
# Works on Ubuntu 22.04 / 24.04 LTS (ARM Ampere 24GB or AMD x86)
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo "   MFSTECH-OpenPedia — Oracle Cloud Production Deployment        "
echo "================================================================="

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor execute como root ou com sudo: sudo ./deploy/oracle-setup.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# 2. Update System and Install Core Packages
echo "[+] 1/6 A atualizar o sistema e a instalar dependências..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  git \
  jq \
  openssl \
  ufw \
  iptables-persistent \
  netfilter-persistent

# 3. Install Docker Engine & Compose plugin (official Docker repo)
echo "[+] 2/6 A instalar a versão mais recente do Docker Engine..."
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
fi

# 4. Open Oracle Cloud Firewall (UFW & iptables)
echo "[+] 3/6 A configurar as portas da firewall (80 HTTP, 443 HTTPS, 22 SSH)..."
# Oracle Cloud Ubuntu images have strict iptables rules by default in the INPUT chain.
# We insert ACCEPT rules at the top of the INPUT chain to prevent traffic drop.
iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT || true
netfilter-persistent save || true

# UFW setup
ufw allow 22/tcp comment 'SSH' || true
ufw allow 80/tcp comment 'HTTP' || true
ufw allow 443/tcp comment 'HTTPS' || true
ufw allow 443/udp comment 'HTTP3-QUIC' || true
ufw --force enable || true

# 5. Environment configuration (.env.production)
echo "[+] 4/6 A configurar variáveis de ambiente de produção (.env.production)..."

PUBLIC_IP=$(curl -s -4 https://ifconfig.me || curl -s -4 https://api.ipify.org || echo "localhost")

if [ ! -f .env.production ]; then
  echo ""
  echo "-----------------------------------------------------------------"
  echo "Configuração de Domínio:"
  echo "Se tem um domínio (ex: wiki.oseudominio.com), escreva-o agora."
  echo "Se ainda NÃO tem domínio, carregue em ENTER para usar o IP: ${PUBLIC_IP}"
  echo "-----------------------------------------------------------------"
  read -r -p "Domínio [${PUBLIC_IP}]: " INPUT_DOMAIN
  SITE_DOMAIN="${INPUT_DOMAIN:-$PUBLIC_IP}"

  read -r -p "Email para certificado SSL (ex: admin@exemplo.com): " INPUT_EMAIL
  ACME_EMAIL="${INPUT_EMAIL:-admin@${SITE_DOMAIN}}"

  # Generate cryptographically secure keys
  GEN_AUTH_SECRET=$(openssl rand -hex 32)
  GEN_MEILI_KEY=$(openssl rand -hex 32)
  GEN_REDIS_PASS=$(openssl rand -hex 32)
  GEN_POSTGRES_PASS=$(openssl rand -hex 32)

  # Check if domain is an IP address
  if [[ "$SITE_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [ "$SITE_DOMAIN" = "localhost" ]; then
    SITE_URL="http://${SITE_DOMAIN}"
  else
    SITE_URL="https://${SITE_DOMAIN}"
  fi

  cat > .env.production <<EOF
# ==============================================================================
# MFSTECH-OpenPedia - Production Environment Configuration
# ==============================================================================
NODE_ENV=production
SITE_NAME=MFSTECH-OpenPedia
SITE_URL=${SITE_URL}
SITE_DOMAIN=${SITE_DOMAIN}
ACME_EMAIL=${ACME_EMAIL}

# Authentication
AUTH_SECRET=${GEN_AUTH_SECRET}

# Database (PostgreSQL 16)
POSTGRES_USER=wiki
POSTGRES_PASSWORD=${GEN_POSTGRES_PASS}
POSTGRES_DB=wiki
DATABASE_URL=postgres://wiki:${GEN_POSTGRES_PASS}@postgres:5432/wiki

# Cache & Queues (Redis 7)
REDIS_PASSWORD=${GEN_REDIS_PASS}
REDIS_URL=redis://:${GEN_REDIS_PASS}@redis:6379

# Search Engine (Meilisearch v1.11)
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=${GEN_MEILI_KEY}

# Media Storage (Default to local MinIO or configure Cloudflare R2)
S3_ENDPOINT=http://localhost:9000
S3_PRESIGN_ENDPOINT=
S3_REGION=auto
S3_BUCKET=wiki-media
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=${SITE_URL}/wiki-media
EOF

  echo "[+] Ficheiro .env.production gerado com chaves criptográficas seguras!"
else
  echo "[i] Ficheiro .env.production já existente encontrado. A reutilizar configurações."
fi

# 6. Build and Start Production Containers
echo "[+] 5/6 A compilar imagens Docker e a iniciar a infraestrutura..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d postgres redis meilisearch

echo "[+] A aguardar que o PostgreSQL e o Redis fiquem saudáveis..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml ps postgres | grep -q "(healthy)"; then
    break
  fi
  sleep 2
done

echo "[+] 6/6 A executar migrações e seed da base de dados..."
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate

# Start Web and Worker
docker compose -f docker-compose.prod.yml up -d web worker caddy

echo ""
echo "================================================================="
echo "   🎉 MFSTECH-OpenPedia INSTALADO E PUBLICADO COM SUCESSO!       "
echo "================================================================="
echo " A sua aplicação está acessível em:"
echo " 👉 ${SITE_URL}"
echo ""
echo " Para ver os logs em tempo real:"
echo "   docker compose -f docker-compose.prod.yml logs -f web"
echo "================================================================="
