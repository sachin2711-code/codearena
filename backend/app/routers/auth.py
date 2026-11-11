"""Authentication router for Google OAuth, dev login, and user profile."""

import uuid
from typing import Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.match import Match
from app.models.submission import Submission
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


class GitHubLoginRequest(BaseModel):
    code: str


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


@router.post("/github", response_model=TokenResponse)
async def github_login(
    payload: GitHubLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Exchange GitHub OAuth authorization code for CodeArena JWT."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured on the server",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": payload.code,
                },
            )
            if token_resp.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to obtain GitHub token")

            token_json = token_resp.json()
            gh_access_token = token_json.get("access_token")
            if not gh_access_token:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=token_json.get("error_description", "Invalid GitHub code"))

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {gh_access_token}", "User-Agent": "CodeArena-App"},
            )
            if user_resp.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to fetch GitHub profile")
            gh_user = user_resp.json()

            email = gh_user.get("email")
            if not email:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {gh_access_token}", "User-Agent": "CodeArena-App"},
                )
                if emails_resp.status_code == 200:
                    for em in emails_resp.json():
                        if em.get("primary") and em.get("verified"):
                            email = em.get("email")
                            break

            username = gh_user.get("login") or f"user_{uuid.uuid4().hex[:8]}"
            email = email or f"{username}@users.noreply.github.com"
            avatar = gh_user.get("avatar_url")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"GitHub OAuth error: {exc}")

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=username[:50],
            email=email,
            avatar_url=avatar,
            elo_rating=1200,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif avatar and not user.avatar_url:
        user.avatar_url = avatar
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
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return the authenticated user's detailed profile with self-healing stats from DB."""
    # 1. Total matches played by this user
    match_filter = or_(
        Match.player1_id == current_user.id,
        Match.player2_id == current_user.id,
    )
    total_res = await db.execute(select(func.count(Match.id)).where(match_filter))
    db_total_matches = total_res.scalar() or 0

    # 2. Total completed wins
    wins_res = await db.execute(
        select(func.count(Match.id)).where(
            Match.winner_id == current_user.id,
            Match.status == "completed",
        )
    )
    db_wins = wins_res.scalar() or 0

    # 3. Solved problems count (distinct problems solved with accepted verdict)
    solved_res = await db.execute(
        select(func.count(func.distinct(Submission.problem_id))).where(
            Submission.user_id == current_user.id,
            Submission.verdict == "accepted",
        )
    )
    db_solved = solved_res.scalar() or 0

    # 4. Losses: completed matches where winner != current_user.id and winner is not null
    losses_res = await db.execute(
        select(func.count(Match.id)).where(
            match_filter,
            Match.status == "completed",
            Match.winner_id != current_user.id,
            Match.winner_id.isnot(None),
        )
    )
    db_losses = losses_res.scalar() or 0

    # Combine recorded user table stats with DB query stats to never lose past matches
    effective_wins = max(current_user.wins, db_wins)
    effective_losses = max(current_user.losses, db_losses)
    effective_total = max(current_user.wins + current_user.losses + current_user.draws, db_total_matches)
    effective_solved = max(effective_wins, db_solved)

    # Self-heal user record in DB if values differ
    if current_user.wins != effective_wins or current_user.losses != effective_losses:
        current_user.wins = effective_wins
        current_user.losses = effective_losses
        await db.commit()

    win_rate = (effective_wins / effective_total * 100.0) if effective_total > 0 else 0.0

    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        elo_rating=current_user.elo_rating,
        wins=effective_wins,
        losses=effective_losses,
        draws=current_user.draws,
        avatar_url=current_user.avatar_url,
        total_matches=effective_total,
        win_rate=round(win_rate, 1),
        solved_problems=effective_solved,
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
