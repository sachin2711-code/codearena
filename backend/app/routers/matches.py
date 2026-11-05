"""Router for match history, match details, and AI analysis."""

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.match import Match
from app.models.user import User
from app.schemas.match import MatchDetailResponse, MatchHistoryResponse, MatchResponse
from app.services.ai_analysis import ai_analysis_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/history", response_model=MatchHistoryResponse)
async def get_my_match_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch paginated match history for the authenticated user."""
    filter_condition = or_(
        Match.player1_id == current_user.id,
        Match.player2_id == current_user.id,
    )

    count_stmt = select(func.count(Match.id)).where(filter_condition)
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    stmt = (
        select(Match)
        .where(filter_condition)
        .order_by(Match.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    matches = result.scalars().all()

    items = [
        MatchResponse(
            id=m.id,
            player1_id=m.player1_id,
            player2_id=m.player2_id,
            problem_id=m.problem_id,
            winner_id=m.winner_id,
            status=m.status,
            started_at=m.started_at,
            ended_at=m.ended_at,
            duration_seconds=m.duration_seconds,
            created_at=m.created_at,
        )
        for m in matches
    ]

    return MatchHistoryResponse(
        matches=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match_detail(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch detailed match data including players and problem."""
    stmt = (
        select(Match)
        .where(Match.id == match_id)
        .options(
            selectinload(Match.player1),
            selectinload(Match.player2),
            selectinload(Match.problem),
            selectinload(Match.winner),
        )
    )
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found",
        )

    return MatchDetailResponse.model_validate(match)


@router.get("/{match_id}/analysis")
async def get_match_analysis(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Generate or retrieve Gemini AI analysis of the completed match."""
    stmt = (
        select(Match)
        .where(Match.id == match_id)
        .options(
            selectinload(Match.player1),
            selectinload(Match.player2),
            selectinload(Match.problem),
            selectinload(Match.submissions),
        )
    )
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found",
        )

    # Get latest submission for each player
    p1_subs = [s for s in match.submissions if s.user_id == match.player1_id]
    p2_subs = [s for s in match.submissions if s.user_id == match.player2_id]

    p1_sub = p1_subs[-1] if p1_subs else None
    p2_sub = p2_subs[-1] if p2_subs else None

    analysis = await ai_analysis_service.analyze_match(
        problem_title=match.problem.title if match.problem else "Coding Problem",
        problem_description=match.problem.description if match.problem else "",
        player1_code=p1_sub.code if p1_sub else "# No code submitted",
        player1_language=p1_sub.language if p1_sub else "python",
        player1_verdict=p1_sub.verdict if p1_sub else "none",
        player2_code=p2_sub.code if p2_sub else "# No code submitted",
        player2_language=p2_sub.language if p2_sub else "python",
        player2_verdict=p2_sub.verdict if p2_sub else "none",
    )

    return analysis
