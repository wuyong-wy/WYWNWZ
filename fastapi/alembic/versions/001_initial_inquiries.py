"""initial: create inquiries table

Revision ID: 001_initial
Revises:
Create Date: 2026-05-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type
    inquiry_status = postgresql.ENUM(
        "new", "replied", "quoted", "converted", "closed",
        name="inquiry_status",
        create_type=True,
    )
    inquiry_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "inquiries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("saleor_product_id", sa.String(255), nullable=True),
        sa.Column("product_name", sa.String(500), nullable=True),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("customer_email", sa.String(255), nullable=False),
        sa.Column("customer_phone", sa.String(50), nullable=True),
        sa.Column("customer_company", sa.String(500), nullable=True),
        sa.Column("quantity", sa.String(255), nullable=True),
        sa.Column("delivery_deadline", sa.String(255), nullable=True),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("status", inquiry_status, nullable=False, server_default="new"),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("source_url", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("replied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.text("false")),
    )

    # Indexes
    op.create_index("ix_inquiries_saleor_product_id", "inquiries", ["saleor_product_id"])
    op.create_index("ix_inquiries_customer_email", "inquiries", ["customer_email"])
    op.create_index("ix_inquiries_status", "inquiries", ["status"])
    op.create_index("ix_inquiries_created_at", "inquiries", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_inquiries_created_at", table_name="inquiries")
    op.drop_index("ix_inquiries_status", table_name="inquiries")
    op.drop_index("ix_inquiries_customer_email", table_name="inquiries")
    op.drop_index("ix_inquiries_saleor_product_id", table_name="inquiries")
    op.drop_table("inquiries")

    inquiry_status = postgresql.ENUM(name="inquiry_status", create_type=False)
    inquiry_status.drop(op.get_bind(), checkfirst=True)
