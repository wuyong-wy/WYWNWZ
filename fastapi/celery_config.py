"""Celery 独立配置 — Worker 不加载 FastAPI 路由和中间件"""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.tasks.email.*": {"queue": "email"},
        # Phase 2 启用 AI 功能时取消注释：
        # "app.tasks.ai.*": {"queue": "ai"},
    },
    beat_schedule={
        # 阶段 2：每日竞品监控
        # "competitor-monitor": {
        #     "task": "app.tasks.competitor.check_competitors",
        #     "schedule": crontab(hour=6, minute=0),
        # },
    },
)

# 自动发现任务模块
celery_app.autodiscover_tasks(["app.tasks"])
