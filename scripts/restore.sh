#!/bin/bash
# scripts/restore.sh — 恢复数据库备份
# 用法: ./restore.sh <backup_date> <db_name>
# 示例: ./restore.sh 20260526_020000 saleor
# 示例: ./restore.sh 20260526_020000 fastapi

set -euo pipefail

BACKUP_DIR="/opt/backups"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <backup_date_timestamp> <db_name: saleor|fastapi>"
    echo "Example: $0 20260526_020000 saleor"
    exit 1
fi

BACKUP_DATE=$1
DB_NAME=$2

if [[ "$DB_NAME" != "saleor" && "$DB_NAME" != "fastapi" ]]; then
    echo "Error: db_name must be 'saleor' or 'fastapi'"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${BACKUP_DATE}.sql.gz"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# 设置端口和用户
if [ "$DB_NAME" = "saleor" ]; then
    DB_PORT=5432
    DB_USER=saleor
else
    DB_PORT=5433
    DB_USER=fastapi
fi

echo "WARNING: This will DROP and recreate the $DB_NAME database!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "Restoring $DB_NAME from $BACKUP_FILE..."

# 解压并恢复
gunzip -c "$BACKUP_FILE" | psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME

echo "Restore completed."
