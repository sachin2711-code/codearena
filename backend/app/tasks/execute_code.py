"""Celery tasks for executing submissions in sandboxed containers."""

import asyncio
import json
import logging
import uuid
import redis.asyncio as aioredis
from app.config import get_settings
from app.database import async_session_maker
from app.models.submission import Submission
from app.services.judge import judge_service
from app.tasks.celery_app import celery

logger = logging.getLogger(__name__)
settings = get_settings()


async def _async_execute(
    submission_id_str: str,
    code: str,
    language: str,
    problem_id_str: str,
    match_id_str: str,
    user_id_str: str,
    time_limit: float = 2.0,
    memory_limit: int = 256,
) -> dict:
    submission_id = uuid.UUID(submission_id_str)
    problem_id = uuid.UUID(problem_id_str)
    match_id = uuid.UUID(match_id_str)

    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    async def on_progress(test_idx: int, total_tests: int, result):
        # Publish real-time test progress to redis pubsub
        progress_payload = {
            "type": "test_progress",
            "match_id": match_id_str,
            "user_id": user_id_str,
            "test_index": test_idx,
            "total_tests": total_tests,
            "passed": result.passed,
        }
        await redis_client.publish(f"match_events:{match_id_str}", json.dumps(progress_payload))

    async with async_session_maker() as db:
        verdict, results = await judge_service.evaluate_submission(
            db=db,
            submission_id=submission_id,
            code=code,
            language=language,
            problem_id=problem_id,
            time_limit=time_limit,
            memory_limit=memory_limit,
            on_progress=on_progress,
        )

        passed_count = sum(1 for r in results if r.passed)
        total_count = len(results)

        verdict_payload = {
            "type": "verdict",
            "match_id": match_id_str,
            "user_id": user_id_str,
            "submission_id": submission_id_str,
            "verdict": verdict,
            "tests_passed": passed_count,
            "total_tests": total_count,
        }
        await redis_client.publish(f"match_events:{match_id_str}", json.dumps(verdict_payload))

    await redis_client.close()
    return {"verdict": verdict, "tests_passed": passed_count, "total_tests": total_count}


@celery.task(bind=True, name="app.tasks.execute_code.run_submission")
def run_submission(
    self,
    submission_id: str,
    code: str,
    language: str,
    problem_id: str,
    match_id: str,
    user_id: str,
    time_limit: float = 2.0,
    memory_limit: int = 256,
) -> dict:
    """Run code submission in Celery worker."""
    try:
        return asyncio.run(
            _async_execute(
                submission_id_str=submission_id,
                code=code,
                language=language,
                problem_id_str=problem_id,
                match_id_str=match_id,
                user_id_str=user_id,
                time_limit=time_limit,
                memory_limit=memory_limit,
            )
        )
    except Exception as exc:
        logger.error(f"Error in run_submission task: {exc}")
        return {"verdict": "runtime_error", "error": str(exc)}
