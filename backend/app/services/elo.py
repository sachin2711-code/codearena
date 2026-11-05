"""ELO rating service using standard chess K=32 formula."""

import math
import uuid
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.submission import EloHistory

logger = logging.getLogger(__name__)

K_FACTOR = 32


class EloService:
    """Calculate and apply ELO rating changes after matches."""

    @staticmethod
    def calculate_expected(rating_a: int, rating_b: int) -> float:
        """Calculate the expected score for player A against player B.

        Uses the standard ELO expected score formula:
            E_A = 1 / (1 + 10^((R_B - R_A) / 400))

        Args:
            rating_a: Player A's current ELO rating.
            rating_b: Player B's current ELO rating.

        Returns:
            Expected score for player A (between 0.0 and 1.0).
        """
        return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))

    @staticmethod
    def calculate_elo_change(
        rating_a: int,
        rating_b: int,
        actual_score_a: float,
    ) -> int:
        """Calculate the ELO rating change for player A.

        Args:
            rating_a: Player A's current rating.
            rating_b: Player B's current rating.
            actual_score_a: Actual result for A (1.0=win, 0.5=draw, 0.0=loss).

        Returns:
            Rating change delta (can be negative).
        """
        expected_a = EloService.calculate_expected(rating_a, rating_b)
        delta = round(K_FACTOR * (actual_score_a - expected_a))
        return delta

    @staticmethod
    async def update_ratings(
        db: AsyncSession,
        match_id: uuid.UUID,
        player1_id: uuid.UUID,
        player2_id: uuid.UUID,
        winner_id: uuid.UUID | None,
    ) -> tuple[int, int]:
        """Update ELO ratings for both players after a match.

        Args:
            db: Async database session.
            match_id: The match that just concluded.
            player1_id: First player's user ID.
            player2_id: Second player's user ID.
            winner_id: Winner's user ID, or None for a draw.

        Returns:
            Tuple of (player1_new_rating, player2_new_rating).
        """
        # Fetch both players
        result1 = await db.execute(select(User).where(User.id == player1_id))
        player1 = result1.scalar_one()

        result2 = await db.execute(select(User).where(User.id == player2_id))
        player2 = result2.scalar_one()

        old_rating1 = player1.elo_rating
        old_rating2 = player2.elo_rating

        # Determine actual scores
        if winner_id is None:
            # Draw
            score1 = 0.5
            score2 = 0.5
            player1.draws += 1
            player2.draws += 1
        elif winner_id == player1_id:
            score1 = 1.0
            score2 = 0.0
            player1.wins += 1
            player2.losses += 1
        else:
            score1 = 0.0
            score2 = 1.0
            player1.losses += 1
            player2.wins += 1

        # Calculate deltas
        delta1 = EloService.calculate_elo_change(old_rating1, old_rating2, score1)
        delta2 = EloService.calculate_elo_change(old_rating2, old_rating1, score2)

        # Apply new ratings (floor at 100)
        player1.elo_rating = max(100, old_rating1 + delta1)
        player2.elo_rating = max(100, old_rating2 + delta2)

        # Record ELO history for both players
        elo_record1 = EloHistory(
            user_id=player1_id,
            match_id=match_id,
            old_rating=old_rating1,
            new_rating=player1.elo_rating,
            delta=delta1,
        )
        elo_record2 = EloHistory(
            user_id=player2_id,
            match_id=match_id,
            old_rating=old_rating2,
            new_rating=player2.elo_rating,
            delta=delta2,
        )

        db.add(elo_record1)
        db.add(elo_record2)
        await db.flush()

        logger.info(
            f"ELO updated: P1({player1.username}) {old_rating1}->{player1.elo_rating} (Δ{delta1}), "
            f"P2({player2.username}) {old_rating2}->{player2.elo_rating} (Δ{delta2})"
        )

        return player1.elo_rating, player2.elo_rating


# Singleton instance
elo_service = EloService()

