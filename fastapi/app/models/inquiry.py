"""询盘 ORM 模型"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class InquiryStatus(str, enum.Enum):
    NEW = "new"
    REPLIED = "replied"
    QUOTED = "quoted"
    CONVERTED = "converted"
    CLOSED = "closed"


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    saleor_product_id = Column(String(255), nullable=True, index=True)
    product_name = Column(String(500), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)
    customer_phone = Column(String(50), nullable=True)
    customer_company = Column(String(500), nullable=True)
    quantity = Column(String(255), nullable=True)
    delivery_deadline = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(
        Enum(InquiryStatus, name="inquiry_status", create_constraint=True),
        nullable=False,
        default=InquiryStatus.NEW,
        index=True,
    )
    language = Column(String(10), nullable=False, default="en")
    source_url = Column(String(1024), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    replied_at = Column(DateTime(timezone=True), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
