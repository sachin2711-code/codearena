"""Match model for 1v1 battles."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Match(BaseModel):
    """A 1v1 competitive coding match between two players."""

    __tablename__ = "matches"

    player1_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    player2_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    problem_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    winner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="waiting",
        nullable=False,
        index=True,
    )  # waiting, active, completed, cancelled
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    # Relationships
    player1 = relationship("User", foreign_keys=[player1_id], lazy="selectin")
    player2 = relationship("User", foreign_keys=[player2_id], lazy="selectin")
    problem = relationship("Problem", lazy="selectin")
    winner = relationship("User", foreign_keys=[winner_id], lazy="selectin")
    submissions = relationship("Submission", back_populates="match", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Match {self.id} status={self.status}>"
