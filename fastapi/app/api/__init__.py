"""API 路由导出"""

from app.api.health import router as health_router
from app.api.inquiries import router as inquiries_router

__all__ = ["health_router", "inquiries_router"]
