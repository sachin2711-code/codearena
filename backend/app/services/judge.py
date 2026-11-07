"""Judge service for evaluating code submissions against test cases."""

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.problem import TestCase
from app.models.submission import Submission
from app.utils.sandbox import sandbox, ExecutionResult

logger = logging.getLogger(__name__)


@dataclass
class TestCaseResult:
    """Result of running a single test case."""

    test_index: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    runtime_ms: float = 0.0
    memory_kb: int = 0
    error: str | None = None


class JudgeService:
    """Evaluates code submissions by running them against test cases."""

    @staticmethod
    def normalize_output(output: str) -> str:
        """Normalize output for comparison.

        Strips trailing whitespace from each line and trailing newlines,
        so that minor formatting differences don't cause wrong-answer verdicts.
        """
        lines = output.strip().splitlines()
        return "\n".join(line.rstrip() for line in lines)

    @staticmethod
    async def run_test_case(
        code: str,
        language: str,
        test_input: str,
        expected_output: str,
        time_limit: float,
        memory_limit: int,
        test_index: int,
    ) -> TestCaseResult:
        """Run code against a single test case.

        Args:
            code: Source code to execute.
            language: Programming language.
            test_input: Input to feed via stdin.
            expected_output: Expected stdout output.
            time_limit: Maximum execution time in seconds.
            memory_limit: Maximum memory in MB.
            test_index: 0-based index of this test case.

        Returns:
            TestCaseResult with pass/fail status.
        """
        result: ExecutionResult = await sandbox.run_code(
            code=code,
            language=language,
            stdin=test_input,
            time_limit=time_limit,
            memory_limit=memory_limit,
        )

        if result.timed_out:
            return TestCaseResult(
                test_index=test_index,
                input=test_input,
                expected_output=expected_output,
                actual_output="",
                passed=False,
                runtime_ms=result.runtime_ms,
                memory_kb=result.memory_kb,
                error="Time limit exceeded",
            )

        if result.exit_code != 0:
            error_type = "Compilation error" if "error:" in result.stderr.lower() and language == "cpp" else "Runtime error"
            return TestCaseResult(
                test_index=test_index,
                input=test_input,
                expected_output=expected_output,
                actual_output=result.stdout,
                passed=False,
                runtime_ms=result.runtime_ms,
                memory_kb=result.memory_kb,
                error=f"{error_type}: {result.stderr[:500]}",
            )

        # Compare output
        normalized_actual = JudgeService.normalize_output(result.stdout)
        normalized_expected = JudgeService.normalize_output(expected_output)
        passed = normalized_actual == normalized_expected

        return TestCaseResult(
            test_index=test_index,
            input=test_input,
            expected_output=expected_output,
            actual_output=result.stdout.strip(),
            passed=passed,
            runtime_ms=result.runtime_ms,
            memory_kb=result.memory_kb,
            error=None if passed else None,
        )

    @staticmethod
    def compute_verdict(
        results: list[TestCaseResult],
    ) -> str:
        """Determine the overall verdict from individual test case results.

        Priority:
            1. compilation_error (any test has it)
            2. runtime_error (any test has it)
            3. time_limit (any test timed out)
            4. wrong_answer (any test failed)
            5. accepted (all passed)

        Args:
            results: List of TestCaseResult from all test cases.

        Returns:
            Verdict string.
        """
        if not results:
            return "pending"

        for r in results:
            if r.error and "Compilation error" in r.error:
                return "compilation_error"

        for r in results:
            if r.error and "Time limit" in r.error:
                return "time_limit"

        for r in results:
            if r.error and "Runtime error" in r.error:
                return "runtime_error"

        all_passed = all(r.passed for r in results)
        if all_passed:
            return "accepted"

        return "wrong_answer"

    @staticmethod
    def _create_test_case_result(
        test_index: int,
        tc_input: str,
        expected_output: str,
        language: str,
        exec_res: ExecutionResult,
    ) -> TestCaseResult:
        """Helper to transform an ExecutionResult into a TestCaseResult."""
        if exec_res.timed_out:
            return TestCaseResult(
                test_index=test_index,
                input=tc_input,
                expected_output=expected_output,
                actual_output="",
                passed=False,
                runtime_ms=exec_res.runtime_ms,
                memory_kb=exec_res.memory_kb,
                error="Time limit exceeded",
            )

        if exec_res.exit_code != 0:
            error_type = (
                "Compilation error"
                if "error:" in exec_res.stderr.lower() and language == "cpp"
                else "Runtime error"
            )
            return TestCaseResult(
                test_index=test_index,
                input=tc_input,
                expected_output=expected_output,
                actual_output=exec_res.stdout,
                passed=False,
                runtime_ms=exec_res.runtime_ms,
                memory_kb=exec_res.memory_kb,
                error=f"{error_type}: {exec_res.stderr[:500]}",
            )

        normalized_actual = JudgeService.normalize_output(exec_res.stdout)
        normalized_expected = JudgeService.normalize_output(expected_output)
        passed = normalized_actual == normalized_expected

        return TestCaseResult(
            test_index=test_index,
            input=tc_input,
            expected_output=expected_output,
            actual_output=exec_res.stdout.strip(),
            passed=passed,
            runtime_ms=exec_res.runtime_ms,
            memory_kb=exec_res.memory_kb,
            error=None,
        )

    @staticmethod
    async def evaluate_submission(
        db: AsyncSession,
        submission_id: uuid.UUID,
        code: str,
        language: str,
        problem_id: uuid.UUID,
        time_limit: float = 2.0,
        memory_limit: int = 256,
        on_progress: callable = None,
    ) -> tuple[str, list[TestCaseResult]]:
        """Evaluate a complete submission against all test cases.

        Runs test cases in parallel using batch execution for sub-second response times.
        """
        # Get all test cases for the problem
        tc_result = await db.execute(
            select(TestCase)
            .where(TestCase.problem_id == problem_id)
            .order_by(TestCase.created_at)
        )
        test_cases = tc_result.scalars().all()

        if not test_cases:
            logger.warning(f"No test cases found for problem {problem_id}")
            return "accepted", []

        # Run all test cases in batch concurrently
        inputs = [tc.input for tc in test_cases]
        exec_results = await sandbox.run_code_batch(
            code=code,
            language=language,
            inputs=inputs,
            time_limit=time_limit,
            memory_limit=memory_limit,
        )

        results: list[TestCaseResult] = []
        total_runtime = 0.0
        max_memory = 0
        tests_passed = 0

        for i, (tc, exec_res) in enumerate(zip(test_cases, exec_results)):
            tc_res = JudgeService._create_test_case_result(
                test_index=i,
                tc_input=tc.input,
                expected_output=tc.expected_output,
                language=language,
                exec_res=exec_res,
            )
            results.append(tc_res)
            total_runtime += tc_res.runtime_ms
            max_memory = max(max_memory, tc_res.memory_kb)

            if tc_res.passed:
                tests_passed += 1

            if on_progress:
                try:
                    await on_progress(i, len(test_cases), tc_res)
                except Exception as e:
                    logger.warning(f"Progress callback error: {e}")

        verdict = JudgeService.compute_verdict(results)

        # Update submission in database
        sub_result = await db.execute(
            select(Submission).where(Submission.id == submission_id)
        )
        submission = sub_result.scalar_one_or_none()

        if submission:
            submission.verdict = verdict
            submission.runtime_ms = round(total_runtime, 2)
            submission.memory_kb = max_memory
            submission.tests_passed = tests_passed
            submission.total_tests = len(test_cases)
            await db.flush()

        logger.info(
            f"Submission {submission_id} evaluated: {verdict} "
            f"({tests_passed}/{len(test_cases)} passed, {total_runtime:.1f}ms)"
        )

        return verdict, results

    @staticmethod
    async def run_sample_tests(
        db: AsyncSession,
        code: str,
        language: str,
        problem_id: uuid.UUID,
        time_limit: float = 2.0,
        memory_limit: int = 256,
    ) -> list[TestCaseResult]:
        """Run code against only the sample (visible) test cases.

        Executes sample cases concurrently for instant test feedback.
        """
        tc_result = await db.execute(
            select(TestCase)
            .where(TestCase.problem_id == problem_id, TestCase.is_sample == True)  # noqa: E712
            .order_by(TestCase.created_at)
        )
        test_cases = tc_result.scalars().all()

        if not test_cases:
            return []

        inputs = [tc.input for tc in test_cases]
        exec_results = await sandbox.run_code_batch(
            code=code,
            language=language,
            inputs=inputs,
            time_limit=time_limit,
            memory_limit=memory_limit,
        )

        results: list[TestCaseResult] = []
        for i, (tc, exec_res) in enumerate(zip(test_cases, exec_results)):
            tc_res = JudgeService._create_test_case_result(
                test_index=i,
                tc_input=tc.input,
                expected_output=tc.expected_output,
                language=language,
                exec_res=exec_res,
            )
            results.append(tc_res)

        return results


# Singleton instance
judge_service = JudgeService()

