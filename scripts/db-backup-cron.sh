#!/bin/bash
# db-backup-cron.sh — Thin cron wrapper for automated backups

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="${PROJECT_DIR}/backups/backup.log"

echo "=== Backup started at $(date) ===" >> "$LOG_FILE"
"${PROJECT_DIR}/scripts/db-backup.sh" >> "$LOG_FILE" 2>&1
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "=== Backup successful ===" >> "$LOG_FILE"
    
    # Prune old backups (keep last 30 days)
    echo "Pruning backups older than 30 days..." >> "$LOG_FILE"
    find "${PROJECT_DIR}/backups" -name "ess_db_*.sql.gz.enc*" -type f -mtime +30 -delete >> "$LOG_FILE" 2>&1
else
    echo "=== Backup FAILED (Exit Code: $STATUS) ===" >> "$LOG_FILE"
    # Note: Integrate with email/Slack alerting here if needed
fi
