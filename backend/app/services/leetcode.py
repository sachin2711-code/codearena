"""LeetCode Live Problem Fetcher Service.

Queries LeetCode's public GraphQL API to dynamically fetch real-time problems,
starter code snippets, descriptions, and test cases.
"""

import html
import json
import logging
import random
import re
import uuid
import httpx
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.problem import Problem, TestCase

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# Curated list of top 120 popular LeetCode problem slugs across all difficulties
LEETCODE_SLUGS = {
    "easy": [
        "two-sum",
        "valid-parentheses",
        "merge-two-sorted-lists",
        "best-time-to-buy-and-sell-stock",
        "valid-palindrome",
        "invert-binary-tree",
        "valid-anagram",
        "binary-search",
        "climbing-stairs",
        "maximum-depth-of-binary-tree",
        "contains-duplicate",
        "reverse-linked-list",
        "majority-element",
        "single-number",
        "move-zeroes",
        "diameter-of-binary-tree",
        "middle-of-the-linked-list",
        "symmetric-tree",
        "ransom-note",
        "missing-number",
        "isomorphic-strings",
        "palindrome-linked-list",
        "fibonacci-number",
        "counting-bits",
        "first-bad-version",
        "squares-of-a-sorted-array",
        "pascals-triangle",
        "subtree-of-another-tree",
        "reverse-string",
        "longest-common-prefix",
    ],
    "medium": [
        "add-two-numbers",
        "longest-substring-without-repeating-characters",
        "longest-palindromic-substring",
        "container-with-most-water",
        "3sum",
        "letter-combinations-of-a-phone-number",
        "remove-nth-node-from-end-of-list",
        "generate-parentheses",
        "combination-sum",
        "permutations",
        "rotate-image",
        "group-anagrams",
        "maximum-subarray",
        "spiral-matrix",
        "jump-game",
        "merge-intervals",
        "insert-interval",
        "unique-paths",
        "minimum-path-sum",
        "set-matrix-zeroes",
        "search-a-2d-matrix",
        "sort-colors",
        "subsets",
        "word-search",
        "decode-ways",
        "validate-binary-search-tree",
        "kth-smallest-element-in-a-bst",
        "lowest-common-ancestor-of-a-binary-tree",
        "product-of-array-except-self",
        "find-the-duplicate-number",
        "coin-change",
        "longest-increasing-subsequence",
        "house-robber",
        "number-of-islands",
        "course-schedule",
        "daily-temperatures",
        "k-closest-points-to-origin",
        "top-k-frequent-elements",
        "task-scheduler",
        "rotting-oranges",
    ],
    "hard": [
        "median-of-two-sorted-arrays",
        "regular-expression-matching",
        "merge-k-sorted-lists",
        "trapping-rain-water",
        "first-missing-positive",
        "edit-distance",
        "minimum-window-substring",
        "largest-rectangle-in-histogram",
        "binary-tree-maximum-path-sum",
        "word-ladder",
        "find-median-from-data-stream",
        "sliding-window-maximum",
        "serialize-and-deserialize-binary-tree",
        "alien-dictionary",
    ],
}


class LeetCodeService:
    """Service to fetch live questions from LeetCode GraphQL API."""

    @staticmethod
    def clean_html(raw_html: str) -> str:
        """Strip HTML tags and convert to clean readable markdown."""
        if not raw_html:
            return ""

        # Decode HTML entities like &nbsp;, &lt;, &gt;
        text = html.unescape(raw_html)

        # Replace block tags with newlines
        text = re.sub(r'</?(p|div|br\s*/?|pre)>', '\n', text)
        text = re.sub(r'<li>', '\n• ', text)
        text = re.sub(r'</li>', '', text)
        text = re.sub(r'</?ul>', '\n', text)

        # Replace inline formatting
        text = re.sub(r'<strong>(.*?)</strong>', r'**\1**', text)
        text = re.sub(r'<b>(.*?)</b>', r'**\1**', text)
        text = re.sub(r'<code>(.*?)</code>', r'`\1`', text)
        text = re.sub(r'<sup>(.*?)</sup>', r'^\1', text)

        # Remove remaining HTML tags
        text = re.sub(r'<[^>]+>', '', text)

        # Normalize extra spaces and newlines
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        return text.strip()

    @staticmethod
    def extract_examples_and_constraints(raw_html: str) -> tuple[list[dict], str]:
        """Extract example test cases and constraints from LeetCode problem HTML."""
        examples: list[dict] = []
        constraints = ""

        # Extract Example blocks: Input: ... Output: ...
        example_pattern = re.compile(
            r'Input:\s*(.*?)\s*Output:\s*(.*?)(?:Explanation:|\n\n|\Z)',
            re.DOTALL | re.IGNORECASE
        )

        clean_text = LeetCodeService.clean_html(raw_html)

        # Extract constraints block
        if "Constraints:" in clean_text:
            parts = clean_text.split("Constraints:", 1)
            clean_text = parts[0].strip()
            constraints = parts[1].strip()

        matches = example_pattern.findall(clean_text)
        for inp, out in matches:
            inp_clean = inp.strip().replace('`', '').replace('**', '')
            out_clean = out.strip().replace('`', '').replace('**', '')
            # Strip trailing explanation sentences from expected output
            if "Explanation:" in out_clean:
                out_clean = out_clean.split("Explanation:", 1)[0].strip()
            # If multiple lines, keep only the first output value line
            out_lines = [l.strip() for l in out_clean.splitlines() if l.strip()]
            if out_lines:
                out_clean = out_lines[0]

            if inp_clean and out_clean:
                examples.append({
                    "input": inp_clean,
                    "output": out_clean,
                })

        return examples, constraints

    async def fetch_question_by_slug(self, title_slug: str) -> dict | None:
        """Query LeetCode GraphQL API for a single question data."""
        graphql_query = """
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            titleSlug
            content
            difficulty
            isPaidOnly
            exampleTestcases
            sampleTestCase
            codeSnippets {
              lang
              langSlug
              code
            }
          }
        }
        """

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": f"https://leetcode.com/problems/{title_slug}/",
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    LEETCODE_GRAPHQL_URL,
                    json={
                        "operationName": "questionData",
                        "variables": {"titleSlug": title_slug},
                        "query": graphql_query,
                    },
                    headers=headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    q = data.get("data", {}).get("question")
                    if q and not q.get("isPaidOnly"):
                        return q
        except Exception as exc:
            logger.warning(f"LeetCode GraphQL fetch failed for {title_slug}: {exc}")

        return None

    async def get_or_create_random_problem(
        self,
        db: AsyncSession,
        difficulty: str | None = None,
    ) -> Problem:
        """Fetch a live random problem from LeetCode, save to DB, and return it.

        Falls back to an existing problem in the database if network or API limits occur.
        """
        # Determine target difficulty
        diff = difficulty.lower() if difficulty in ("easy", "medium", "hard") else random.choice(["easy", "medium"])
        slug_pool = LEETCODE_SLUGS.get(diff, LEETCODE_SLUGS["easy"])
        random_slug = random.choice(slug_pool)

        # 1. Check if problem is already cached in database
        existing_result = await db.execute(
            select(Problem)
            .options(selectinload(Problem.test_cases))
            .where(func.lower(Problem.title) == random_slug.replace("-", " ").lower())
        )
        existing = existing_result.scalar_one_or_none()
        if existing and existing.test_cases:
            return existing

        # 2. Query LeetCode GraphQL API
        q_data = await self.fetch_question_by_slug(random_slug)
        if q_data:
            title = q_data.get("title", random_slug.replace("-", " ").title())
            raw_content = q_data.get("content", "")
            description = self.clean_html(raw_content)
            q_diff = (q_data.get("difficulty") or diff).lower()

            # Parse starter code templates
            starter_code = {}
            for snippet in q_data.get("codeSnippets", []):
                lang_slug = snippet.get("langSlug")
                code_text = snippet.get("code", "")
                if lang_slug in ("python3", "python"):
                    starter_code["python"] = code_text
                elif lang_slug in ("javascript", "typescript"):
                    starter_code["javascript"] = code_text
                elif lang_slug in ("cpp", "c++"):
                    starter_code["cpp"] = code_text

            # If snippet missing, fallback to standard competitive programming template
            if "python" not in starter_code:
                starter_code["python"] = "import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    main()\n"
            if "javascript" not in starter_code:
                starter_code["javascript"] = "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\n// Write solution here\n"
            if "cpp" not in starter_code:
                starter_code["cpp"] = "#include <iostream>\nusing namespace std;\nint main() {\n    // Write solution here\n    return 0;\n}\n"

            # Parse examples and constraints
            examples, constraints = self.extract_examples_and_constraints(raw_content)

            # Create Problem in DB
            new_problem = Problem(
                title=title,
                description=description,
                difficulty=q_diff,
                constraints=constraints,
                examples=examples,
                time_limit_seconds=2.0,
                memory_limit_mb=256,
                starter_code=starter_code,
                is_active=True,
            )
            db.add(new_problem)
            await db.flush()

            # Create test cases from examples
            for idx, ex in enumerate(examples):
                tc = TestCase(
                    problem_id=new_problem.id,
                    input=ex["input"],
                    expected_output=ex["output"],
                    is_sample=True if idx < 2 else False,
                )
                db.add(tc)

            # If no examples could be parsed, add a sample test case from sampleTestCase
            if not examples:
                sample_tc = q_data.get("sampleTestCase") or "1"
                tc = TestCase(
                    problem_id=new_problem.id,
                    input=sample_tc,
                    expected_output="true",
                    is_sample=True,
                )
                db.add(tc)

            await db.commit()
            await db.refresh(new_problem)
            logger.info(f"Successfully fetched & cached LeetCode problem: {title} ({q_diff})")
            return new_problem

        # 3. Fallback: Return a random problem already present in database
        fallback_query = select(Problem).options(selectinload(Problem.test_cases))
        if difficulty:
            fallback_query = fallback_query.where(Problem.difficulty == difficulty)
        fallback_query = fallback_query.order_by(func.random()).limit(1)

        fallback_res = await db.execute(fallback_query)
        fallback_problem = fallback_res.scalar_one_or_none()

        if fallback_problem:
            return fallback_problem

        # Last resort if DB is empty
        any_res = await db.execute(select(Problem).options(selectinload(Problem.test_cases)).limit(1))
        return any_res.scalar_one()


leetcode_service = LeetCodeService()
