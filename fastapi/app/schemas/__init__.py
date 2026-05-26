"""Pydantic Schema 导出"""

from app.schemas.inquiry import (
    InquiryCreate,
    InquiryListResponse,
    InquiryResponse,
    InquiryStatusUpdate,
)

__all__ = [
    "InquiryCreate",
    "InquiryListResponse",
    "InquiryResponse",
    "InquiryStatusUpdate",
]
