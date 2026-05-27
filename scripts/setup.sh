#!/bin/bash
# scripts/setup.sh — 首次部署初始化脚本
# 用法: bash scripts/setup.sh
set -euo pipefail

PROJECT_DIR="/opt/wywmwz"
ENV_FILE="$PROJECT_DIR/.env"

echo "========================================="
echo "  WYWNWZ 外贸独立站 — 首次部署初始化"
echo "========================================="
echo ""

# 1. 检查 .env 文件
if [ ! -f "$ENV_FILE" ]; then
    echo "[1/7] 创建 .env 文件..."
    cp "$PROJECT_DIR/.env.example" "$ENV_FILE"
    echo "  已从 .env.example 复制。请编辑 $ENV_FILE 填入实际值！"
    echo "  必须修改的变量："
    echo "    - SALEOR_DB_PASSWORD"
    echo "    - FASTAPI_DB_PASSWORD"
    echo "    - REDIS_PASSWORD"
    echo "    - SECRET_KEY"
    echo "    - ADMIN_JWT_SECRET (>= 32 字符随机字符串)"
    echo "    - ADMIN_PASSWORD (>= 16 字符强密码)"
    echo "    - BREVO_API_KEY"
    echo ""
    read -p "  按 Enter 编辑 .env 文件，或 Ctrl+C 退出手动编辑..." _
    ${EDITOR:-vi} "$ENV_FILE"
else
    echo "[1/7] .env 文件已存在，跳过。"
fi

# 2. 检查 SSL 证书
SSL_DIR="$PROJECT_DIR/nginx/ssl"
if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
    echo ""
    echo "[2/7] SSL 证书未找到。"
    echo "  请将证书文件放置到 $SSL_DIR/:"
    echo "    - fullchain.pem (完整证书链)"
    echo "    - privkey.pem  (私钥)"
    echo ""
    echo "  可使用 Let's Encrypt 获取免费证书："
    echo "    certbot certonly --standalone -d api.yourdomain.com"
    echo ""
    read -p "  证书已就位？(yes/no): " CERT_OK
    if [ "$CERT_OK" != "yes" ]; then
        echo "  请配置 SSL 证书后重新运行此脚本。"
        exit 1
    fi
else
    echo "[2/7] SSL 证书已就位。"
fi

# 3. 创建备份目录
BACKUP_DIR="/opt/backups"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "[3/7] 创建备份目录 $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
else
    echo "[3/7] 备份目录已存在。"
fi

# 4. 配置 cron 定时备份
echo "[4/7] 配置定时备份 cron..."
CRON_LINE="0 2 * * * bash $PROJECT_DIR/scripts/backup.sh >> /var/log/wywmwz-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "scripts/backup.sh"; echo "$CRON_LINE") | crontab -
echo "  已配置每日 02:00 自动备份。"

# 5. 构建并启动服务
echo "[5/7] 构建并启动服务..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "  服务已启动。"

# 6. 等待数据库就绪并运行迁移
echo "[6/7] 等待数据库就绪..."
sleep 10

echo "  运行 Alembic 数据库迁移..."
docker compose exec fastapi alembic upgrade head
echo "  数据库迁移完成。"

# 7. 健康检查
echo "[7/7] 运行健康检查..."
sleep 5

HEALTH_OK=true
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "  FastAPI:   OK"
else
    echo "  FastAPI:   FAIL"
    HEALTH_OK=false
fi

if curl -sf http://localhost:8000/graphql/ -o /dev/null 2>&1; then
    echo "  Saleor:    OK"
else
    echo "  Saleor:    FAIL (可能仍在启动中，请稍后检查)"
fi

echo ""
echo "========================================="
if [ "$HEALTH_OK" = true ]; then
    echo "  部署初始化完成！"
else
    echo "  部署初始化完成，但部分服务未就绪。"
    echo "  请运行: make healthcheck"
fi
echo "========================================="
echo ""
echo "  后续步骤："
echo "  1. 配置 Cloudflare DNS 指向服务器 IP"
echo "  2. 配置 Vercel 前端部署（设置环境变量）"
echo "  3. 在 Saleor Dashboard 中创建产品和分类"
echo "  4. 验证询盘提交流程"
echo ""
