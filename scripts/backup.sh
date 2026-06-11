#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
KEEP_DAYS="${KEEP_DAYS:-30}"
CONTAINER="${POSTGRES_CONTAINER:-raja-postgres}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Iniciando backup — $TIMESTAMP"

docker exec "$CONTAINER" pg_dump \
  -U "${POSTGRES_USER:-raja_user}" \
  -d "${POSTGRES_DB:-raja_db}" \
  --format=custom \
  --compress=9 \
  > "$BACKUP_DIR/backup_$TIMESTAMP.dump"

SIZE=$(du -sh "$BACKUP_DIR/backup_$TIMESTAMP.dump" | cut -f1)
echo "[$(date -Iseconds)] Backup concluído — $SIZE — $BACKUP_DIR/backup_$TIMESTAMP.dump"

# Remove backups mais antigos que KEEP_DAYS
find "$BACKUP_DIR" -name "*.dump" -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Iseconds)] Limpeza concluída — mantendo últimos $KEEP_DAYS dias"

# Descomente para enviar ao S3:
# aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.dump" "s3://raja-backups/postgres/"
