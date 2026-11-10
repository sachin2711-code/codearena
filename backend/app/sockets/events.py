"""Socket.IO event handlers for real-time multiplayer coding battles."""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
import socketio
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import async_session_maker
from app.models.match import Match
from app.models.problem import Problem
from app.models.submission import Submission
from app.models.user import User
from app.services.elo import elo_service
from app.services.judge import judge_service
from app.services.matchmaking import matchmaking_service
from app.tasks.execute_code import run_submission
from app.utils.security import verify_token

logger = logging.getLogger(__name__)
settings = get_settings()

# Setup Socket.IO Async Server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# In-memory mapping of sid -> user_id & user_id -> sid
sid_to_user: dict[str, uuid.UUID] = {}
user_to_sid: dict[str, str] = {}
# Private 1v1 challenge rooms
custom_rooms: dict[str, dict] = {}
# Rate limiting: user_id -> list of timestamps
user_submission_history: dict[str, list[float]] = {}


def register_socket_events(server: socketio.AsyncServer) -> None:
    """Register all Socket.IO event handlers."""

    @server.event
    async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
        """Handle client connection with JWT authentication."""
        token = None
        if auth and "token" in auth:
            token = auth["token"]
        elif "HTTP_AUTHORIZATION" in environ:
            auth_header = environ["HTTP_AUTHORIZATION"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            logger.warning(f"Connection rejected for {sid}: No auth token provided")
            # For development flexibility allow guest connections
            guest_id = uuid.uuid4()
            sid_to_user[sid] = guest_id
            user_to_sid[str(guest_id)] = sid
            return True

        try:
            claims = verify_token(token)
            user_id = uuid.UUID(claims["sub"])
            sid_to_user[sid] = user_id
            user_to_sid[str(user_id)] = sid
            logger.info(f"User {user_id} connected via socket {sid}")
            return True
        except Exception as e:
            logger.error(f"Auth error on connect for {sid}: {e}")
            guest_id = uuid.uuid4()
            sid_to_user[sid] = guest_id
            user_to_sid[str(guest_id)] = sid
            return True

    @server.event
    async def disconnect(sid: str) -> None:
        """Handle client disconnection."""
        user_id = sid_to_user.pop(sid, None)
        if user_id:
            user_to_sid.pop(str(user_id), None)
            try:
                await matchmaking_service.remove_from_queue(user_id)
            except Exception:
                pass
            logger.info(f"User {user_id} disconnected from socket {sid}")

    @server.event
    async def find_match(sid: str, data: dict) -> None:
        """User clicks 'Find Match' to enter matchmaking."""
        user_id = sid_to_user.get(sid)
        if not user_id:
            await server.emit("error", {"message": "Unauthorized"}, to=sid)
            return

        async with async_session_maker() as db:
            user = await db.get(User, user_id)
            elo = user.elo_rating if user else 1200

            # Add to queue
            await matchmaking_service.add_to_queue(user_id, elo, sid)
            await server.emit("queue_joined", {"status": "searching", "elo": elo}, to=sid)

            # Try to match immediately
            opponent_data = await matchmaking_service.find_opponent(user_id, elo)
            if opponent_data:
                opponent_uuid = uuid.UUID(opponent_data["user_id"])
                # Found opponent! Create match in DB
                match = await matchmaking_service.create_match(db, user_id, opponent_uuid)
                if match:
                    room_name = f"match_{match.id}"
                    opp_sid = opponent_data.get("sid") or user_to_sid.get(str(opponent_uuid))

                    await server.enter_room(sid, room_name)
                    if opp_sid:
                        await server.enter_room(opp_sid, room_name)

                    # Fetch problem details
                    problem = await db.get(Problem, match.problem_id)
                    problem_data = {
                        "id": str(problem.id) if problem else "",
                        "title": problem.title if problem else "Two Sum",
                        "description": problem.description if problem else "",
                        "difficulty": problem.difficulty if problem else "medium",
                        "constraints": problem.constraints if problem else "",
                        "examples": problem.examples if problem else [],
                        "time_limit_seconds": problem.time_limit_seconds if problem else 2.0,
                        "starter_code": problem.starter_code if problem else {},
                    }

                    match_payload = {
                        "match_id": str(match.id),
                        "player1_id": str(match.player1_id),
                        "player2_id": str(match.player2_id),
                        "problem": problem_data,
                        "duration_seconds": 900,  # 15 minutes
                    }

                    await server.emit("match_found", match_payload, room=room_name)

    @server.event
    async def cancel_find_match(sid: str) -> None:
        """Cancel queue search."""
        user_id = sid_to_user.get(sid)
        if user_id:
            await matchmaking_service.remove_from_queue(user_id)
            await server.emit("queue_cancelled", {"status": "idle"}, to=sid)

    @server.event
    async def create_custom_room(sid: str, data: dict | None = None) -> None:
        """Create a private 1v1 room for sharing with a friend."""
        user_id = sid_to_user.get(sid)
        if not user_id:
            await server.emit("error", {"message": "Unauthorized"}, to=sid)
            return

        room_code = uuid.uuid4().hex[:6].upper()
        custom_rooms[room_code] = {
            "creator_id": user_id,
            "creator_sid": sid,
            "created_at": asyncio.get_event_loop().time(),
        }
        await server.enter_room(sid, f"private_{room_code}")
        await server.emit("custom_room_created", {"room_code": room_code}, to=sid)
        logger.info(f"Private custom room {room_code} created by user {user_id}")

    @server.event
    async def join_custom_room(sid: str, data: dict) -> None:
        """Join a friend's private custom room using their room code."""
        user_id = sid_to_user.get(sid)
        room_code = (data.get("room_code") or "").strip().upper()

        if not user_id or not room_code:
            await server.emit("error", {"message": "Invalid room request"}, to=sid)
            return

        room = custom_rooms.get(room_code)
        if not room:
            await server.emit("custom_room_error", {"message": "Room not found or expired"}, to=sid)
            return

        creator_id = room["creator_id"]
        creator_sid = room["creator_sid"]

        if str(creator_id) == str(user_id):
            await server.emit("custom_room_error", {"message": "You cannot duel yourself in a private room"}, to=sid)
            return

        # Pop room from custom_rooms
        custom_rooms.pop(room_code, None)

        async with async_session_maker() as db:
            match = await matchmaking_service.create_match(db, creator_id, user_id)
            if match:
                room_name = f"match_{match.id}"
                await server.enter_room(sid, room_name)
                await server.enter_room(creator_sid, room_name)

                problem = await db.get(Problem, match.problem_id)
                problem_data = {
                    "id": str(problem.id) if problem else "",
                    "title": problem.title if problem else "Two Sum",
                    "description": problem.description if problem else "",
                    "difficulty": problem.difficulty if problem else "medium",
                    "constraints": problem.constraints if problem else "",
                    "examples": problem.examples if problem else [],
                    "time_limit_seconds": problem.time_limit_seconds if problem else 2.0,
                    "starter_code": problem.starter_code if problem else {},
                }

                match_payload = {
                    "match_id": str(match.id),
                    "player1_id": str(match.player1_id),
                    "player2_id": str(match.player2_id),
                    "problem": problem_data,
                    "duration_seconds": 900,
                }
                await server.emit("match_found", match_payload, room=room_name)
                logger.info(f"Private match {match.id} launched for {creator_id} vs {user_id}")

    @server.event
    async def join_match_room(sid: str, data: dict) -> None:
        """Join a specific match room."""
        match_id = data.get("match_id")
        if match_id:
            room = f"match_{match_id}"
            await server.enter_room(sid, room)
            await server.emit("joined_room", {"match_id": match_id}, to=sid)

    @server.event
    async def run_sample_tests(sid: str, data: dict) -> None:
        """Run quick tests against sample test cases (client clicks 'Run Code')."""
        code = data.get("code", "")
        language = data.get("language", "python")
        problem_id_str = data.get("problem_id")

        if not problem_id_str:
            return

        async with async_session_maker() as db:
            problem = await db.get(Problem, uuid.UUID(problem_id_str))
            if not problem:
                return

            sample_results = await judge_service.run_sample_tests(
                db=db,
                code=code,
                language=language,
                problem_id=problem.id,
                time_limit=problem.time_limit_seconds,
                memory_limit=problem.memory_limit_mb,
            )

            results = [
                {
                    "test_index": r.test_index,
                    "input": r.input,
                    "expected": r.expected_output,
                    "actual": r.actual_output,
                    "passed": r.passed,
                    "runtime_ms": r.runtime_ms,
                    "error": r.error,
                }
                for r in sample_results
            ]

            await server.emit("sample_test_results", {"results": results}, to=sid)

    @server.event
    async def request_practice_match(sid: str, data: dict | None = None) -> None:
        """Create a real match in DB against ArenaBot for solo practice and testing."""
        user_id = sid_to_user.get(sid)
        if not user_id:
            return

        async with async_session_maker() as db:
            # Ensure user exists in DB
            user = await db.get(User, user_id)
            if not user:
                user = User(
                    id=user_id,
                    username=f"Coder_{str(user_id)[:6]}",
                    email=f"user_{str(user_id)[:6]}@codearena.local",
                    google_id=f"dev_{uuid.uuid4().hex[:10]}",
                    avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=Coder",
                    elo_rating=1200,
                )
                db.add(user)
                await db.commit()

            # Ensure bot user exists in DB
            stmt = select(User).where(User.username == "ArenaBot")
            bot_res = await db.execute(stmt)
            bot = bot_res.scalar_one_or_none()
            if not bot:
                bot = User(
                    username="ArenaBot",
                    email="bot@codearena.internal",
                    google_id="bot_system_internal",
                    avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=ArenaBot",
                    elo_rating=1250,
                )
                db.add(bot)
                await db.commit()
                await db.refresh(bot)

            match = await matchmaking_service.create_match(db, user_id, bot.id)
            if match:
                room_name = f"match_{match.id}"
                await server.enter_room(sid, room_name)

                problem = await db.get(Problem, match.problem_id)
                problem_data = {
                    "id": str(problem.id) if problem else "",
                    "title": problem.title if problem else "Two Sum",
                    "description": problem.description if problem else "",
                    "difficulty": problem.difficulty if problem else "medium",
                    "constraints": problem.constraints if problem else "",
                    "examples": problem.examples if problem else [],
                    "time_limit_seconds": problem.time_limit_seconds if problem else 2.0,
                    "starter_code": problem.starter_code if problem else {},
                }

                match_payload = {
                    "match_id": str(match.id),
                    "player1_id": str(user_id),
                    "player2_id": str(bot.id),
                    "problem": problem_data,
                    "duration_seconds": 900,
                }
                await server.emit("match_found", match_payload, to=sid)
                logger.info(f"Practice match {match.id} launched for {user_id} vs ArenaBot")

    @server.event
    async def submit_solution(sid: str, data: dict) -> None:
        """Submit code for full evaluation."""
        user_id = sid_to_user.get(sid)
        match_id_str = data.get("match_id")
        problem_id_str = data.get("problem_id")
        code = data.get("code", "")
        language = data.get("language", "python")

        if not user_id or not problem_id_str:
            await server.emit("error", {"message": "Invalid submission payload"}, to=sid)
            return

        # Rate limiting: Max 6 submissions per 60 seconds
        now = asyncio.get_event_loop().time()
        uid_str = str(user_id)
        timestamps = [t for t in user_submission_history.get(uid_str, []) if now - t < 60.0]
        if len(timestamps) >= 6:
            await server.emit("submission_verdict", {
                "submission_id": "rate_limit",
                "verdict": "rate_limited",
                "tests_passed": 0,
                "total_tests": 0,
            }, to=sid)
            return
        timestamps.append(now)
        user_submission_history[uid_str] = timestamps

        try:
            problem_id = uuid.UUID(problem_id_str)
        except Exception:
            await server.emit("error", {"message": "Invalid problem ID"}, to=sid)
            return

        match_uuid = None
        if match_id_str:
            try:
                match_uuid = uuid.UUID(match_id_str)
            except Exception:
                pass

        async with async_session_maker() as db:
            sub = None
            if match_uuid:
                db_user = await db.get(User, user_id)
                db_match = await db.get(Match, match_uuid)
                if db_user and db_match:
                    sub = Submission(
                        match_id=match_uuid,
                        user_id=user_id,
                        problem_id=problem_id,
                        code=code,
                        language=language,
                        verdict="pending",
                        tests_passed=0,
                        total_tests=0,
                    )
                    db.add(sub)
                    await db.commit()
                    await db.refresh(sub)

            submission_id = sub.id if sub else uuid.uuid4()
            room = f"match_{match_id_str}"
            await server.emit("submission_received", {"submission_id": str(submission_id)}, to=sid)

            try:
                verdict, results = await judge_service.evaluate_submission(
                    db=db,
                    submission_id=submission_id,
                    code=code,
                    language=language,
                    problem_id=problem_id,
                )
            except Exception as eval_err:
                logger.error(f"Evaluation error: {eval_err}")
                await server.emit("submission_verdict", {
                    "submission_id": str(submission_id),
                    "verdict": "runtime_error",
                    "tests_passed": 0,
                    "total_tests": 0,
                }, to=sid)
                return

            passed = sum(1 for r in results if r.passed)
            total = len(results)

            formatted_results = [
                {
                    "test_index": r.test_index,
                    "input": r.input,
                    "expected": r.expected_output,
                    "actual": r.actual_output,
                    "passed": r.passed,
                    "runtime_ms": r.runtime_ms,
                    "error": r.error,
                }
                for r in results
            ]

            # Emit progress to room
            await server.emit("opponent_progress", {
                "user_id": str(user_id),
                "tests_passed": passed,
                "total_tests": total,
            }, room=room, skip_sid=sid)

            # Emit final verdict to player
            await server.emit("submission_verdict", {
                "submission_id": str(submission_id),
                "verdict": verdict,
                "tests_passed": passed,
                "total_tests": total,
                "results": formatted_results,
            }, to=sid)

            # If accepted, mark match as completed and update ELO!
            if verdict == "accepted":
                if match_uuid:
                    match = await db.get(Match, match_uuid)
                    if match and match.status != "completed":
                        now_utc = datetime.now(timezone.utc)
                        match.status = "completed"
                        match.winner_id = user_id
                        match.ended_at = now_utc
                        if match.started_at:
                            match.duration_seconds = max(1, int((now_utc - match.started_at).total_seconds()))
                        await db.commit()

                        # Update ELO ratings and win/loss stats
                        p1 = await db.get(User, match.player1_id)
                        p2 = await db.get(User, match.player2_id)
                        # p2 may be None for ArenaBot matches; still update the real player
                        winner_is_p1 = user_id == (p1.id if p1 else None)
                        if p1 and p2:
                            r1_new, r2_new, d1, d2 = elo_service.calculate_match_result(
                                p1.elo_rating,
                                p2.elo_rating,
                                "p1_win" if winner_is_p1 else "p2_win"
                            )
                            p1.elo_rating = r1_new
                            p2.elo_rating = r2_new
                        elif p1:
                            # Bot match — only update real player's ELO loosely
                            p1.elo_rating = min(p1.elo_rating + 16, 3000)
                        elif p2:
                            p2.elo_rating = min(p2.elo_rating + 16, 3000)
                        # Update win/loss for each real player
                        if p1:
                            if winner_is_p1:
                                p1.wins += 1
                            elif p2 or match.winner_id != p1.id:
                                p1.losses += 1
                        if p2:
                            if winner_is_p1:
                                p2.losses += 1
                            else:
                                p2.wins += 1
                        await db.commit()

                await server.emit("match_ended", {
                    "winner_id": str(user_id),
                    "reason": "solved",
                    "match_id": match_id_str,
                }, room=room)

    @server.event
    async def forfeit(sid: str, data: dict) -> None:
        """Handle player forfeit."""
        user_id = sid_to_user.get(sid)
        match_id_str = data.get("match_id")
        if not user_id or not match_id_str:
            return

        match_id = uuid.UUID(match_id_str)
        async with async_session_maker() as db:
            match = await db.get(Match, match_id)
            if match and match.status != "completed":
                now_utc = datetime.now(timezone.utc)
                match.status = "completed"
                winner_id = match.player2_id if match.player1_id == user_id else match.player1_id
                match.winner_id = winner_id
                match.ended_at = now_utc
                if match.started_at:
                    match.duration_seconds = max(1, int((now_utc - match.started_at).total_seconds()))
                await db.commit()

                # Update wins/losses for real players on forfeit
                p1 = await db.get(User, match.player1_id)
                p2 = await db.get(User, match.player2_id)
                forfeiter_is_p1 = match.player1_id == user_id
                if p1:
                    if forfeiter_is_p1:
                        p1.losses += 1
                    else:
                        p1.wins += 1
                if p2:
                    if forfeiter_is_p1:
                        p2.wins += 1
                    else:
                        p2.losses += 1
                await db.commit()

                room = f"match_{match_id}"
                await server.emit("match_ended", {
                    "winner_id": str(winner_id),
                    "reason": "forfeit",
                    "match_id": match_id_str,
                }, room=room)


register_socket_events(sio)
