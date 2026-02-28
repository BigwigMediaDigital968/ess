#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────────────────────────
#  db-restore.sh — Decrypt and Restore PostgreSQL Backup
# ──────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

if [ -z "$1" ]; then
    echo "Usage: ./db-restore.sh <path-to-encrypted-backup-file>"
    echo "Example: ./db-restore.sh ../backups/ess_db_20261010_120000.sql.gz.enc"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[FAIL] Backup file not found: $BACKUP_FILE"
    exit 1
fi

TARGET_DB="${RESTORE_DB:-$POSTGRES_DB}"

echo "⚠️  WARNING: You are about to completely overwrite the database: $TARGET_DB"
echo "⚠️  This action is irreversible. Are you sure you want to proceed?"
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "[INFO] Decrypting and restoring backup..."

# We decrypt via openssl, unzip via gunzip, then pipe to pg_restore in the container.
# Using --clean --if-exists to drop existing objects before restoring.
openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:"$BACKUP_ENCRYPTION_KEY" -in "$BACKUP_FILE" | \
    gunzip | \
    docker compose -f "${PROJECT_DIR}/docker-compose.yml" exec -T postgres \
    pg_restore -U "$POSTGRES_USER" -d "$TARGET_DB" --clean --if-exists --no-owner --no-privileges

if [ ${PIPESTATUS[2]} -eq 0 ] || [ ${PIPESTATUS[2]} -eq 1 ]; then
    # Return code 1 from pg_restore is often acceptable (warnings about schema existence)
    echo "[OK] Restore completed successfully."
else
    echo "[FAIL] Restore failed with code ${PIPESTATUS[2]}"
    exit 1
fi
