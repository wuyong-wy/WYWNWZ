# F:\WYWNWZ 项目全面检测报告

> 检测日期：2026-05-27 | 检测范围：全栈代码、架构、安全、测试、部署

## 项目概览

| 维度 | 详情 |
|------|------|
| **项目类型** | 外贸独立站 (B2B询盘系统) |
| **前端** | Next.js 15 + React 19 + next-intl (中英双语) |
| **后端** | FastAPI + Celery + Saleor (电商后端) |
| **数据库** | PostgreSQL 16 × 2 (Saleor + FastAPI 独立库) |
| **部署** | Docker Compose + Nginx + GitHub Actions + Vercel |
| **总文件数** | ~60+ 源文件, 5 次 commit |

---

## 一、安全检测

### 严重问题 (CRITICAL)

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 1 | **JWT 默认密钥硬编码** | `fastapi/app/config.py:9` | `_DEFAULT_JWT_SECRET = "change_me_admin_jwt_secret_at_least_32_chars"` — 虽然有启动校验，但源码中硬编码了一个"看起来像占位符"的字符串。如果 .env 未正确配置，`model_post_init` 在生产环境会抛出 ValueError（这是好的），但开发环境 DEBUG=true 时会静默使用默认密钥。建议：开发环境也应至少 warning。 |
| 2 | **ADMIN_PASSWORD 无阻止级校验** | `fastapi/app/config.py:61-66` | 密码不足 16 位仅打 warning 日志，不会阻止启动。如果部署时忘记设置密码，系统会以空字符串密码运行。建议：生产环境密码为空或过短时应 raise ValueError。 |
| 3 | **测试文件中硬编码密码** | `fastapi/tests/test_auth.py:15-16` | `TEST_PASSWORD = "test_password_16chars!"` — 测试数据可以接受，但建议使用 `secrets.token_urlsafe(16)` 动态生成。 |
| 4 | **Docker 镜像使用 latest 标签** | `docker-compose.yml:29` | `saleor-dashboard:latest` — latest 标签不可追溯，可能导致意外升级。建议锁定版本。 |
| 5 | **Redis 密码通过命令行传递** | `docker-compose.yml:139`, `scripts/healthcheck.sh:40` | `redis-cli -a "${REDIS_PASSWORD}"` — 密码暴露在进程列表中（Linux 下可见于 `/proc/*/cmdline`）。建议改用 `REDISCLI_AUTH` 环境变量或交互式输入。 |

### 高危问题 (HIGH)

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 6 | **Nginx SSL 使用弱密码套件** | `nginx/nginx.conf:67` | `ssl_ciphers` 未包含 `!aNULL:!MD5` 等禁用弱加密的标记，且缺少 `ssl_ecdh_curve`。建议补充：`ssl_ciphers ...:!aNULL:!eNULL:!MD5; ssl_ecdh_curve X25519:secp384r1;` |
| 7 | **缺少 HSTS 头** | `nginx/nginx.conf:60-135` | 443 server 未添加 `Strict-Transport-Security` 头。建议添加：`add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` |
| 8 | **缺少 CSP 头** | `nginx/nginx.conf` | 未配置 Content-Security-Policy，增加 XSS 风险。 |
| 9 | **FastAPI 无请求体大小限制** | `fastapi/app/main.py` | 未对请求体大小做限制，POST 端点在 nginx 层有限速但大小无限。 |
| 10 | **Celery 无认证机制** | `fastapi/celery_config.py` | Celery worker 直接接收任务，无签名验证。如果 Redis 有密码保护可以缓解，但 Celery 自身未启用 `task_serializer` 签名。 |

### 中危问题 (MEDIUM)

| # | 问题 | 位置 |
|---|------|------|
| 11 | `.env.example` 包含示例密码 `change_me_*` 值，可能被误用 | `.env.example` |
| 12 | Nginx `server_name _` 匹配所有域名，可能被用于 DNS 重绑定攻击 | `nginx/nginx.conf:55` |
| 13 | 前端 `WhatsAppFloat.tsx` 硬编码默认 WhatsApp 号码 `8613800138000` | `frontend/components/shared/WhatsAppFloat.tsx:5` |
| 14 | 前端 `SchemaMarkup.tsx` 使用 `dangerouslySetInnerHTML`，但注入的是 `JSON.stringify` 结果，风险低但需要审计确保 schema 数据源可信 | `frontend/components/shared/SchemaMarkup.tsx:18` |
| 15 | `make healthcheck` 通过 `grep` 提取 Redis 密码，可能不准确 | `Makefile:86` |

---

## 二、代码质量检测

### 后端 (FastAPI)

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 16 | `get_db` 依赖中 commit 和 rollback 逻辑有问题 | `fastapi/app/database.py:27-35` | 该依赖在 `yield` 后 commit，但如果 HTTP 响应已经返回，commit 失败不会反馈给客户端。此外，读操作也应 commit（或无操作），按当前逻辑读操作也会 commit。建议：对于 GET 请求不提交，仅 POST/PUT/DELETE 时提交；或改为仅 rollback 异常，不主动 commit（由调用方控制）。 |
| 17 | Celery task 中 `asyncio.run()` 重复创建事件循环 | `fastapi/app/tasks/email.py:58,98` | Celery worker 是同步的，但每个任务内用 `asyncio.run()` 创建新事件循环。如果有多个 task 并发执行，可能导致事件循环冲突。建议使用 `celery.contrib.asyncio` 或使用同步数据库会话。 |
| 18 | `delete_inquiry` 返回 204 无响应体 | `fastapi/app/api/inquiries.py:118` | `status_code=204` 意味着无响应体，但函数没有显式 `return` 或 `return Response(status_code=204)`，FastAPI 会自动返回 `null`。这在 OpenAPI 规范中是正确的但部分客户端可能不适配。 |
| 19 | 健康检查端点未检测数据库连接 | `fastapi/app/api/health.py:8-11` | 仅返回 `{"status": "ok"}`，不检查数据库、Redis、Saleor API 的连通性。负载均衡器可能将不健康的实例标记为健康。 |
| 20 | Saleor GraphQL 客户端使用模块级单例 | `fastapi/app/services/saleor.py:28-29` | `_transport` 和 `_client` 在模块导入时创建，如果配置未加载或连接失败，会在无清晰错误信息下静默失败。建议在 lifespan 中初始化，或使用惰性初始化。 |
| 21 | `saleor_client` 无认证头 | `fastapi/app/services/saleor.py:28-29` | Saleor GraphQL 端点如果要求认证，当前客户端无法通过。加上环境变量中无对应配置。 |
| 22 | 邮箱发送 `brevo_send` 在 API_KEY 未配置时静默返回 False | `fastapi/app/services/email.py:27-29` | 建议在此场景抛出异常或至少由调用方检查返回值。 |

### 前端 (Next.js)

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 23 | 前端 API 调用无超时处理 | `frontend/lib/api.ts:30` | `fetch` 未设置 `AbortController` 或 `timeout`，在网络慢时可能无限等待 |
| 24 | GraphQL 查询拼接字符串构建（非参数化） | `frontend/lib/saleor.ts:34-192` | `PRODUCT_FRAGMENT(langCode)` 等函数使用模板字符串拼接 GraphQL 查询。`langCode` 来自 URL 参数，虽然经过 `LOCALE_TO_LANG_CODE` 映射（白名单），但如果未来添加动态字段，存在注入风险。当前风险低，但建议使用 `$languageCode` 变量传参。 |
| 25 | `InquiryForm` 组件的 `validate()` 只在客户端校验 | `frontend/components/inquiry/InquiryForm.tsx:33-41` | 虽然后端也有 Pydantic 校验，但如果网络请求格式错误，用户体验不佳。双层校验是好的，当前实现没问题，建议加上 XSS 过滤（message 字段）。 |
| 26 | `Header` 组件语言切换器点击外部不关闭 | `frontend/components/layout/Header.tsx:60-85` | `langOpen` 的下拉菜单点击外部不会自动关闭，需点击语言选项或再次点击按钮。建议添加 `useEffect` 监听 `click-outside` 事件。 |
| 27 | `next.config.ts` 中 `experimental.serverActions` 配置可能无用 | `frontend/next.config.ts:20-22` | Next.js 15 中 server actions 的 `bodySizeLimit` 不需要 experimental 前缀。建议确认此配置是否生效。 |
| 28 | 前端无全局 error boundary | — | 缺少 React ErrorBoundary 组件，运行时错误会导致整个页面白屏。 |

---

## 三、架构与部署检测

### 架构问题

| # | 问题 | 说明 |
|---|------|------|
| 29 | **双数据库设计有冗余风险** | Saleor 和 FastAPI 各用一个 PostgreSQL。FastAPI 仅存储询盘数据（一张 inquiries 表），负载极低。单独一个 PG 实例增加了运维复杂度（备份、迁移、监控都需双份）。建议：MVP 阶段可将 inquiries 表放入 Saleor 数据库的单独 schema 中（如 `fastapi.inquiries`），共用一个 PG 实例。 |
| 30 | **Celery Worker 和 Beat 与 FastAPI 共用镜像** | docker-compose 中 celery-worker 和 celery-beat 使用同一 Dockerfile，镜像中包含完整的 FastAPI 代码。这是合理的做法（共用代码库），但需确保 worker 不会意外启动 HTTP 服务。 |
| 31 | **Nginx 配置中 `/dashboard/` 访问控制使用占位符 IP** | `nginx/nginx.conf:90-91` | `allow 203.0.113.0/24` 是 TEST-NET 保留地址（RFC 5737），`10.0.0.0/8` 对大多数部署不适用。实际部署时需替换为真实 IP，但注释中未明确说明 `203.0.113.0/24` 是占位符。 |
| 32 | **缺少 CI 的数据库迁移自动化** | `deploy.yml:91` | 迁移通过 SSH 执行 `alembic upgrade head`，如果迁移失败没有回滚机制。建议在部署前进行迁移的 dry-run 检查。 |

### 部署配置

| # | 问题 | 说明 |
|---|------|------|
| 33 | **docker-compose.prod.yml 中 FastAPI 仅分配 512M 内存** | 对于生产环境来说偏低，特别是 Celery worker 也仅 512M。如果邮件发送批量询盘，可能 OOM。 |
| 34 | **MeiliSearch 配置已注释但未实现** | `docker-compose.yml:144-155` | 注释提到"阶段 3"，但未在开发计划中追踪。 |
| 35 | **setup.sh 中 `read -p` 在容器化环境中可能无法交互** | `scripts/setup.sh:28` | 如果是自动化脚本执行，read 会跳过。建议提供非交互模式（`--non-interactive` 标志）。 |

---

## 四、测试覆盖检测

| # | 项目 | 说明 |
|---|------|------|
| 36 | 后端测试文件仅 2 个 | `test_auth.py` (179行) + `test_inquiries.py` (177行)，覆盖了询盘 CRUD 和登录流程的基本场景，但缺少：边缘情况测试（超大字段、Unicode 字符、并发提交）、服务层测试（email.py, saleor.py 无测试）、Celery 任务测试。 |
| 37 | 前端无测试 | 无 `__tests__` 目录、无 E2E 测试配置。 |
| 38 | 无测试覆盖率报告配置 | Makefile 的 test 命令未包含 `--cov` 参数，CI 中同样未收集覆盖率。 |
| 39 | 测试使用文件数据库 `./test.db` | `conftest.py:15` — 每次测试创建/删除表，但测试间未清理数据可能导致相互影响。`autouse=True` 的 fixture 在每个测试后 drop_all，但这不够隔离——如果两个测试并发运行会冲突。 |

---

## 五、文件/代码规范检测

| # | 问题 | 位置 |
|---|------|------|
| 40 | `.dockerignore` 排除了 `Dockerfile` 和 `docker-compose*.yml` | `.dockerignore:37-38` — 这些文件本就不应被 COPY 进镜像（Docker 会自动处理），但排除它们不构成问题，只是多余的。 |
| 41 | `.dockerignore` 排除了 `tests` 目录 | `.dockerignore:32` — 正确做法，避免测试文件进入生产镜像。 |
| 42 | FastAPI 的 `__init__.py` 文件多为空 | 符合规范，无问题。 |
| 43 | `alembic/env.py` 中 `from app.models import *` | `alembic/env.py:14` — 使用星号导入，虽然加了 `# noqa` 注解，但不够明确。建议改为显式导入。 |
| 44 | 部分 imports 顺序不统一 | `inquiries.py` 中 `datetime` import 在 `uuid` 之后但在 pydantic 之前，应使用 isort 统一排序。 |
| 45 | `README.md` 中域名使用占位符 `yourdomain.com` | 这是正确的（开源安全），但建议在部署文档中说明如何全局替换。 |

---

## 六、综合评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **安全性** | ⭐⭐⭐ (3/5) | JWT/密码校验逻辑好（有生产环境强制检查），但 Nginx SSL 和 HTTP 安全头不完整，缺 HSTS/CSP。Redis 密码暴露在命令行。 |
| **代码质量** | ⭐⭐⭐½ (3.5/5) | 整体结构清晰，分层合理。主要问题是 Celery + asyncio 混用模式和 DB 会话管理存在潜在风险。 |
| **架构设计** | ⭐⭐⭐½ (3.5/5) | 微服务拆分合理，Saleor + 自定义 FastAPI 的模式对 B2B 询盘场景适配好。双数据库在 MVP 阶段过度设计。 |
| **测试覆盖** | ⭐⭐ (2/5) | 后端有基础 API 测试但缺少服务层和边缘场景。前端完全无测试。无覆盖率指标。 |
| **部署运维** | ⭐⭐⭐⭐ (4/5) | Docker Compose 配置完善，生产环境覆盖文件、Makefile、备份脚本、setup 脚本都很规范。GitHub Actions CI/CD 完整。 |
| **文档** | ⭐⭐⭐⭐ (4/5) | README 全面，开发计划详细，SSL 证书配置说明和 `.env.example` 注释完善。 |
| **国际化** | ⭐⭐⭐⭐ (4/5) | 中英双语路由、翻译文件、next-intl 集成完善。 |
| **SEO** | ⭐⭐⭐⭐ (4/5) | JSON-LD Schema Markup、next-sitemap、多语言路由、产品/分类元数据齐全。 |

**总评：⭐⭐⭐½ (3.5/5)** — 架构合理、代码规范良好的 MVP 项目，主要短板在安全加固和测试覆盖。

---

## 七、优先修复建议 (Top 10)

| 优先级 | 问题# | 建议 |
|--------|-------|------|
| **P0** | #2 | ADMIN_PASSWORD 生产环境为空时 raise ValueError（而非 warning） |
| **P0** | #6, #7 | Nginx 补全 HSTS 头 + 强化 SSL 密码套件 |
| **P1** | #1 | 移除 config.py 中硬编码的 `_DEFAULT_JWT_SECRET`，改为仅从环境变量读取 |
| **P1** | #5 | Redis 密码改用 `REDISCLI_AUTH` 环境变量而非 `-a` 参数 |
| **P1** | #16 | 修复 `get_db` 依赖：读操作不应 commit，或改为由路由层控制事务 |
| **P1** | #19 | 健康检查端点增加 DB 和 Redis 连通性检测 |
| **P2** | #17 | Celery task 改用同步数据库会话或 `celery.contrib.asyncio` |
| **P2** | #4 | 锁定 `saleor-dashboard` 镜像版本 |
| **P2** | #28 | 前端添加 ErrorBoundary 组件 |
| **P2** | #37, #38 | 添加前端基础测试 + 配置覆盖率报告 |
