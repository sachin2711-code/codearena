"""Matchmaking service using Redis sorted sets for queue management."""

import json
import logging
import random
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.match import Match
from app.models.problem import Problem
from app.models.user import User
from app.services.leetcode import leetcode_service

logger = logging.getLogger(__name__)
settings = get_settings()

MATCHMAKING_QUEUE_KEY = "matchmaking_queue"
MATCHMAKING_DATA_PREFIX = "matchmaking_user:"
ELO_RANGE = 100  # ± elo range for matchmaking


class MatchmakingService:
    """Manages the matchmaking queue and match creation."""

    def __init__(self) -> None:
        """Initialize the Redis connection."""
        self._redis: aioredis.Redis | None = None

    async def get_redis(self) -> aioredis.Redis:
        """Lazy-initialize and return the Redis connection."""
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def add_to_queue(
        self,
        user_id: uuid.UUID,
        elo_rating: int,
        sid: str,
    ) -> bool:
        """Add a user to the matchmaking queue."""
        try:
            r = await self.get_redis()
            user_key = str(user_id)

            # Check if already in queue
            existing = await r.zscore(MATCHMAKING_QUEUE_KEY, user_key)
            if existing is not None:
                logger.info(f"User {user_id} already in matchmaking queue")
                return False

            # Store user data and add to sorted set (score = elo)
            user_data = json.dumps({
                "user_id": str(user_id),
                "elo_rating": elo_rating,
                "sid": sid,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            })
            await r.set(f"{MATCHMAKING_DATA_PREFIX}{user_key}", user_data, ex=300)
            await r.zadd(MATCHMAKING_QUEUE_KEY, {user_key: elo_rating})

            logger.info(f"User {user_id} added to matchmaking queue (ELO={elo_rating})")
            return True
        except Exception as e:
            logger.debug(f"Redis matchmaking queue unavailable: {e}")
            return False

    async def remove_from_queue(self, user_id: uuid.UUID) -> bool:
        """Remove a user from the matchmaking queue."""
        try:
            r = await self.get_redis()
            user_key = str(user_id)
            removed = await r.zrem(MATCHMAKING_QUEUE_KEY, user_key)
            await r.delete(f"{MATCHMAKING_DATA_PREFIX}{user_key}")

            if removed:
                logger.info(f"User {user_id} removed from matchmaking queue")
            return bool(removed)
        except Exception as e:
            logger.debug(f"Redis remove_from_queue skipped: {e}")
            return False

    async def find_opponent(
        self,
        user_id: uuid.UUID,
        elo_rating: int,
    ) -> dict | None:
        """Find a suitable opponent within the ELO range."""
        try:
            r = await self.get_redis()

            min_elo = elo_rating - ELO_RANGE
            max_elo = elo_rating + ELO_RANGE

            # Find candidates in the ELO range
            candidates = await r.zrangebyscore(
                MATCHMAKING_QUEUE_KEY,
                min=min_elo,
                max=max_elo,
            )

            user_key = str(user_id)
            for candidate_key in candidates:
                if candidate_key == user_key:
                    continue  # Skip self

                # Get candidate data
                data_str = await r.get(f"{MATCHMAKING_DATA_PREFIX}{candidate_key}")
                if data_str is None:
                    # Stale entry — clean up
                    await r.zrem(MATCHMAKING_QUEUE_KEY, candidate_key)
                    continue

                candidate_data = json.loads(data_str)
                logger.info(
                    f"Found opponent for {user_id}: {candidate_data['user_id']} "
                    f"(ELO={candidate_data['elo_rating']})"
                )

                # Remove both players from the queue
                await r.zrem(MATCHMAKING_QUEUE_KEY, user_key, candidate_key)
                await r.delete(
                    f"{MATCHMAKING_DATA_PREFIX}{user_key}",
                    f"{MATCHMAKING_DATA_PREFIX}{candidate_key}",
                )

                return candidate_data

            logger.info(f"No opponent found for user {user_id} (ELO={elo_rating})")
            return None
        except Exception as e:
            logger.debug(f"Redis find_opponent skipped: {e}")
            return None

    async def create_match(
        self,
        db: AsyncSession,
        player1_id: uuid.UUID,
        player2_id: uuid.UUID,
    ) -> Match:
        """Create a new match between two players.

        Picks a random problem of appropriate difficulty based on average ELO.

        Args:
            db: Async database session.
            player1_id: First player's user ID.
            player2_id: Second player's user ID.

        Returns:
            The newly created Match object.
        """
        # Fetch both players to determine difficulty
        result1 = await db.execute(select(User).where(User.id == player1_id))
        player1 = result1.scalar_one()

        result2 = await db.execute(select(User).where(User.id == player2_id))
        player2 = result2.scalar_one()

        avg_elo = (player1.elo_rating + player2.elo_rating) / 2

        # Choose difficulty based on average ELO
        if avg_elo < 1000:
            difficulty = "easy"
        elif avg_elo < 1400:
            difficulties = ["easy", "medium"]
            difficulty = random.choice(difficulties)
        elif avg_elo < 1800:
            difficulty = "medium"
        else:
            difficulties = ["medium", "hard"]
            difficulty = random.choice(difficulties)

        # Fetch dynamic live LeetCode problem of that difficulty
        try:
            problem = await leetcode_service.get_or_create_random_problem(db, difficulty)
        except Exception as e:
            logger.warning(f"LeetCode dynamic fetch error: {e}. Falling back to DB.")
            problem_result = await db.execute(
                select(Problem).order_by(func.random()).limit(1)
            )
            problem = problem_result.scalar_one_or_none()

        now = datetime.now(timezone.utc)
        match = Match(
            player1_id=player1_id,
            player2_id=player2_id,
            problem_id=problem.id if problem else None,
            status="active",
            started_at=now,
        )
        db.add(match)
        await db.flush()
        await db.refresh(match)

        logger.info(
            f"Match created: {match.id} | {player1.username} vs {player2.username} | "
            f"Problem: {problem.title if problem else 'N/A'} ({difficulty})"
        )
        return match

    async def get_queue_size(self) -> int:
        """Return the current number of users in the matchmaking queue."""
        r = await self.get_redis()
        return await r.zcard(MATCHMAKING_QUEUE_KEY)

    async def set_reconnect_timer(
        self,
        user_id: uuid.UUID,
        match_id: uuid.UUID,
        timeout: int = 30,
    ) -> None:
        """Set a reconnect timer for a disconnected player.

        If the timer expires without reconnection, the match is forfeited.

        Args:
            user_id: The disconnected user's ID.
            match_id: The active match ID.
            timeout: Seconds to wait before auto-forfeit.
        """
        r = await self.get_redis()
        key = f"reconnect:{user_id}:{match_id}"
        await r.set(key, "disconnected", ex=timeout)
        logger.info(f"Reconnect timer set for user {user_id} in match {match_id} ({timeout}s)")

    async def cancel_reconnect_timer(
        self,
        user_id: uuid.UUID,
        match_id: uuid.UUID,
    ) -> bool:
        """Cancel a reconnect timer (user reconnected in time).

        Returns:
            True if a timer existed and was cancelled.
        """
        r = await self.get_redis()
        key = f"reconnect:{user_id}:{match_id}"
        result = await r.delete(key)
        return bool(result)

    async def close(self) -> None:
        """Close the Redis connection."""
        if self._redis is not None:
            await self._redis.close()
            self._redis = None


# Singleton instance
matchmaking_service = MatchmakingService()
