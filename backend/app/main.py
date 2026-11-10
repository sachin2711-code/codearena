"""CodeArena main FastAPI application entry point."""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.config import get_settings
from app.database import engine, async_session_maker, Base
from app.models.problem import Problem, TestCase
from app.routers import (
    auth_router,
    problems_router,
    matches_router,
    leaderboard_router,
)
from app.sockets.events import sio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("codearena")
settings = get_settings()


async def seed_default_problems():
    """Seed initial coding problems if database is empty."""
    seed_file = Path(__file__).resolve().parent.parent / "problems" / "seed_problems.json"
    if not seed_file.exists():
        logger.warning(f"Seed file not found at {seed_file}")
        return

    async with async_session_maker() as db:
        from sqlalchemy import select, func
        count_res = await db.execute(select(func.count(Problem.id)))
        if (count_res.scalar() or 0) > 0:
            logger.info("Problems table already populated.")
            return

        logger.info("Seeding default problems into database...")
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        for p_data in data:
            problem = Problem(
                title=p_data["title"],
                description=p_data["description"],
                difficulty=p_data["difficulty"],
                constraints=p_data.get("constraints", ""),
                examples=p_data.get("examples", []),
                time_limit_seconds=p_data.get("time_limit_seconds", 2.0),
                memory_limit_mb=p_data.get("memory_limit_mb", 256),
                starter_code=p_data.get("starter_code", {}),
            )
            db.add(problem)
            await db.flush()

            for tc in p_data.get("test_cases", []):
                test_case = TestCase(
                    problem_id=problem.id,
                    input=tc["input"],
                    expected_output=tc["expected_output"],
                    is_sample=tc.get("is_sample", False),
                )
                db.add(test_case)

        await db.commit()
        logger.info("Default problems seeded successfully!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("Starting up CodeArena...")
    # Create DB tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default problems
    try:
        await seed_default_problems()
    except Exception as exc:
        logger.warning(f"Problem seeding warning: {exc}")

    yield

    logger.info("Shutting down CodeArena...")
    await engine.dispose()


fastapi_app = FastAPI(
    title="CodeArena API",
    description="Real-Time 1v1 Competitive Coding Battle Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        settings.FRONTEND_URL,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
fastapi_app.include_router(auth_router, prefix="/api/v1")
fastapi_app.include_router(problems_router, prefix="/api/v1")
fastapi_app.include_router(matches_router, prefix="/api/v1")
fastapi_app.include_router(leaderboard_router, prefix="/api/v1")


@fastapi_app.get("/")
async def root():
    """Root endpoint for status check."""
    return {"status": "online", "service": "CodeArena API", "version": "1.0.0", "docs": "/docs"}


@fastapi_app.get("/health")
async def health_check():
    """Health check endpoint for container orchestrators."""
    return {"status": "ok", "app": "CodeArena API", "version": "1.0.0"}


# Mount Socket.IO to wrap FastAPI as the main ASGI application
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
