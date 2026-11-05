"""Router for global leaderboard rankings."""

from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch global leaderboard sorted by ELO rating."""
    stmt = (
        select(User)
        .where(User.is_active == True)
        .order_by(desc(User.elo_rating), desc(User.wins))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    start_rank = (page - 1) * page_size + 1
    leaderboard = [
        {
            "rank": start_rank + idx,
            "user": UserResponse.model_validate(u),
        }
        for idx, u in enumerate(users)
    ]

    return {"leaderboard": leaderboard, "page": page, "page_size": page_size}


@router.get("/top")
async def get_top_users(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch top N users for quick display."""
    stmt = (
        select(User)
        .where(User.is_active == True)
        .order_by(desc(User.elo_rating), desc(User.wins))
        .limit(limit)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    return [
        {
            "rank": idx + 1,
            "user": UserResponse.model_validate(u),
        }
        for idx, u in enumerate(users)
    ]
