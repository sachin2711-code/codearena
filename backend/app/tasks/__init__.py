"""Tasks package."""

from app.tasks.celery_app import celery
from app.tasks.execute_code import run_submission

__all__ = ["celery", "run_submission"]
