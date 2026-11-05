"""Pydantic schemas for problem-related responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class TestCaseResponse(BaseModel):
    """A single test case (sample only)."""

    id: uuid.UUID
    input: str
    expected_output: str
    is_sample: bool

    model_config = {"from_attributes": True}


class ProblemResponse(BaseModel):
    """Full problem detail with sample test cases."""

    id: uuid.UUID
    title: str
    description: str
    difficulty: str
    constraints: str | None = None
    examples: dict | list | None = None
    time_limit_seconds: float
    memory_limit_mb: int
    starter_code: dict | None = None
    test_cases: list[TestCaseResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemListItem(BaseModel):
    """Brief problem info for list views."""

    id: uuid.UUID
    title: str
    difficulty: str
    time_limit_seconds: float
    memory_limit_mb: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProblemListResponse(BaseModel):
    """Paginated list of problems."""

    problems: list[ProblemListItem]
    total: int
    page: int
    page_size: int
