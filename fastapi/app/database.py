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


async def get_db():
    """FastAPI 依赖：获取异步数据库会话"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
