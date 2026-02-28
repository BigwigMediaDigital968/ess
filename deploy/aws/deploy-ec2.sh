#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  deploy/aws/deploy-ec2.sh — Deploy ESS-BSL on AWS EC2
#  Tested on: Amazon Linux 2023, Ubuntu 22.04 LTS
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ECR_REGISTRY="${ECR_REGISTRY:?Set ECR_REGISTRY env var}"  # e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_DIR="/opt/ess-bsl"

echo "📦 ESS-BSL EC2 Deploy — $(date)"

# ── 1. Install Docker + Compose if not present ────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "🔧 Installing Docker…"
    curl -fsSL https://get.docker.com | bash
    sudo usermod -aG docker "$USER"
    sudo systemctl enable --now docker
fi

if ! docker compose version &>/dev/null; then
    echo "🔧 Installing Docker Compose plugin…"
    sudo apt-get install -y docker-compose-plugin 2>/dev/null || \
    sudo yum install -y docker-compose-plugin 2>/dev/null || true
fi

# ── 2. Authenticate with ECR ─────────────────────────────────────────────────
echo "🔐 Authenticating with ECR…"
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

# ── 3. Pull latest images ─────────────────────────────────────────────────────
echo "⬇️  Pulling images…"
docker pull "$ECR_REGISTRY/ess-bsl-backend:latest"
docker pull "$ECR_REGISTRY/ess-bsl-frontend:latest"

# ── 4. Copy app files ─────────────────────────────────────────────────────────
sudo mkdir -p "$APP_DIR"
sudo cp docker-compose.yml "$APP_DIR/"
sudo cp docker-compose.prod.yml "$APP_DIR/"
sudo cp .env "$APP_DIR/.env"                # Pre-populated .env
sudo chmod 600 "$APP_DIR/.env"              # Restrict read access

# ── 5. Zero-downtime deploy ───────────────────────────────────────────────────
echo "🚀 Deploying…"
cd "$APP_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# ── 6. Health check ───────────────────────────────────────────────────────────
echo "⏳ Waiting for backend health check…"
for i in {1..30}; do
    if curl -sf http://localhost:3434/ > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
        break
    fi
    sleep 5
done

# ── 7. Prune old images ───────────────────────────────────────────────────────
docker image prune -f

echo "🎉 Deployment complete!"
