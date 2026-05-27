# WYWNWZ 外贸独立站 — 统一命令入口
# 用法: make <target>

.PHONY: help dev dev-down build up down restart logs test lint backup restore healthcheck migrate setup

COMPOSE := docker compose
COMPOSE_PROD := docker compose -f docker-compose.yml -f docker-compose.prod.yml

help: ## 显示所有可用命令
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === 开发环境 ===

dev: ## 启动开发环境（所有服务）
	$(COMPOSE) up -d
	@echo "Development environment started."
	@echo "  Saleor API:    http://localhost:8000/graphql/"
	@echo "  Saleor Dashboard: http://localhost:9000"
	@echo "  FastAPI:       http://localhost:8001/docs"
	@echo "  Nginx:         http://localhost"

dev-down: ## 停止开发环境
	$(COMPOSE) down

dev-logs: ## 查看开发环境日志
	$(COMPOSE) logs -f

# === 生产环境 ===

build: ## 构建生产镜像
	$(COMPOSE_PROD) build

up: ## 启动生产环境
	$(COMPOSE_PROD) up -d
	@echo "Production environment started."

down: ## 停止生产环境
	$(COMPOSE_PROD) down

restart: ## 重启所有服务
	$(COMPOSE_PROD) restart
	$(COMPOSE_PROD) exec nginx nginx -s reload

logs: ## 查看生产环境日志
	$(COMPOSE_PROD) logs -f --tail=100

# === 数据库 ===

migrate: ## 运行 Alembic 数据库迁移
	$(COMPOSE) exec fastapi alembic upgrade head

migrate-rollback: ## 回滚最后一次迁移
	$(COMPOSE) exec fastapi alembic downgrade -1

migrate-history: ## 查看迁移历史
	$(COMPOSE) exec fastapi alembic history

# === 测试与代码质量 ===

test: ## 运行 FastAPI 后端测试
	cd fastapi && DATABASE_URL=sqlite+aiosqlite:///./test.db DEBUG=true ADMIN_JWT_SECRET=test_jwt_secret_at_least_32_chars!! ADMIN_PASSWORD=test_password_16chars! pytest tests/ -v

lint: ## 运行代码检查（ruff + eslint）
	cd fastapi && ruff check app/ tests/
	cd frontend && npm run lint

lint-fix: ## 自动修复代码问题
	cd fastapi && ruff check --fix app/ tests/

# === 备份与恢复 ===

backup: ## 备份数据库
	bash scripts/backup.sh

restore: ## 恢复数据库（需指定日期和数据库名）
	@read -p "Backup date (YYYYMMDD_HHMMSS): " DATE; \
	read -p "Database (saleor|fastapi): " DB; \
	bash scripts/restore.sh $$DATE $$DB

# === 运维 ===

healthcheck: ## 检查所有服务健康状态
	@echo "=== Service Health Check ==="
	@curl -sf http://localhost/health > /dev/null && echo "  FastAPI:  OK" || echo "  FastAPI:  FAIL"
	@curl -sf http://localhost:8000/graphql/ -o /dev/null && echo "  Saleor:   OK" || echo "  Saleor:   FAIL"
	@docker exec $$(docker ps -qf name=redis) redis-cli -a "$$REDIS_PASSWORD" ping 2>/dev/null | grep -q PONG && echo "  Redis:    OK" || echo "  Redis:    FAIL"
	@docker exec $$(docker ps -qf name=db-saleor) pg_isready -U saleor 2>/dev/null && echo "  DB-Saleor: OK" || echo "  DB-Saleor: FAIL"
	@docker exec $$(docker ps -qf name=db-fastapi) pg_isready -U fastapi 2>/dev/null && echo "  DB-FastAPI: OK" || echo "  DB-FastAPI: FAIL"

setup: ## 首次部署初始化
	bash scripts/setup.sh

ps: ## 查看运行中的服务
	$(COMPOSE) ps

shell-fastapi: ## 进入 FastAPI 容器
	$(COMPOSE) exec fastapi /bin/bash

shell-db-saleor: ## 进入 Saleor 数据库
	$(COMPOSE) exec db-saleor psql -U saleor

shell-db-fastapi: ## 进入 FastAPI 数据库
	$(COMPOSE) exec db-fastapi psql -U fastapi
