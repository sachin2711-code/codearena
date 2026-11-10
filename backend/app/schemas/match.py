"""Pydantic schemas for match-related responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel

from app.schemas.user import UserResponse


class MatchResponse(BaseModel):
    """Full match detail."""

    id: uuid.UUID
    player1_id: uuid.UUID
    player2_id: uuid.UUID
    problem_id: uuid.UUID | None = None
    problem_title: str | None = None
    opponent_username: str | None = None
    winner_id: uuid.UUID | None = None
    status: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchDetailResponse(BaseModel):
    """Match detail with player information."""

    id: uuid.UUID
    player1: UserResponse | None = None
    player2: UserResponse | None = None
    problem_id: uuid.UUID | None = None
    winner_id: uuid.UUID | None = None
    status: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchHistoryResponse(BaseModel):
    """Paginated match history."""

    matches: list[MatchResponse]
    total: int
    page: int
    page_size: int
