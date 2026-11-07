"""User model for CodeArena players."""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class User(BaseModel):
    """A registered CodeArena user."""

    __tablename__ = "users"

    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    elo_rating: Mapped[int] = mapped_column(
        Integer, default=1200, nullable=False
    )
    wins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    losses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    draws: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Relationships
    submissions = relationship("Submission", back_populates="user", lazy="selectin")
    elo_history = relationship("EloHistory", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.username} (ELO={self.elo_rating})>"
