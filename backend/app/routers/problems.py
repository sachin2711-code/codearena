"""Router for problem endpoints."""

import random
import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.problem import Problem, TestCase
from app.schemas.problem import ProblemListItem, ProblemListResponse, ProblemResponse, TestCaseResponse
from app.services.leetcode import leetcode_service

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=ProblemListResponse)
async def list_problems(
    difficulty: str | None = Query(None, regex="^(easy|medium|hard)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List problems with optional difficulty filtering and pagination."""
    query = select(Problem)
    if difficulty:
        query = query.where(Problem.difficulty == difficulty)

    count_query = select(func.count(Problem.id))
    if difficulty:
        count_query = count_query.where(Problem.difficulty == difficulty)

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    query = query.order_by(Problem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    problems = result.scalars().all()

    items = [
        ProblemListItem(
            id=p.id,
            title=p.title,
            difficulty=p.difficulty,
            time_limit_seconds=p.time_limit_seconds,
            memory_limit_mb=p.memory_limit_mb,
            created_at=p.created_at,
        )
        for p in problems
    ]

    return ProblemListResponse(
        problems=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/random", response_model=ProblemResponse)
async def get_random_problem(
    difficulty: str | None = Query(None, regex="^(easy|medium|hard)$"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Dynamically fetch a random problem from LeetCode."""
    chosen = await leetcode_service.get_or_create_random_problem(db, difficulty)
    sample_tests = [
        TestCaseResponse(
            id=tc.id,
            input=tc.input,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample,
        )
        for tc in chosen.test_cases
        if tc.is_sample
    ]

    return ProblemResponse(
        id=chosen.id,
        title=chosen.title,
        description=chosen.description,
        difficulty=chosen.difficulty,
        constraints=chosen.constraints,
        examples=chosen.examples,
        time_limit_seconds=chosen.time_limit_seconds,
        memory_limit_mb=chosen.memory_limit_mb,
        starter_code=chosen.starter_code,
        test_cases=sample_tests,
        created_at=chosen.created_at,
    )


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetch a single problem by ID along with its sample test cases."""
    query = (
        select(Problem)
        .where(Problem.id == problem_id)
        .options(selectinload(Problem.test_cases))
    )
    result = await db.execute(query)
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found",
        )

    sample_tests = [
        TestCaseResponse(
            id=tc.id,
            input=tc.input,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample,
        )
        for tc in problem.test_cases
        if tc.is_sample
    ]

    return ProblemResponse(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        constraints=problem.constraints,
        examples=problem.examples,
        time_limit_seconds=problem.time_limit_seconds,
        memory_limit_mb=problem.memory_limit_mb,
        starter_code=problem.starter_code,
        test_cases=sample_tests,
        created_at=problem.created_at,
    )
