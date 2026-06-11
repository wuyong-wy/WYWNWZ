#!/bin/bash
# scripts/healthcheck.sh — 服务健康检查脚本
# 用法: bash scripts/healthcheck.sh
set -uo pipefail

echo "=== WYWNWZ 服务健康检查 ==="
echo ""

FAIL_COUNT=0

# FastAPI
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "  [OK] FastAPI (port 8001)"
else
    echo "  [FAIL] FastAPI (port 8001)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Saleor API
if curl -sf -X POST http://localhost:8000/graphql/ \
     -H "Content-Type: application/json" \
     -d '{"query":"{ shop { name } }"}' > /dev/null 2>&1; then
    echo "  [OK] Saleor API (port 8000)"
else
    echo "  [FAIL] Saleor API (port 8000)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Saleor Dashboard
if curl -sf http://localhost:9000 > /dev/null 2>&1; then
    echo "  [OK] Saleor Dashboard (port 9000)"
else
    echo "  [FAIL] Saleor Dashboard (port 9000)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Redis（通过环境变量传递密码，避免命令行暴露）
REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" .env 2>/dev/null | cut -d= -f2 || echo "")
if docker exec -e REDISCLI_AUTH="$REDIS_PASSWORD" \
     $(docker ps -qf name=redis 2>/dev/null) \
     redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "  [OK] Redis"
else
    echo "  [FAIL] Redis"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# PostgreSQL (Saleor)
if docker exec $(docker ps -qf name=db-saleor 2>/dev/null) \
     pg_isready -U saleor > /dev/null 2>&1; then
    echo "  [OK] PostgreSQL (saleor_db)"
else
    echo "  [FAIL] PostgreSQL (saleor_db)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# PostgreSQL (FastAPI)
if docker exec $(docker ps -qf name=db-fastapi 2>/dev/null) \
     pg_isready -U fastapi > /dev/null 2>&1; then
    echo "  [OK] PostgreSQL (fastapi_db)"
else
    echo "  [FAIL] PostgreSQL (fastapi_db)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Nginx
if curl -sf https://localhost/ > /dev/null 2>&1 || curl -sf http://localhost/ > /dev/null 2>&1; then
    echo "  [OK] Nginx (port 80/443)"
else
    echo "  [FAIL] Nginx (port 80/443)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo "所有服务运行正常。"
    exit 0
else
    echo "$FAIL_COUNT 个服务异常，请检查日志: docker compose logs"
    exit 1
fi
