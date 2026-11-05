"""API routers package."""

from app.routers.auth import router as auth_router
from app.routers.problems import router as problems_router
from app.routers.matches import router as matches_router
from app.routers.leaderboard import router as leaderboard_router

__all__ = ["auth_router", "problems_router", "matches_router", "leaderboard_router"]
