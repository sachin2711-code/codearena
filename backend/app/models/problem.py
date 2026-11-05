"""Problem and TestCase models."""

import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Problem(BaseModel):
    """A coding problem for matches."""

    __tablename__ = "problems"

    title: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # easy, medium, hard
    constraints: Mapped[str] = mapped_column(Text, nullable=True)
    examples: Mapped[dict] = mapped_column(JSON, nullable=True)
    time_limit_seconds: Mapped[float] = mapped_column(
        Float, default=2.0, nullable=False
    )
    memory_limit_mb: Mapped[int] = mapped_column(
        Integer, default=256, nullable=False
    )
    starter_code: Mapped[dict] = mapped_column(
        JSON, nullable=True
    )  # {"python": "def ...", "cpp": "...", "javascript": "..."}
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Relationships
    test_cases = relationship(
        "TestCase", back_populates="problem", lazy="selectin", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Problem {self.title} ({self.difficulty})>"


class TestCase(BaseModel):
    """A test case for a problem."""

    __tablename__ = "test_cases"

    problem_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    input: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output: Mapped[str] = mapped_column(Text, nullable=False)
    is_sample: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    problem = relationship("Problem", back_populates="test_cases")

    def __repr__(self) -> str:
        return f"<TestCase problem={self.problem_id} sample={self.is_sample}>"
