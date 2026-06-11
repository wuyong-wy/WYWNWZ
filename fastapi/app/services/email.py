"""Brevo 邮件发送服务封装 — 支持 async（FastAPI）和 sync（Celery）双模式"""

import httpx
import structlog

from app.config import settings

logger = structlog.get_logger()


def _build_payload(
    to_email: str,
    template_id: int | None = None,
    subject: str | None = None,
    html_content: str | None = None,
    params: dict | None = None,
    sender_email: str | None = None,
    sender_name: str = "Foreign Trade Site",
) -> dict | None:
    """构建 Brevo API 请求体（async 和 sync 共用）"""
    if not settings.BREVO_API_KEY:
        logger.warning("brevo_api_key_missing", to=to_email)
        return None

    payload: dict = {
        "sender": {
            "email": sender_email or settings.ADMIN_EMAIL,
            "name": sender_name,
        },
        "to": [{"email": to_email}],
    }

    if template_id:
        payload["templateId"] = template_id
        if params:
            payload["params"] = params
    elif subject and html_content:
        payload["subject"] = subject
        payload["htmlContent"] = html_content
    else:
        logger.error("brevo_invalid_payload", to=to_email)
        return None

    return payload


async def brevo_send(
    to_email: str,
    template_id: int | None = None,
    subject: str | None = None,
    html_content: str | None = None,
    params: dict | None = None,
    sender_email: str | None = None,
    sender_name: str = "Foreign Trade Site",
) -> bool:
    """
    通过 Brevo HTTP API 发送邮件（异步版 — 供 FastAPI 端点使用）

    支持两种模式：
    1. 模板模式：指定 template_id + params
    2. 自定义模式：指定 subject + html_content
    """
    payload = _build_payload(
        to_email=to_email,
        template_id=template_id,
        subject=subject,
        html_content=html_content,
        params=params,
        sender_email=sender_email,
        sender_name=sender_name,
    )
    if payload is None:
        return False

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.BREVO_API_URL}/smtp/email",
                json=payload,
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            logger.info("brevo_email_sent", to=to_email, template_id=template_id)
            return True
    except httpx.HTTPStatusError as e:
        logger.error(
            "brevo_http_error",
            to=to_email,
            status=e.response.status_code,
            body=e.response.text,
        )
        return False
    except httpx.RequestError as e:
        logger.error("brevo_request_error", to=to_email, error=str(e))
        return False


def brevo_send_sync(
    to_email: str,
    template_id: int | None = None,
    subject: str | None = None,
    html_content: str | None = None,
    params: dict | None = None,
    sender_email: str | None = None,
    sender_name: str = "Foreign Trade Site",
) -> bool:
    """
    通过 Brevo HTTP API 发送邮件（同步版 — 供 Celery worker 使用）

    支持两种模式：
    1. 模板模式：指定 template_id + params
    2. 自定义模式：指定 subject + html_content
    """
    payload = _build_payload(
        to_email=to_email,
        template_id=template_id,
        subject=subject,
        html_content=html_content,
        params=params,
        sender_email=sender_email,
        sender_name=sender_name,
    )
    if payload is None:
        return False

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{settings.BREVO_API_URL}/smtp/email",
                json=payload,
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            logger.info("brevo_email_sent_sync", to=to_email, template_id=template_id)
            return True
    except httpx.HTTPStatusError as e:
        logger.error(
            "brevo_http_error",
            to=to_email,
            status=e.response.status_code,
            body=e.response.text,
        )
        return False
    except httpx.RequestError as e:
        logger.error("brevo_request_error", to=to_email, error=str(e))
        return False
