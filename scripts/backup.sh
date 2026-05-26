#!/bin/bash
# scripts/backup.sh — 每日 02:00 cron 执行
# 备份 Saleor + FastAPI 双数据库

set -euo pipefail

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS=30

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# 备份 Saleor 数据库
echo "  Backing up saleor_db..."
pg_dump -h 127.0.0.1 -p 5432 -U saleor saleor | gzip > "$BACKUP_DIR/saleor_$DATE.sql.gz"

# 备份 FastAPI 数据库
echo "  Backing up fastapi_db..."
pg_dump -h 127.0.0.1 -p 5433 -U fastapi fastapi | gzip > "$BACKUP_DIR/fastapi_$DATE.sql.gz"

# 上传到 OSS/S3（异地备份，取消注释启用）
# aws s3 cp "$BACKUP_DIR/saleor_$DATE.sql.gz" s3://your-bucket/backups/ --quiet
# aws s3 cp "$BACKUP_DIR/fastapi_$DATE.sql.gz" s3://your-bucket/backups/ --quiet

# 清理过期备份
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETAIN_DAYS -delete

echo "[$(date)] Backup completed: $DATE"
echo "  Files: saleor_$DATE.sql.gz, fastapi_$DATE.sql.gz"
