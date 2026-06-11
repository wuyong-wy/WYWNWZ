"""SQLAlchemy async 数据库引擎和会话管理"""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# 同步引擎 — 供 Celery worker 使用
_sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
sync_engine = create_engine(
    _sync_url,
    pool_pre_ping=True,
    pool_size=5,
)
SyncSession = sessionmaker(sync_engine, class_=Session, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# 需要 commit 的 HTTP 方法
_WRITE_METHODS = frozenset({"POST", "PATCH", "PUT", "DELETE"})


async def get_db(request=None):
    """
    FastAPI 依赖：获取异步数据库会话

    仅在写操作（POST/PATCH/PUT/DELETE）时自动 commit，
    GET 等只读请求跳过 commit 以减少不必要的数据库往返。
    可通过传入 Request 对象或 callable 来检测请求方法。
    """
    async with async_session() as session:
        try:
            yield session
            # 有 request 时按方法判断，无 request 时保守 commit（兼容旧代码）
            if request is None or (
                hasattr(request, "method") and request.method in _WRITE_METHODS
            ):
                await session.commit()
        except Exception:
            await session.rollback()
            raise
