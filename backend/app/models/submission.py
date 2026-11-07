"""Submission and EloHistory models."""

import uuid
from sqlalchemy import ForeignKey, Integer, String, Text, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Submission(BaseModel):
    """A code submission by a user during a match."""

    __tablename__ = "submissions"

    match_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    problem_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("problems.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # python, cpp, javascript
    verdict: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
        index=True,
    )  # pending, accepted, wrong_answer, time_limit, runtime_error, compilation_error
    runtime_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tests_passed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    match = relationship("Match", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Submission user={self.user_id} verdict={self.verdict}>"


class EloHistory(BaseModel):
    """Records ELO rating changes after each match."""

    __tablename__ = "elo_history"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    new_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    user = relationship("User", back_populates="elo_history")
    match = relationship("Match", lazy="selectin")

    def __repr__(self) -> str:
        return f"<EloHistory user={self.user_id} delta={self.delta}>"
