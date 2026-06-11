#!/bin/bash
# scripts/backup.sh — 每日 02:00 cron 执行
# 备份 Saleor + FastAPI 双数据库
# 使用前需配置: 环境变量 PGPASSWORD、BACKUP_S3_BUCKET（可选）

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETAIN_DAYS="${RETAIN_DAYS:-30}"

# Webhook 通知地址（可选，用于备份失败告警）
NOTIFY_WEBHOOK="${BACKUP_NOTIFY_WEBHOOK:-}"

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

send_alert() {
    local msg="$1"
    log "ALERT: $msg"
    if [ -n "$NOTIFY_WEBHOOK" ]; then
        curl -sf -X POST "$NOTIFY_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"Backup FAILED on $(hostname): $msg\"}" > /dev/null 2>&1 || true
    fi
}

log "Starting backup..."

# 备份 Saleor 数据库
log "  Backing up saleor_db..."
if ! pg_dump -h 127.0.0.1 -p 5432 -U saleor saleor | gzip > "$BACKUP_DIR/saleor_$DATE.sql.gz"; then
    send_alert "Saleor database dump failed"
    exit 1
fi

# 备份 FastAPI 数据库
log "  Backing up fastapi_db..."
if ! pg_dump -h 127.0.0.1 -p 5433 -U fastapi fastapi | gzip > "$BACKUP_DIR/fastapi_$DATE.sql.gz"; then
    send_alert "FastAPI database dump failed"
    exit 1
fi

# 上传到 S3/OSS（异地备份，设置 BACKUP_S3_BUCKET 环境变量启用）
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    log "  Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/saleor_$DATE.sql.gz" "s3://${BACKUP_S3_BUCKET}/backups/" --quiet || \
        send_alert "S3 upload failed for saleor backup"
    aws s3 cp "$BACKUP_DIR/fastapi_$DATE.sql.gz" "s3://${BACKUP_S3_BUCKET}/backups/" --quiet || \
        send_alert "S3 upload failed for fastapi backup"
fi

# 清理过期备份
deleted_count=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETAIN_DAYS -delete -print | wc -l)
if [ "$deleted_count" -gt 0 ]; then
    log "  Cleaned up $deleted_count expired backup(s)"
fi

# 验证备份文件完整性
saleor_size=$(stat -c%s "$BACKUP_DIR/saleor_$DATE.sql.gz" 2>/dev/null || echo 0)
fastapi_size=$(stat -c%s "$BACKUP_DIR/fastapi_$DATE.sql.gz" 2>/dev/null || echo 0)
if [ "$saleor_size" -lt 100 ] || [ "$fastapi_size" -lt 100 ]; then
    send_alert "Backup file too small (may be corrupted): saleor=${saleor_size}B, fastapi=${fastapi_size}B"
    exit 1
fi

log "Backup completed: $DATE"
log "  Files: saleor_$DATE.sql.gz (${saleor_size}B), fastapi_$DATE.sql.gz (${fastapi_size}B)"
