"""Authentication router for Google OAuth, dev login, and user profile."""

import uuid
from typing import Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserProfile, UserResponse
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token


class DevLoginRequest(BaseModel):
    username: str
    email: EmailStr


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(
    payload: DevLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Convenient development login endpoint that does not require real Google credentials."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Create user
        user = User(
            username=payload.username,
            email=payload.email,
            google_id=f"dev_{uuid.uuid4().hex[:12]}",
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={payload.username}",
            elo_rating=1200,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id), "username": user.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/google", response_model=TokenResponse)
async def google_login(
    payload: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Verify Google ID token and return CodeArena JWT."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}"
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google credential",
                )
            token_info = resp.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to verify Google token: {str(exc)}",
        )

    google_id = token_info.get("sub")
    email = token_info.get("email")
    name = token_info.get("name") or email.split("@")[0]
    picture = token_info.get("picture")

    stmt = select(User).where(User.google_id == google_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Check if email exists
        stmt_email = select(User).where(User.email == email)
        res_email = await db.execute(stmt_email)
        user = res_email.scalar_one_or_none()

        if user:
            user.google_id = google_id
            if picture and not user.avatar_url:
                user.avatar_url = picture
        else:
            user = User(
                username=name[:50],
                email=email,
                google_id=google_id,
                avatar_url=picture,
                elo_rating=1200,
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id), "username": user.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return the authenticated user's detailed profile."""
    total = current_user.wins + current_user.losses + current_user.draws
    win_rate = (current_user.wins / total * 100.0) if total > 0 else 0.0

    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        elo_rating=current_user.elo_rating,
        wins=current_user.wins,
        losses=current_user.losses,
        draws=current_user.draws,
        avatar_url=current_user.avatar_url,
        total_matches=total,
        win_rate=round(win_rate, 1),
        created_at=current_user.created_at,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Refresh access token using valid refresh token."""
    token_claims = verify_token(payload.refresh_token, token_type="refresh")
    user_id = token_claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )

    stmt = select(User).where(User.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    token_data = {"sub": str(user.id), "username": user.username}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
