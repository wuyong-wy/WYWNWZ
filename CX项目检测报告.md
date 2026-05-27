# WYWNWZ 外贸独立站 — 项目检测报告

> 检测时间: 2026-05-27  
> 检测范围: 安全性、代码质量、配置一致性、架构一致性、部署配置、依赖安全

## 检测结果汇总

| 严重级别 | 数量 | 说明 |
|---------|------|------|
| CRITICAL | 0 | 无致命问题 |
| HIGH | 6 | 必须修复 |
| MEDIUM | 18 | 建议修复 |
| LOW | 14 | 可选优化 |
| INFO | 10 | 无需修改 |

---

## 1. 安全性检测

### HIGH-1: 产品详情页 XSS 风险
- **文件**: `frontend/app/[locale]/products/[slug]/page.tsx:122`
- **问题**: 使用 `dangerouslySetInnerHTML={{ __html: displayDescription }}` 渲染 Saleor 返回的产品描述 HTML，未做消毒处理
- **修复**: 安装 `dompurify`，渲染前消毒：`dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayDescription) }}`

### HIGH-2: config.py 默认值包含弱密码
- **文件**: `fastapi/app/config.py:9,25-28`
- **问题**: `DATABASE_URL` 默认值含 `fastapi:fastapi`，`REDIS_URL` 含 `redis_password`，`_DEFAULT_JWT_SECRET` 为可预测字符串
- **修复**: 将默认值设为空字符串，强制通过环境变量配置

### HIGH-3: .env.example 与 Settings 字段名不匹配
- **文件**: `.env.example:8` vs `fastapi/app/config.py:25`
- **问题**: `.env.example` 中 `FASTAPI_DATABASE_URL` 与 Settings 类字段 `DATABASE_URL` 名称不匹配
- **修复**: 在 `.env.example` 中添加注释说明 FastAPI 的 `DATABASE_URL` 由 docker-compose 直接构造

### MEDIUM-1: CORS allow_headers 过于宽松
- **文件**: `fastapi/app/main.py:55`
- **问题**: `allow_headers=["*"]` 允许所有请求头
- **修复**: 改为 `allow_headers=["Authorization", "Content-Type"]`

### MEDIUM-2: 缺少 CSRF 保护
- **文件**: `fastapi/app/main.py`
- **问题**: 公开端点 `POST /api/inquiries/` 无 CSRF 防护
- **修复**: 添加 Origin/Referer 校验中间件，或使用 `fastapi-csrf-protect` 库

### MEDIUM-3: Redis healthcheck 暴露密码
- **文件**: `docker-compose.yml:139`
- **问题**: `redis-cli -a "${REDIS_PASSWORD}"` 会在进程列表中暴露密码
- **修复**: 改用 `REDISCLI_AUTH` 环境变量方式

### MEDIUM-4: GraphQL 查询注入风险
- **文件**: `frontend/lib/saleor.ts:49,55,99,106,138,164,180`
- **问题**: `langCode` 和 `channel` 通过模板字符串插值注入 GraphQL 查询，未经验证
- **修复**: 对 `langCode` 添加白名单校验，将 `channel` 改为 GraphQL 变量传递

### MEDIUM-5: SchemaMarkup XSS 低风险
- **文件**: `frontend/components/shared/SchemaMarkup.tsx:18`
- **问题**: `dangerouslySetInnerHTML` 渲染 JSON-LD，`JSON.stringify` 会自动转义，风险较低
- **修复**: 对 schema 数据中的字符串值进行额外校验

---

## 2. 代码质量检测

### MEDIUM-6: tasks/email.py 未使用的 import 和函数
- **文件**: `fastapi/app/tasks/email.py:4,8,19-21`
- **问题**: 导入了 `AsyncSession`、`datetime`、`timezone` 但未使用；`_get_db_sync()` 函数从未调用
- **修复**: 删除未使用的 import 和函数

### MEDIUM-7: schemas/inquiry.py 未使用的 HttpUrl
- **文件**: `fastapi/app/schemas/inquiry.py:6`
- **问题**: 导入了 `HttpUrl` 但未使用
- **修复**: 删除 `HttpUrl` 导入，或将 `source_url` 改为 `HttpUrl` 类型

### MEDIUM-8: tasks/email.py 重复代码
- **文件**: `fastapi/app/tasks/email.py:30-61,70-102`
- **问题**: `send_inquiry_auto_reply` 和 `send_admin_notification` 结构高度重复
- **修复**: 提取公共的 `_get_inquiry(inquiry_id)` 辅助函数

### MEDIUM-9: saleor.ts 重复函数
- **文件**: `frontend/lib/saleor.ts:265-281`
- **问题**: `t()` 和 `tCategory()` 逻辑完全相同，仅参数类型不同
- **修复**: 使用泛型合并为单一函数

### MEDIUM-10: 前端硬编码英文文本
- **文件**: `ProductGrid.tsx:12`, `ProductGallery.tsx:18`, `not-found.tsx:7,11`
- **问题**: "No products found"、"No images available"、"Page not found" 等硬编码英文
- **修复**: 使用 i18n 翻译键

### MEDIUM-11: CookieConsent 类型不安全
- **文件**: `frontend/components/shared/CookieConsent.tsx:25`
- **问题**: 使用 `as Function` 类型断言调用 `gtag`
- **修复**: 定义 `GtagFn` 类型接口

### MEDIUM-12: auth.py Redis 客户端线程安全
- **文件**: `fastapi/app/api/auth.py:20-27`
- **问题**: `_redis_client` 全局变量无线程安全保护
- **修复**: 使用 `functools.lru_cache` 或添加锁保护

### MEDIUM-13: saleor.py 启动时创建客户端
- **文件**: `fastapi/app/services/saleor.py:28-29`
- **问题**: 模块级创建 GraphQL 客户端，URL 不可达时启动失败
- **修复**: 改为懒加载模式

---

## 3. 配置一致性检测

### MEDIUM-14: .env.example 中变量与 Settings 不对应
- **文件**: `.env.example:2,7,11,14,15,42-43,56`
- **问题**: `SALEOR_DB_PASSWORD`、`FASTAPI_DB_PASSWORD`、`REDIS_PASSWORD`、`SECRET_KEY`、`ALLOWED_HOSTS`、`DOMAIN`、`API_DOMAIN`、`MEILI_MASTER_KEY` 在 Settings 中无对应字段
- **修复**: 添加注释说明这些变量用于 docker-compose/Saleor，FastAPI Settings 通过 `extra="ignore"` 忽略

### MEDIUM-15: docker-compose 与 .env.example DATABASE_URL 驱动不一致
- **文件**: `docker-compose.yml:47` vs `.env.example:3`
- **问题**: docker-compose 使用 `postgresql+asyncpg://`，.env.example 使用 `postgresql://`
- **修复**: 在 `.env.example` 中添加注释说明 FastAPI 的 DATABASE_URL 由 docker-compose 构造

### MEDIUM-16: alembic.ini 占位符
- **文件**: `fastapi/alembic.ini:4`
- **问题**: 回退值使用弱密码占位符 `changeme`
- **修复**: 改为 `<DATABASE_URL>` 或空字符串

---

## 4. 部署配置检测

### MEDIUM-17: nginx 缺少 HSTS 和 CSP 头
- **文件**: `nginx/nginx.conf:70-74`
- **问题**: 缺少 `Strict-Transport-Security` 和 `Content-Security-Policy` 头
- **修复**: 添加 HSTS 和 CSP 安全头

### MEDIUM-18: CI/CD 缺少安全扫描
- **文件**: `.github/workflows/deploy.yml`
- **问题**: 缺少 `pip audit`、`npm audit` 等依赖安全扫描步骤
- **修复**: 添加安全扫描 job

---

## 5. 依赖安全检测

### HIGH-4: python-multipart 已知漏洞
- **文件**: `fastapi/requirements.txt:12`
- **问题**: `python-multipart==0.0.*` 存在 CVE-2024-24762 (ReDoS 拒绝服务)
- **修复**: 升级到 `python-multipart>=0.0.7`

### HIGH-5: 依赖版本未锁定
- **文件**: `fastapi/requirements.txt`
- **问题**: 使用通配符版本（`fastapi==0.115.*`），构建不可重现
- **修复**: 使用 `pip-compile` 生成锁定的 requirements.txt

### HIGH-6: 前端硬编码域名和联系信息
- **文件**: 15+ 处（layout.tsx、products/[slug]/page.tsx、Footer.tsx、contact/page.tsx 等）
- **问题**: `yourdomain.com`、`info@yourdomain.com`、`+86 138-0013-8000` 硬编码
- **修复**: 使用 `NEXT_PUBLIC_SITE_URL` 等环境变量统一管理

---

## 6. 额外发现

### LOW 级别问题清单

| # | 问题 | 文件 | 修复建议 |
|---|------|------|---------|
| 1 | `api/__init__.py` 未导出 `auth_router` | `fastapi/app/api/__init__.py` | 添加导出 |
| 2 | `InquiryButton.tsx` 三元表达式两分支相同 | `frontend/components/product/InquiryButton.tsx:21` | 简化表达式 |
| 3 | `products/page.tsx` hack 翻译替换 | `frontend/app/[locale]/products/page.tsx:30` | 添加专用翻译键 |
| 4 | `CookieConsent` key 无版本管理 | `frontend/components/shared/CookieConsent.tsx:7` | 添加版本号 |
| 5 | `about/page.tsx` 大量内容硬编码 | `frontend/app/[locale]/about/page.tsx:29-49` | 移至翻译文件 |
| 6 | `privacy/page.tsx` 全文硬编码 | `frontend/app/[locale]/privacy/page.tsx:23-76` | 移至翻译文件或 CMS |
| 7 | `LOCALE_TO_LANG_CODE` 映射与实际 locale 不一致 | `frontend/lib/saleor.ts:13-24` | 添加注释说明 |
| 8 | CI/CD 缺少 TypeScript 类型检查 | `.github/workflows/deploy.yml` | 添加 `npx tsc --noEmit` |
| 9 | CI/CD 缺少测试覆盖率 | `.github/workflows/deploy.yml` | 添加 `--cov` 参数 |
| 10 | CI/CD 缺少迁移回滚机制 | `.github/workflows/deploy.yml` | 添加回滚步骤 |
| 11 | 缺少 `package-lock.json` | `frontend/` | 运行 `npm install` 生成 |
| 12 | nginx `server_name` 占位符 | `nginx/nginx.conf:62` | 部署时替换 |
| 13 | nginx 缺少 `Permissions-Policy` 头 | `nginx/nginx.conf` | 添加 |
| 14 | vercel.json 缺少 HSTS | `frontend/vercel.json` | 添加 |
