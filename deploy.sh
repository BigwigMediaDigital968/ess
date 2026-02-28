#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
# deploy.sh — Binary Semantics Limited ESS Portal Deployment Script
# Works on: Hetzner, AWS, GCP, Azure, any Linux VPS with Docker
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"

# ── 1. Pre-flight checks ─────────────────────────────────────────────────────

info "Checking prerequisites..."

command -v docker  >/dev/null 2>&1 || fail "Docker is not installed. Install: https://docs.docker.com/engine/install/"
command -v docker  compose version >/dev/null 2>&1 || fail "Docker Compose v2 is not available."

ok "Docker and Docker Compose found."

# ── 2. Environment file ──────────────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
    warn ".env file not found. Creating from .env.example..."

    if [ -f "${PROJECT_DIR}/.env.example" ]; then
        cp "${PROJECT_DIR}/.env.example" "$ENV_FILE"
    else
        cat > "$ENV_FILE" <<'ENVEOF'
# Database
POSTGRES_USER=ess_user
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=ess_db
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Application
JWT_SECRET=CHANGE_ME_RANDOM_SECRET_64CHARS
SESSION_SECRET=CHANGE_ME_RANDOM_SECRET_64CHARS
SEED_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
BACKUP_ENCRYPTION_KEY=CHANGE_ME_BACKUP_KEY
PORT=3434
NODE_ENV=production

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# Frontend
VITE_API_URL=http://localhost:3434/api
FRONTEND_URL=http://localhost

# OIDC (optional)
OIDC_ISSUER=
ENVEOF
    fi

    warn "⚠  IMPORTANT: Edit .env before continuing!"
    warn "   At minimum set: POSTGRES_PASSWORD, JWT_SECRET, FRONTEND_URL"
    echo ""
    read -p "Press Enter after editing .env to continue (or Ctrl+C to abort)... "
fi

# Validate critical env vars
source "$ENV_FILE" 2>/dev/null || true
if [ "$JWT_SECRET" = "CHANGE_ME_RANDOM_SECRET_64CHARS" ] || [ -z "$JWT_SECRET" ]; then
    warn "JWT_SECRET is set to default. Generating random secret..."
    NEW_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${NEW_SECRET}/" "$ENV_FILE"
    ok "JWT_SECRET auto-generated."
fi

if [ "$SESSION_SECRET" = "CHANGE_ME_RANDOM_SECRET_64CHARS" ] || [ -z "$SESSION_SECRET" ] || ! grep -q "^SESSION_SECRET=" "$ENV_FILE"; then
    warn "SESSION_SECRET is missing or default. Generating..."
    NEW_SESSION_SECRET=$(openssl rand -hex 32)
    if grep -q "^SESSION_SECRET=" "$ENV_FILE"; then
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=${NEW_SESSION_SECRET}/" "$ENV_FILE"
    else
        echo "SESSION_SECRET=${NEW_SESSION_SECRET}" >> "$ENV_FILE"
    fi
    ok "SESSION_SECRET auto-generated."
fi

if [ "$SEED_ADMIN_PASSWORD" = "CHANGE_ME_ADMIN_PASSWORD" ] || [ -z "$SEED_ADMIN_PASSWORD" ] || ! grep -q "^SEED_ADMIN_PASSWORD=" "$ENV_FILE"; then
    warn "SEED_ADMIN_PASSWORD is missing or default. Generating..."
    NEW_ADMIN_PASS=$(openssl rand -base64 16 | tr -d '=+/')
    if grep -q "^SEED_ADMIN_PASSWORD=" "$ENV_FILE"; then
        sed -i "s/SEED_ADMIN_PASSWORD=.*/SEED_ADMIN_PASSWORD=${NEW_ADMIN_PASS}/" "$ENV_FILE"
    else
        echo "SEED_ADMIN_PASSWORD=${NEW_ADMIN_PASS}" >> "$ENV_FILE"
    fi
    ok "SEED_ADMIN_PASSWORD auto-generated."
fi

if [ "$BACKUP_ENCRYPTION_KEY" = "CHANGE_ME_BACKUP_KEY" ] || [ -z "$BACKUP_ENCRYPTION_KEY" ] || ! grep -q "^BACKUP_ENCRYPTION_KEY=" "$ENV_FILE"; then
    warn "BACKUP_ENCRYPTION_KEY is missing or default. Generating..."
    NEW_BACKUP_KEY=$(openssl rand -base64 32 | tr -d '=+/')
    if grep -q "^BACKUP_ENCRYPTION_KEY=" "$ENV_FILE"; then
        sed -i "s/BACKUP_ENCRYPTION_KEY=.*/BACKUP_ENCRYPTION_KEY=${NEW_BACKUP_KEY}/" "$ENV_FILE"
    else
        echo "BACKUP_ENCRYPTION_KEY=${NEW_BACKUP_KEY}" >> "$ENV_FILE"
    fi
    ok "BACKUP_ENCRYPTION_KEY auto-generated."
fi

if [ "$REDIS_PASSWORD" = "CHANGE_ME_REDIS_PASSWORD" ] || [ -z "$REDIS_PASSWORD" ] || ! grep -q "^REDIS_PASSWORD=" "$ENV_FILE"; then
    warn "REDIS_PASSWORD is missing or default. Generating..."
    NEW_REDIS_PASS=$(openssl rand -base64 24 | tr -d '=+/')
    if grep -q "^REDIS_PASSWORD=" "$ENV_FILE"; then
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${NEW_REDIS_PASS}/" "$ENV_FILE"
    else
        echo "REDIS_PASSWORD=${NEW_REDIS_PASS}" >> "$ENV_FILE"
    fi
    ok "REDIS_PASSWORD auto-generated."
fi

if echo "$POSTGRES_PASSWORD" | grep -q "CHANGE_ME"; then
    warn "POSTGRES_PASSWORD is default. Generating random password..."
    NEW_PASS=$(openssl rand -base64 24 | tr -d '=+/')
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${NEW_PASS}/" "$ENV_FILE"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://ess_user:${NEW_PASS}@postgres:5432/ess_db|" "$ENV_FILE"
    ok "POSTGRES_PASSWORD auto-generated."
fi

ok "Environment configured."

# ── 3. Build images ──────────────────────────────────────────────────────────

info "Building Docker images..."
docker compose -f "${PROJECT_DIR}/docker-compose.yml" build --no-cache

ok "Images built successfully."

# ── 4. Stop existing containers & Backup ─────────────────────────────────────

info "Checking if database is running for pre-deployment backup..."
if docker compose -f "${PROJECT_DIR}/docker-compose.yml" ps | grep -q "postgres.*Up"; then
    info "Running pre-deployment database backup..."
    if [ -x "${PROJECT_DIR}/scripts/db-backup.sh" ]; then
        "${PROJECT_DIR}/scripts/db-backup.sh" || warn "Backup script failed. Proceeding anyway."
    else
        warn "Backup script not executable or not found."
    fi
fi

info "Stopping existing containers..."
docker compose -f "${PROJECT_DIR}/docker-compose.yml" down --remove-orphans 2>/dev/null || true

# ── 5. Start services ────────────────────────────────────────────────────────

info "Starting services..."
docker compose -f "${PROJECT_DIR}/docker-compose.yml" up -d

ok "Services started."

# ── 6. Wait for database ─────────────────────────────────────────────────────

info "Waiting for database to be ready..."
if [ -f "${PROJECT_DIR}/postgres-init/01_restore.sql" ]; then
    info "Found postgres-init/01_restore.sql! Docker will automatically restore this database upon first boot."
fi
RETRIES=30
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-ess_user}" >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    RETRIES=$((RETRIES - 1))
    sleep 2
done

if [ $RETRIES -eq 0 ]; then
    fail "Database did not become ready in time."
fi

ok "Database is ready."

# ── 7. Run migrations & seed ─────────────────────────────────────────────────

info "Running database migrations..."
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || {
    warn "migrate deploy failed (first run?). Trying db push..."
    docker compose exec -T backend npx prisma db push
}

info "Seeding database..."
docker compose exec -T backend npx prisma db seed 2>/dev/null || warn "Seed may have already run."

ok "Database migrations and seeding complete."

# ── 8. Health check ──────────────────────────────────────────────────────────

info "Running health checks..."

BACKEND_PORT=${PORT:-5000}
RETRIES=15
until curl -sf "http://localhost:${BACKEND_PORT}/api/auth" >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    RETRIES=$((RETRIES - 1))
    sleep 2
done

if [ $RETRIES -gt 0 ]; then
    ok "Backend is responding on port ${BACKEND_PORT}."
else
    warn "Backend health check timed out. Check logs: docker compose logs backend"
fi

# Check frontend (Nginx on port 80)
if curl -sf "http://localhost" >/dev/null 2>&1; then
    ok "Frontend is responding on port 80."
else
    warn "Frontend health check failed. Check logs: docker compose logs frontend"
fi

# ── 9. Summary ────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo -e " ${GREEN}✓ Binary Semantics Limited ESS Portal deployed successfully!${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo " Frontend:    http://$(hostname -I | awk '{print $1}')"
echo " Backend API: http://$(hostname -I | awk '{print $1}'):${BACKEND_PORT}/api"
echo ""
echo " Administrator Login:"
echo "   User:     admin@bigwig.local"
echo "   Password: (Check .env file SEED_ADMIN_PASSWORD)"
echo ""
echo "───────────────────────────────────────────────────────────────────"
echo " DNS Setup (if using a domain):"
echo "   1. Create an A record pointing to: $(hostname -I | awk '{print $1}')"
echo "   2. For SSL, place certs in ./ssl/ and update docker-compose.yml"
echo "   3. Or use Cloudflare proxy for automatic SSL"
echo "───────────────────────────────────────────────────────────────────"
echo " Useful commands:"
echo "   docker compose logs -f         # View all logs"
echo "   docker compose logs backend    # Backend logs only"
echo "   docker compose restart         # Restart services"
echo "   docker compose down            # Stop everything"
echo "═══════════════════════════════════════════════════════════════════"
