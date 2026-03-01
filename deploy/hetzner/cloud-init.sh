#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  deploy/hetzner/cloud-init.sh — Bootstrap ESS-BSL on Hetzner Cloud
#  Run as cloud-init user-data, or directly on a fresh Ubuntu 22.04 VPS
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN variable (e.g. ess.bigwigmediadigital.com)}"
EMAIL="${EMAIL:?Set EMAIL for Let's Encrypt}"
APP_DIR="/opt/ess-bsl"
REPO_URL="${REPO_URL:-}"  # Optional: git clone URL

echo "🏁 ESS-BSL Hetzner Bootstrap — $(date)"

# ── System updates ────────────────────────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw fail2ban unattended-upgrades

# ── Firewall ──────────────────────────────────────────────────────────────────
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw --force enable

# ── fail2ban ─────────────────────────────────────────────────────────────────
systemctl enable --now fail2ban

# ── Docker ────────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | bash
fi
systemctl enable --now docker

# ── Caddy (reverse proxy + auto TLS) ─────────────────────────────────────────
apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq && apt-get install -y -qq caddy

cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
    reverse_proxy /api/* backend:3434
    reverse_proxy /socket.io/* backend:3434
    reverse_proxy /oidc/* backend:3434
    reverse_proxy /nextcloud/* nextcloud:80
    reverse_proxy * frontend:80

    tls $EMAIL
    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
}
EOF

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p "$APP_DIR"
if [ -n "$REPO_URL" ]; then
    git clone "$REPO_URL" "$APP_DIR" 2>/dev/null || git -C "$APP_DIR" pull
fi

# ── Environment ───────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "⚠️  Edit $APP_DIR/.env before starting"
fi
chmod 600 "$APP_DIR/.env"

# ── Start services ────────────────────────────────────────────────────────────
cd "$APP_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
systemctl restart caddy

echo "✅ ESS-BSL is live at https://$DOMAIN"
echo "⚠️  Remember to set your DNS A record: $DOMAIN → $(curl -sf https://api.ipify.org)"
