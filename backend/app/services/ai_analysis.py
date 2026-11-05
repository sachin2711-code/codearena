"""AI analysis service using Google Gemini to analyze match code."""

import json
import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AIAnalysisService:
    """Analyzes code submissions using Google Gemini API."""

    def __init__(self) -> None:
        """Initialize the Gemini client."""
        self._model = None
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        """Lazy-initialize the Gemini model."""
        if self._initialized:
            return self._model is not None

        self._initialized = True
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set — AI analysis disabled")
            return False

        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel("gemini-1.5-flash")
            logger.info("Gemini AI model initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            return False

    async def analyze_match(
        self,
        problem_title: str,
        problem_description: str,
        player1_code: str,
        player1_language: str,
        player1_verdict: str,
        player2_code: str,
        player2_language: str,
        player2_verdict: str,
    ) -> dict[str, Any]:
        """Analyze both players' code after a match using Gemini.

        Args:
            problem_title: Title of the problem solved.
            problem_description: Full problem description.
            player1_code: Player 1's submitted code.
            player1_language: Player 1's language.
            player1_verdict: Player 1's judge verdict.
            player2_code: Player 2's submitted code.
            player2_language: Player 2's language.
            player2_verdict: Player 2's judge verdict.

        Returns:
            Structured analysis dict with code quality assessment,
            complexity analysis, and optimal solution suggestions.
        """
        if not self._ensure_initialized():
            return self._fallback_analysis()

        prompt = self._build_prompt(
            problem_title=problem_title,
            problem_description=problem_description,
            player1_code=player1_code,
            player1_language=player1_language,
            player1_verdict=player1_verdict,
            player2_code=player2_code,
            player2_language=player2_language,
            player2_verdict=player2_verdict,
        )

        try:
            response = await self._generate_response(prompt)
            analysis = self._parse_response(response)
            return analysis
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._fallback_analysis()

    def _build_prompt(
        self,
        problem_title: str,
        problem_description: str,
        player1_code: str,
        player1_language: str,
        player1_verdict: str,
        player2_code: str,
        player2_language: str,
        player2_verdict: str,
    ) -> str:
        """Build the analysis prompt for Gemini."""
        return f"""You are a competitive programming expert analyzing a 1v1 coding battle.

## Problem: {problem_title}
{problem_description}

## Player 1's Solution ({player1_language}) — Verdict: {player1_verdict}
```{player1_language}
{player1_code}
```

## Player 2's Solution ({player2_language}) — Verdict: {player2_verdict}
```{player2_language}
{player2_code}
```

Analyze both solutions and respond in VALID JSON format with this exact structure:
{{
    "player1_analysis": {{
        "code_quality": "A brief assessment of code quality (1-2 sentences)",
        "time_complexity": "e.g. O(n), O(n log n), etc.",
        "space_complexity": "e.g. O(1), O(n), etc.",
        "strengths": ["list", "of", "strengths"],
        "weaknesses": ["list", "of", "weaknesses"],
        "score": 0-100
    }},
    "player2_analysis": {{
        "code_quality": "A brief assessment of code quality (1-2 sentences)",
        "time_complexity": "e.g. O(n), O(n log n), etc.",
        "space_complexity": "e.g. O(1), O(n), etc.",
        "strengths": ["list", "of", "strengths"],
        "weaknesses": ["list", "of", "weaknesses"],
        "score": 0-100
    }},
    "optimal_approach": {{
        "description": "Brief description of the most optimal approach",
        "time_complexity": "Best possible time complexity",
        "space_complexity": "Best possible space complexity",
        "key_insight": "The key algorithmic insight"
    }},
    "comparison": "A paragraph comparing both solutions and explaining which is better and why"
}}

Respond ONLY with the JSON object, no markdown fences or extra text."""

    async def _generate_response(self, prompt: str) -> str:
        """Call Gemini to generate a response.

        Uses asyncio.to_thread to run the synchronous Gemini API call
        without blocking the event loop.
        """
        import asyncio

        def _call():
            response = self._model.generate_content(prompt)
            return response.text

        return await asyncio.to_thread(_call)

    def _parse_response(self, response: str) -> dict[str, Any]:
        """Parse Gemini's JSON response into a structured dict.

        Handles potential JSON formatting issues gracefully.
        """
        # Strip markdown code fences if present
        cleaned = response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            # Remove first and last lines (```json and ```)
            start_idx = 1 if lines[0].startswith("```") else 0
            end_idx = -1 if lines[-1].strip() == "```" else len(lines)
            cleaned = "\n".join(lines[start_idx:end_idx])

        try:
            analysis = json.loads(cleaned)

            # Validate expected keys exist
            required_keys = ["player1_analysis", "player2_analysis", "optimal_approach", "comparison"]
            for key in required_keys:
                if key not in analysis:
                    analysis[key] = self._fallback_analysis().get(key, {})

            return analysis
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse AI response as JSON: {e}")
            return self._fallback_analysis()

    @staticmethod
    def _fallback_analysis() -> dict[str, Any]:
        """Return a generic analysis when Gemini is unavailable or fails."""
        player_template = {
            "code_quality": "Analysis unavailable",
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "strengths": [],
            "weaknesses": [],
            "score": 0,
        }
        return {
            "player1_analysis": player_template.copy(),
            "player2_analysis": player_template.copy(),
            "optimal_approach": {
                "description": "Analysis unavailable",
                "time_complexity": "N/A",
                "space_complexity": "N/A",
                "key_insight": "N/A",
            },
            "comparison": "AI analysis is currently unavailable. Please try again later.",
        }


# Singleton instance
ai_analysis_service = AIAnalysisService()
