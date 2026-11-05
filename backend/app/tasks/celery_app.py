"""Celery application instance and configuration."""

from celery import Celery
from app.config import get_settings

settings = get_settings()

celery = Celery(
    "codearena",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=60,
    worker_prefetch_multiplier=1,
)

celery.autodiscover_tasks(["app.tasks.execute_code"])
