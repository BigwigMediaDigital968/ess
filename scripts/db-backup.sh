#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
#  db-backup.sh — Encrypted PostgreSQL Backup Script
# ──────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
ENV_FILE="${PROJECT_DIR}/.env"

# Load environment
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "[FAIL] .env file not found at $ENV_FILE"
    exit 1
fi

if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
    echo "[FAIL] BACKUP_ENCRYPTION_KEY is required in .env"
    exit 1
fi

if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ]; then
    echo "[FAIL] POSTGRES_DB and POSTGRES_USER are required in .env"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="ess_db_${TIMESTAMP}.sql.gz"
ENC_FILENAME="${FILENAME}.enc"

echo "[INFO] Starting database backup: $FILENAME"

# 1. pg_dump directly from container, pipe to gzip, pipe to openssl encryption
docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc | \
    gzip -9 | \
    openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_ENCRYPTION_KEY" \
    > "${BACKUP_DIR}/${ENC_FILENAME}"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "[FAIL] Backup failed. Check postgres container status."
    rm -f "${BACKUP_DIR}/${ENC_FILENAME}"
    exit 1
fi

# 2. Verify checksum
CHECKSUM=$(sha256sum "${BACKUP_DIR}/${ENC_FILENAME}" | awk '{print $1}')
echo "Checksum: $CHECKSUM" > "${BACKUP_DIR}/${ENC_FILENAME}.sha256"

echo "[OK] Backup created successfully: ${BACKUP_DIR}/${ENC_FILENAME}"
echo "     Size: $(du -sh "${BACKUP_DIR}/${ENC_FILENAME}" | cut -f1)"
echo "     SHA256: $CHECKSUM"
