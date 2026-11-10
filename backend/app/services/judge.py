"""Judge service for evaluating code submissions against test cases."""

import logging
import re
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
    def wrap_code_with_harness(code: str, language: str) -> str:
        """Wrap LeetCode-style solution classes or functions with an auto-execution driver."""
        if language == "python":
            # If code already has a runnable entrypoint, don't wrap
            if ("sys.stdin" in code or "input(" in code) and "__main__" in code:
                return code

            preamble = """
from typing import *

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, children=None):
        self.val = val
        self.children = children if children is not None else []

def _to_listnode(arr):
    if not arr or not isinstance(arr, list):
        return None
    head = ListNode(arr[0])
    curr = head
    for v in arr[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def _from_listnode(head):
    if head is None:
        return []
    res = []
    curr = head
    visited = set()
    while curr and id(curr) not in visited:
        visited.add(id(curr))
        res.append(curr.val)
        curr = curr.next
    return res

def _to_treenode(arr):
    if not arr or not isinstance(arr, list):
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def _from_treenode(root):
    if not root:
        return []
    res = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            res.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res
"""

            harness = """

# CodeArena Auto-Harness
if __name__ == '__main__':
    import sys, json, ast, inspect, traceback, re

    def _parse_val(raw):
        s = raw.strip()
        if not s:
            return ""
        # Strip variable assignment: s = "babad" -> "babad"
        m = re.match(r'^[a-zA-Z_]\w*\s*=\s*(.+)$', s, re.DOTALL)
        if m:
            s = m.group(1).strip()
        try:
            return json.loads(s)
        except Exception:
            pass
        try:
            return ast.literal_eval(s)
        except Exception:
            pass
        if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
            return s[1:-1]
        return s

    def _convert_arg(val, param):
        ann_str = str(param.annotation)
        p_name = param.name.lower()
        if ("ListNode" in ann_str or "list" in p_name or "head" in p_name) and isinstance(val, list):
            return _to_listnode(val)
        elif ("TreeNode" in ann_str or "root" in p_name or "tree" in p_name) and isinstance(val, list):
            return _to_treenode(val)
        return val

    try:
        raw_input = sys.stdin.read().strip()
        target_fn = None

        if 'Solution' in globals():
            sol = Solution()
            methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
            if methods:
                target_fn = getattr(sol, methods[0])
        else:
            for name, obj in list(globals().items()):
                if callable(obj) and not name.startswith('_') and getattr(obj, '__module__', None) == '__main__':
                    target_fn = obj
                    break

        if target_fn:
            sig = inspect.signature(target_fn)
            params = list(sig.parameters.values())
            param_count = len(params)
            parsed_args = []

            if raw_input:
                lines = [l.strip() for l in raw_input.splitlines() if l.strip()]
                if len(lines) == param_count and param_count > 1:
                    raw_args = [_parse_val(l) for l in lines]
                else:
                    split_vars = re.split(r',\s*(?=[a-zA-Z_]\w*\s*=)', raw_input)
                    if len(split_vars) == param_count and param_count > 1:
                        raw_args = [_parse_val(v) for v in split_vars]
                    elif param_count == 1:
                        raw_args = [_parse_val(raw_input)]
                    else:
                        tokens = raw_input.split()
                        if len(tokens) == param_count:
                            raw_args = [_parse_val(t) for t in tokens]
                        else:
                            raw_args = [_parse_val(raw_input)]

                for idx, arg in enumerate(raw_args):
                    if idx < len(params):
                        parsed_args.append(_convert_arg(arg, params[idx]))
                    else:
                        parsed_args.append(arg)

            first_arg = parsed_args[0] if parsed_args else None
            initial_val = list(first_arg) if isinstance(first_arg, list) else None

            res = target_fn(*parsed_args)

            ret_ann = str(sig.return_annotation)
            if "ListNode" in ret_ann or isinstance(res, ListNode):
                res = _from_listnode(res)
            elif "TreeNode" in ret_ann or isinstance(res, TreeNode):
                res = _from_treenode(res)

            if isinstance(res, bool):
                print("true" if res else "false")
            elif res is not None:
                if isinstance(res, (list, dict)):
                    print(json.dumps(res, separators=(',', ':')))
                else:
                    print(res)
            else:
                if initial_val is not None and isinstance(first_arg, list):
                    print(json.dumps(first_arg, separators=(',', ':')))
                else:
                    print("null")
    except Exception as _err:
        traceback.print_exc(file=sys.stderr)
"""
            return preamble + "\n" + code + "\n" + harness

        elif language == "javascript":
            if "fs.readFileSync" in code:
                return code

            js_harness = """
if (typeof require !== 'undefined' && typeof process !== 'undefined') {
    const fs = require('fs');
    try {
        const raw = fs.readFileSync(0, 'utf-8').trim();
        let targetFn = null;
        if (typeof isValid === 'function') targetFn = isValid;
        else if (typeof twoSum === 'function') targetFn = twoSum;
        else if (typeof solution === 'function') targetFn = solution;
        else if (typeof Solution === 'function' || typeof Solution === 'object') {
            const inst = typeof Solution === 'function' ? new Solution() : Solution;
            const props = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
            const m = props.find(p => p !== 'constructor' && typeof inst[p] === 'function');
            if (m) targetFn = inst[m].bind(inst);
        }

        if (targetFn) {
            let arg = raw;
            try { arg = JSON.parse(raw); } catch (e) {}
            const res = targetFn(arg);
            if (typeof res === 'boolean') console.log(res ? 'true' : 'false');
            else if (typeof res === 'object') console.log(JSON.stringify(res));
            else if (res !== undefined) console.log(res);
        }
    } catch (e) {
        console.error(e);
    }
}
"""
            return code + "\n" + js_harness

        elif language == "cpp":
            has_main = bool(re.search(r'\bint\s+main\s*\(', code) or re.search(r'\bvoid\s+main\s*\(', code))

            headers = """#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <deque>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <cctype>
#include <sstream>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
"""
            if has_main:
                if "#include" in code:
                    return code
                return headers + "\n" + code

            cpp_driver = JudgeService._generate_cpp_driver(code)
            return headers + "\n" + code + "\n" + cpp_driver

        return code

    @staticmethod
    def _generate_cpp_driver(code: str) -> str:
        """Generate an auto-executing int main() driver for C++ class Solution."""
        clean_code = re.sub(r'//.*', '', code)
        clean_code = re.sub(r'/\*.*?\*/', '', clean_code, flags=re.DOTALL)
        pattern = r'(bool|int|string|void|double|float|long\s+long|vector<[a-zA-Z0-9_:*<> ]+>|ListNode\*|TreeNode\*)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{'
        match = re.search(pattern, clean_code)

        if not match:
            return "\nint main() { return 0; }\n"

        ret_type = match.group(1).strip()
        method_name = match.group(2).strip()
        raw_params = match.group(3).strip()

        params = []
        if raw_params:
            for p in raw_params.split(','):
                p = p.strip()
                parts = p.rsplit(' ', 1)
                if len(parts) == 2:
                    p_type = parts[0].strip()
                    p_name = parts[1].strip().lstrip('&').lstrip('*')
                    params.append((p_type, p_name))
                else:
                    params.append((p, 'arg'))

        driver_body = """
namespace _Driver {
    string clean(string s) {
        size_t eq = s.find('=');
        if (eq != string::npos && eq + 1 < s.size()) s = s.substr(eq + 1);
        while (!s.empty() && isspace((unsigned char)s.front())) s.erase(s.begin());
        while (!s.empty() && isspace((unsigned char)s.back())) s.pop_back();
        if (s.size() >= 2 && ((s.front() == '"' && s.back() == '"') || (s.front() == '\'' && s.back() == '\''))) {
            s = s.substr(1, s.size() - 2);
        }
        return s;
    }
    vector<int> parseVectorInt(string s) {
        vector<int> res;
        size_t eq = s.find('=');
        if (eq != string::npos) s = s.substr(eq + 1);
        string cur = "";
        bool inNum = false;
        for (char c : s) {
            if (isdigit((unsigned char)c) || c == '-') {
                cur += c;
                inNum = true;
            } else if (inNum) {
                if (!cur.empty() && cur != "-") res.push_back(stoi(cur));
                cur = "";
                inNum = false;
            }
        }
        if (inNum && !cur.empty() && cur != "-") res.push_back(stoi(cur));
        return res;
    }
    int parseInt(string s) {
        size_t eq = s.find('=');
        if (eq != string::npos) s = s.substr(eq + 1);
        string cur = "";
        for (char c : s) {
            if (isdigit((unsigned char)c) || c == '-') cur += c;
            else if (!cur.empty() && cur != "-") break;
        }
        return (cur.empty() || cur == "-") ? 0 : stoi(cur);
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string raw, line;
    while (getline(cin, line)) {
        if (!raw.empty()) raw += "\\n";
        raw += line;
    }
    Solution sol;
"""

        if len(params) == 0:
            call_code = f"auto res = sol.{method_name}();"
        elif len(params) == 1:
            p_type, _ = params[0]
            if "string" in p_type:
                call_code = f"string arg = _Driver::clean(raw);\n    auto res = sol.{method_name}(arg);"
            elif "vector" in p_type:
                call_code = f"auto arg = _Driver::parseVectorInt(raw);\n    auto res = sol.{method_name}(arg);"
            else:
                call_code = f"int arg = _Driver::parseInt(raw);\n    auto res = sol.{method_name}(arg);"
        elif len(params) == 2:
            p1_type, _ = params[0]
            p2_type, _ = params[1]
            split_logic = """
    size_t split_pos = raw.rfind("target =");
    if (split_pos == string::npos) split_pos = raw.rfind(',');
    string s1 = (split_pos != string::npos) ? raw.substr(0, split_pos) : raw;
    string s2 = (split_pos != string::npos) ? raw.substr(split_pos + 1) : "";
"""
            p1_expr = "_Driver::parseVectorInt(s1)" if "vector" in p1_type else ("_Driver::clean(s1)" if "string" in p1_type else "_Driver::parseInt(s1)")
            p2_expr = "_Driver::parseVectorInt(s2)" if "vector" in p2_type else ("_Driver::clean(s2)" if "string" in p2_type else "_Driver::parseInt(s2)")
            call_code = f"{split_logic}    auto arg1 = {p1_expr};\n    auto arg2 = {p2_expr};\n    auto res = sol.{method_name}(arg1, arg2);"
        else:
            call_code = f"auto res = sol.{method_name}();"

        if ret_type == "bool":
            print_code = 'cout << (res ? "true" : "false") << "\\n";'
        elif "vector" in ret_type:
            print_code = """cout << "[";
    for (size_t i = 0; i < res.size(); i++) {
        if (i > 0) cout << ",";
        cout << res[i];
    }
    cout << "]\\n";"""
        else:
            print_code = 'cout << res << "\\n";'

        driver_body += f"    {call_code}\n    {print_code}\n    return 0;\n}}\n"
        return driver_body

    @staticmethod
    def normalize_output(output: str) -> str:
        """Normalize output for comparison.

        Strips whitespace, surrounding quotes on strings, matches booleans case-insensitively,
        and normalizes JSON formatting differences.
        """
        text = output.strip()
        if text.lower() in ("true", "false"):
            return text.lower()
        # Strip surrounding double or single quotes for string equality ("bab" <-> bab)
        if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
            text = text[1:-1].strip()
        lines = [line.rstrip() for line in text.splitlines()]
        norm = "\n".join(lines)
        # Normalize list/array formatting: "[0, 1]" -> "[0,1]"
        norm = re.sub(r'\[\s+', '[', norm)
        norm = re.sub(r'\s+\]', ']', norm)
        norm = re.sub(r'\s*,\s*', ',', norm)
        return norm

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
        wrapped_code = JudgeService.wrap_code_with_harness(code, language)
        result: ExecutionResult = await sandbox.run_code(
            code=wrapped_code,
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

        # Wrap code with auto-harness for class Solution/functions if needed
        wrapped_code = JudgeService.wrap_code_with_harness(code, language)

        # Run all test cases in batch concurrently
        inputs = [tc.input for tc in test_cases]
        exec_results = await sandbox.run_code_batch(
            code=wrapped_code,
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

        # Wrap code with auto-harness for class Solution/functions if needed
        wrapped_code = JudgeService.wrap_code_with_harness(code, language)

        inputs = [tc.input for tc in test_cases]
        exec_results = await sandbox.run_code_batch(
            code=wrapped_code,
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

