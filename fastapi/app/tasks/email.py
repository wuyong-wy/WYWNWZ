"""Celery 异步邮件任务"""

import asyncio
from datetime import datetime, timezone

from celery_config import celery_app
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.inquiry import Inquiry
from app.services.email import brevo_send

import structlog
logger = structlog.get_logger()


def _get_db_sync():
    """获取同步数据库会话（Celery worker 中使用）"""
    return async_session()


@celery_app.task(
    queue="email",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def send_inquiry_auto_reply(self, inquiry_id: str):
    """自动回复询盘客户"""
    async def _send():
        async with async_session() as db:
            result = await db.execute(
                select(Inquiry).where(Inquiry.id == inquiry_id)
            )
            inquiry = result.scalar_one_or_none()
            if not inquiry:
                logger.warning("inquiry_not_found", inquiry_id=inquiry_id)
                return

            # 根据语言选择模板
            template_id = 2 if inquiry.language == "zh" else 1

            success = await brevo_send(
                to_email=inquiry.customer_email,
                template_id=template_id,
                params={
                    "customer_name": inquiry.customer_name,
                    "product_name": inquiry.product_name or "your inquiry",
                },
            )

            if not success:
                raise self.retry(exc=Exception("Brevo send failed"))

    try:
        asyncio.run(_send())
    except Exception as exc:
        logger.error("auto_reply_failed", inquiry_id=inquiry_id, error=str(exc))
        raise self.retry(exc=exc)


@celery_app.task(
    queue="email",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def send_admin_notification(self, inquiry_id: str):
    """通知管理员有新询盘"""
    async def _send():
        async with async_session() as db:
            result = await db.execute(
                select(Inquiry).where(Inquiry.id == inquiry_id)
            )
            inquiry = result.scalar_one_or_none()
            if not inquiry:
                logger.warning("inquiry_not_found", inquiry_id=inquiry_id)
                return

            success = await brevo_send(
                to_email=settings.ADMIN_EMAIL,
                template_id=3,  # 管理员通知模板
                params={
                    "inquiry_id": str(inquiry.id),
                    "customer_name": inquiry.customer_name,
                    "customer_email": inquiry.customer_email,
                    "product_name": inquiry.product_name or "N/A",
                    "message": inquiry.message or "(no message)",
                    "created_at": inquiry.created_at.isoformat(),
                },
            )

            if not success:
                raise self.retry(exc=Exception("Brevo send failed"))

    try:
        asyncio.run(_send())
    except Exception as exc:
        logger.error("admin_notification_failed", inquiry_id=inquiry_id, error=str(exc))
        raise self.retry(exc=exc)
