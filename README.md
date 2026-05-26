# 中小企业外贸独立站

> Python / Saleor / FastAPI / Next.js 技术栈

## 项目结构

```
wywmwz/
├── docker-compose.yml      # 容器编排
├── nginx/                  # Nginx 反向代理 + IP 白名单
├── fastapi/                # FastAPI 询盘服务
│   ├── app/                # 应用代码
│   ├── alembic/            # 数据库迁移
│   ├── tests/              # 测试
│   └── Dockerfile
├── frontend/               # Next.js 前端（Vercel 托管）
│   ├── app/[locale]/       # 国际化页面
│   ├── components/         # 组件
│   ├── lib/                # 客户端库
│   └── messages/           # 翻译文件
├── scripts/                # 备份/恢复脚本
└── .github/workflows/      # CI/CD
```

## 快速开始

### 1. 环境准备

```bash
cp .env.example .env
# 编辑 .env，填入实际密码和 API Key
```

### 2. 启动后端服务

```bash
docker compose up -d
```

### 3. 初始化数据库

```bash
docker compose exec fastapi alembic upgrade head
```

### 4. 启动前端开发

```bash
cd frontend
npm install
npm run dev
```

### 5. 访问

- 前端: http://localhost:3000
- Saleor GraphQL: http://localhost:8000/graphql/
- Saleor Dashboard: http://localhost:9000
- FastAPI Docs: http://localhost:8001/docs
- FastAPI Health: http://localhost:8001/health

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `SALEOR_DB_PASSWORD` | Saleor 数据库密码 | 是 |
| `FASTAPI_DB_PASSWORD` | FastAPI 数据库密码 | 是 |
| `REDIS_PASSWORD` | Redis 密码 | 是 |
| `SECRET_KEY` | Saleor 密钥（≥32字符） | 是 |
| `BREVO_API_KEY` | Brevo 邮件 API Key | 是 |
| `ADMIN_EMAIL` | 管理员邮箱 | 是 |
| `SENTRY_DSN` | Sentry 错误追踪 | 否 |
| `WHATSAPP_NUMBER` | WhatsApp 号码 | 否 |

## 测试

```bash
# FastAPI 测试
cd fastapi
pip install -r requirements.txt pytest pytest-asyncio aiosqlite
pytest tests/ -v

# 前端构建检查
cd frontend
npm run lint && npm run build
```

## 备份

```bash
# 手动备份
./scripts/backup.sh

# 恢复备份
./scripts/restore.sh 20260526_020000 saleor
```

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 电商引擎 | Saleor | 3.20.3 |
| 自定义后端 | FastAPI | 0.115+ |
| 前端 | Next.js | 15 |
| 数据库(Saleor) | PostgreSQL | 16 |
| 数据库(FastAPI) | PostgreSQL | 16 |
| 缓存/队列 | Redis | 7 |
| 任务队列 | Celery | 5.4+ |
| 邮件 | Brevo | - |
| CDN | Cloudflare | Free |
| 前端托管 | Vercel | Hobby |
