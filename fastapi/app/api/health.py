"""健康检查端点 — 检测 DB 和 Redis 连通性"""

from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import async_session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """健康检查"""
    checks: dict = {"status": "ok", "database": "ok", "redis": "ok"}

    # 数据库检查
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        checks["database"] = "unavailable"
        checks["status"] = "degraded"

    # Redis 检查
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.close()
    except Exception:
        checks["redis"] = "unavailable"
        checks["status"] = "degraded"

    return checks
