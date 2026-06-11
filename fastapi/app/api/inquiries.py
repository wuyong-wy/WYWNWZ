"""询盘 API 端点"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import require_admin
from app.database import get_db
from app.models.inquiry import Inquiry, InquiryStatus
from app.schemas.inquiry import (
    InquiryCreate,
    InquiryListResponse,
    InquiryResponse,
    InquiryStatusUpdate,
)
from app.tasks.email import send_admin_notification, send_inquiry_auto_reply

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("/", response_model=dict, status_code=201)
async def create_inquiry(
    inquiry: InquiryCreate,
    db: AsyncSession = Depends(get_db),
):
    """提交询盘（公开端点，无需认证）"""
    db_inquiry = Inquiry(**inquiry.model_dump())
    db.add(db_inquiry)
    await db.commit()
    await db.refresh(db_inquiry)

    inquiry_id = str(db_inquiry.id)

    # 事务提交后再触发 Celery 任务，确保 worker 能查到记录
    send_inquiry_auto_reply.delay(inquiry_id)
    send_admin_notification.delay(inquiry_id)

    return {"success": True, "inquiry_id": inquiry_id}


@router.get("/", response_model=InquiryListResponse)
async def list_inquiries(
    status: InquiryStatus | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """查询询盘列表（管理员端点，需认证）"""
    base_query = select(Inquiry)
    count_query = select(func.count()).select_from(Inquiry)

    if status:
        base_query = base_query.where(Inquiry.status == status)
        count_query = count_query.where(Inquiry.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    items_query = (
        base_query.order_by(Inquiry.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(items_query)
    items = result.scalars().all()

    return InquiryListResponse(
        data=[InquiryResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry(
    inquiry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """查询询盘详情（管理员端点，需认证）"""
    result = await db.execute(select(Inquiry).where(Inquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return InquiryResponse.model_validate(inquiry)


@router.patch("/{inquiry_id}/status", response_model=dict)
async def update_inquiry_status(
    inquiry_id: uuid.UUID,
    body: InquiryStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """更新询盘状态（管理员端点，需认证）"""
    result = await db.execute(select(Inquiry).where(Inquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    inquiry.status = body.status
    if body.status == InquiryStatus.REPLIED and inquiry.replied_at is None:
        inquiry.replied_at = datetime.now(timezone.utc)

    await db.flush()

    return {"success": True, "status": body.status.value}


@router.delete("/{inquiry_id}", status_code=204)
async def delete_inquiry(
    inquiry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """删除询盘（GDPR Right to be forgotten，管理员端点，需认证）"""
    result = await db.execute(select(Inquiry).where(Inquiry.id == inquiry_id))
    inquiry = result.scalar_one_or_none()

    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    await db.delete(inquiry)
