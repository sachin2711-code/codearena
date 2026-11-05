"""Socket.IO event handlers for real-time multiplayer coding battles."""

import asyncio
import json
import logging
import uuid
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
            await matchmaking_service.remove_from_queue(user_id)
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
            opponent_id = await matchmaking_service.find_opponent(user_id, elo)
            if opponent_id:
                # Found opponent! Create match in DB
                match = await matchmaking_service.create_match(db, user_id, opponent_id)
                if match:
                    room_name = f"match_{match.id}"
                    opp_sid = user_to_sid.get(str(opponent_id))

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
            problem = await db.get(Problem, uuid.UUID(problem_id_str), options=[selectinload(Problem.test_cases)])
            if not problem:
                return

            sample_cases = [tc for tc in problem.test_cases if tc.is_sample]
            results = []
            for idx, tc in enumerate(sample_cases):
                res = await judge_service.run_test_case(
                    code=code,
                    language=language,
                    test_input=tc.input,
                    expected_output=tc.expected_output,
                    time_limit=problem.time_limit_seconds,
                    memory_limit=problem.memory_limit_mb,
                    test_index=idx,
                )
                results.append({
                    "test_index": idx,
                    "input": tc.input,
                    "expected": tc.expected_output,
                    "actual": res.actual_output,
                    "passed": res.passed,
                    "runtime_ms": res.runtime_ms,
                    "error": res.error,
                })

            await server.emit("sample_test_results", {"results": results}, to=sid)

    @server.event
    async def submit_solution(sid: str, data: dict) -> None:
        """Submit code for full evaluation."""
        user_id = sid_to_user.get(sid)
        match_id_str = data.get("match_id")
        problem_id_str = data.get("problem_id")
        code = data.get("code", "")
        language = data.get("language", "python")

        if not user_id or not match_id_str or not problem_id_str:
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

        match_id = uuid.UUID(match_id_str)
        problem_id = uuid.UUID(problem_id_str)

        async with async_session_maker() as db:
            # Create submission in DB
            sub = Submission(
                match_id=match_id,
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

            room = f"match_{match_id}"
            await server.emit("submission_received", {"submission_id": str(sub.id)}, to=sid)

            # Trigger Celery task in background (or evaluate in-process if Celery worker is offline)
            try:
                run_submission.delay(
                    submission_id=str(sub.id),
                    code=code,
                    language=language,
                    problem_id=problem_id_str,
                    match_id=match_id_str,
                    user_id=str(user_id),
                )
            except Exception as e:
                logger.warning(f"Celery dispatch failed: {e}. Evaluating directly in-process.")
                # Direct in-process fallback
                verdict, results = await judge_service.evaluate_submission(
                    db=db,
                    submission_id=sub.id,
                    code=code,
                    language=language,
                    problem_id=problem_id,
                )
                passed = sum(1 for r in results if r.passed)
                total = len(results)

                # Emit progress to room
                await server.emit("opponent_progress", {
                    "user_id": str(user_id),
                    "tests_passed": passed,
                    "total_tests": total,
                }, room=room, skip_sid=sid)

                # Emit final verdict to player
                await server.emit("submission_verdict", {
                    "submission_id": str(sub.id),
                    "verdict": verdict,
                    "tests_passed": passed,
                    "total_tests": total,
                }, to=sid)

                # If accepted, mark match as completed and update ELO!
                if verdict == "accepted":
                    match = await db.get(Match, match_id)
                    if match and match.status != "completed":
                        match.status = "completed"
                        match.winner_id = user_id
                        await db.commit()

                        # Update ELO ratings
                        p1 = await db.get(User, match.player1_id)
                        p2 = await db.get(User, match.player2_id)
                        if p1 and p2:
                            r1_new, r2_new, d1, d2 = elo_service.calculate_match_result(
                                p1.elo_rating,
                                p2.elo_rating,
                                "p1_win" if user_id == p1.id else "p2_win"
                            )
                            p1.elo_rating = r1_new
                            p2.elo_rating = r2_new
                            if user_id == p1.id:
                                p1.wins += 1
                                p2.losses += 1
                            else:
                                p2.wins += 1
                                p1.losses += 1
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
                match.status = "completed"
                winner_id = match.player2_id if match.player1_id == user_id else match.player1_id
                match.winner_id = winner_id
                await db.commit()

                room = f"match_{match_id}"
                await server.emit("match_ended", {
                    "winner_id": str(winner_id),
                    "reason": "forfeit",
                    "match_id": match_id_str,
                }, room=room)


register_socket_events(sio)
