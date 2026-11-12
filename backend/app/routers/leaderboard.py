"""Router for global and campus department leaderboard rankings."""

from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import DepartmentStanding, UserResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
async def get_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    branch: str | None = Query(None, description="Filter by department/branch (e.g. CSE, IT, ECE)"),
    graduation_year: str | None = Query(None, description="Filter by graduation year (e.g. 1st Year, 2nd Year)"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch leaderboard sorted by ELO rating with optional branch/year filters."""
    conditions = [User.is_active == True]
    if branch and branch.upper() != "ALL":
        conditions.append(func.upper(User.branch) == branch.upper())
    if graduation_year and graduation_year.upper() != "ALL":
        conditions.append(func.upper(User.graduation_year) == graduation_year.upper())

    count_stmt = select(func.count(User.id)).where(*conditions)
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    stmt = (
        select(User)
        .where(*conditions)
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

    return {
        "leaderboard": leaderboard,
        "total": total_count,
        "page": page,
        "page_size": page_size,
    }


@router.get("/departments", response_model=list[DepartmentStanding])
async def get_department_standings(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Aggregate department standings (branch vs branch rivalry)."""
    # Group by branch
    stmt = (
        select(
            User.branch,
            func.count(User.id).label("student_count"),
            func.avg(User.elo_rating).label("avg_elo"),
            func.sum(User.wins).label("total_wins"),
        )
        .where(User.is_active == True, User.branch.isnot(None))
        .group_by(User.branch)
        .order_by(desc("avg_elo"), desc("total_wins"))
    )
    res = await db.execute(stmt)
    rows = res.all()

    departments = []
    for r in rows:
        branch_name = r[0] or "General"
        # Find top player for this branch
        top_user_stmt = (
            select(User.username)
            .where(User.is_active == True, User.branch == branch_name)
            .order_by(desc(User.elo_rating), desc(User.wins))
            .limit(1)
        )
        top_user_res = await db.execute(top_user_stmt)
        top_user = top_user_res.scalar_one_or_none() or "N/A"

        departments.append(
            DepartmentStanding(
                branch=branch_name,
                student_count=int(r[1] or 0),
                avg_elo=int(round(r[2] or 1200)),
                total_wins=int(r[3] or 0),
                top_player=top_user,
            )
        )

    # Ensure popular branches are displayed even if few users exist initially
    existing_branches = {d.branch.upper() for d in departments}
    defaults = ["CSE", "IT", "ECE", "AIML", "MECH"]
    for d in defaults:
        if d not in existing_branches:
            departments.append(
                DepartmentStanding(
                    branch=d,
                    student_count=0,
                    avg_elo=1200,
                    total_wins=0,
                    top_player=None,
                )
            )

    departments.sort(key=lambda x: (x.avg_elo, x.total_wins, x.student_count), reverse=True)
    return departments


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
