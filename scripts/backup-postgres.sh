#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/root/backups/postgres}"
DB_CONTAINER="${DB_CONTAINER:-directus-postgres}"
DB_USER="${DB_USER:-directus}"
DB_NAME="${DB_NAME:-directus}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

timestamp="$(date +%F_%H-%M-%S)"
outfile="${BACKUP_DIR}/${DB_NAME}_${timestamp}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$outfile"

find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup saved: $outfile"
