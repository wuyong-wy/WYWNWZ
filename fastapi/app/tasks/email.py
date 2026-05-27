"""Celery 异步邮件任务 — 使用同步数据库会话"""

import structlog
from celery_config import celery_app
from sqlalchemy import select

from app.config import settings
from app.database import SyncSession
from app.models.inquiry import Inquiry
from app.services.email import brevo_send

logger = structlog.get_logger()


def _get_inquiry(inquiry_id: str) -> Inquiry | None:
    """查询询盘记录（同步，供 Celery worker 使用）"""
    with SyncSession() as db:
        result = db.execute(select(Inquiry).where(Inquiry.id == inquiry_id))
        return result.scalar_one_or_none()


@celery_app.task(
    queue="email",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def send_inquiry_auto_reply(self, inquiry_id: str):
    """自动回复询盘客户"""
    inquiry = _get_inquiry(inquiry_id)
    if not inquiry:
        logger.warning("inquiry_not_found", inquiry_id=inquiry_id)
        return

    template_id = 2 if inquiry.language == "zh" else 1

    success = brevo_send(
        to_email=inquiry.customer_email,
        template_id=template_id,
        params={
            "customer_name": inquiry.customer_name,
            "product_name": inquiry.product_name or "your inquiry",
        },
    )

    if not success:
        raise self.retry(exc=Exception("Brevo send failed"))


@celery_app.task(
    queue="email",
    bind=True,
    max_retries=3,
    default_retry_delay=300,
)
def send_admin_notification(self, inquiry_id: str):
    """通知管理员有新询盘"""
    inquiry = _get_inquiry(inquiry_id)
    if not inquiry:
        logger.warning("inquiry_not_found", inquiry_id=inquiry_id)
        return

    success = brevo_send(
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
