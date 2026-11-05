"""Pydantic schemas for user-related requests and responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a user from Google OAuth data."""

    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=255)
    google_id: str = Field(..., max_length=255)
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """Public user information returned by the API."""

    id: uuid.UUID
    username: str
    email: str
    elo_rating: int
    wins: int
    losses: int
    draws: int
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    """Extended user profile with match history statistics."""

    id: uuid.UUID
    username: str
    email: str
    elo_rating: int
    wins: int
    losses: int
    draws: int
    avatar_url: str | None = None
    total_matches: int = 0
    win_rate: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token pair returned after authentication."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleAuthRequest(BaseModel):
    """Request body for Google OAuth login."""

    credential: str  # Google ID token or authorization code
