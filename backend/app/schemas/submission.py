"""Pydantic schemas for submission-related requests and responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    """Request body when a user submits code."""

    match_id: uuid.UUID
    problem_id: uuid.UUID
    code: str = Field(..., min_length=1)
    language: str = Field(..., pattern=r"^(python|cpp|javascript)$")


class SubmissionResponse(BaseModel):
    """Submission detail returned by the API."""

    id: uuid.UUID
    match_id: uuid.UUID
    user_id: uuid.UUID
    problem_id: uuid.UUID | None = None
    language: str
    verdict: str
    runtime_ms: float | None = None
    memory_kb: int | None = None
    tests_passed: int
    total_tests: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionDetailResponse(BaseModel):
    """Submission with code included (only visible to the author)."""

    id: uuid.UUID
    match_id: uuid.UUID
    user_id: uuid.UUID
    problem_id: uuid.UUID | None = None
    code: str
    language: str
    verdict: str
    runtime_ms: float | None = None
    memory_kb: int | None = None
    tests_passed: int
    total_tests: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VerdictResponse(BaseModel):
    """Verdict emitted after judging a submission."""

    submission_id: uuid.UUID
    verdict: str
    tests_passed: int
    total_tests: int
    runtime_ms: float | None = None
    memory_kb: int | None = None
    details: list[dict] = []


class TestRunRequest(BaseModel):
    """Request body for running code against sample tests only."""

    problem_id: uuid.UUID
    code: str = Field(..., min_length=1)
    language: str = Field(..., pattern=r"^(python|cpp|javascript)$")


class TestRunResult(BaseModel):
    """Result of a single test run."""

    test_index: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    runtime_ms: float | None = None
    error: str | None = None
