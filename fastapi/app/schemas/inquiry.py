"""询盘 Pydantic Schema — 请求/响应数据校验"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, HttpUrl

from app.models.inquiry import InquiryStatus


# === 请求 Schema ===

class InquiryCreate(BaseModel):
    """提交询盘请求"""
    saleor_product_id: str | None = Field(None, max_length=255, description="Saleor 产品 GraphQL ID")
    product_name: str | None = Field(None, max_length=500, description="产品名称")
    customer_name: str = Field(..., min_length=1, max_length=255, description="客户姓名")
    customer_email: EmailStr = Field(..., description="客户邮箱")
    customer_phone: str | None = Field(None, max_length=50, description="客户电话")
    customer_company: str | None = Field(None, max_length=500, description="客户公司")
    quantity: str | None = Field(None, max_length=255, description="采购量描述")
    delivery_deadline: str | None = Field(None, max_length=255, description="交货期描述")
    message: str | None = Field(None, description="客户留言")
    language: str = Field("en", max_length=10, description="ISO 639-1 语言代码")
    source_url: str | None = Field(None, max_length=1024, description="询盘来源页面 URL")


class InquiryStatusUpdate(BaseModel):
    """更新询盘状态"""
    status: InquiryStatus


# === 响应 Schema ===

class InquiryResponse(BaseModel):
    """询盘详情响应"""
    id: uuid.UUID
    saleor_product_id: str | None
    product_name: str | None
    customer_name: str
    customer_email: str
    customer_phone: str | None
    customer_company: str | None
    quantity: str | None
    delivery_deadline: str | None
    message: str | None
    status: InquiryStatus
    language: str
    source_url: str | None
    created_at: datetime
    replied_at: datetime | None
    is_read: bool

    model_config = {"from_attributes": True}


class InquiryListResponse(BaseModel):
    """询盘分页列表响应"""
    data: list[InquiryResponse]
    total: int
    page: int
    limit: int
