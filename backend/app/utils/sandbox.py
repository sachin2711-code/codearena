"""Docker sandbox for secure code execution."""

import asyncio
import logging
import os
import shutil
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import docker
from docker.errors import ContainerError, ImageNotFound, APIError

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Map language to Docker image name and execution command
LANGUAGE_CONFIG: dict[str, dict[str, Any]] = {
    "python": {
        "image": "codearena-sandbox-python",
        "file_ext": ".py",
        "cmd_template": "python3 /sandbox/code{ext}",
    },
    "cpp": {
        "image": "codearena-sandbox-cpp",
        "file_ext": ".cpp",
        "cmd_template": "bash -c 'g++ -O2 -o /sandbox/a.out /sandbox/code{ext} && /sandbox/a.out'",
    },
    "javascript": {
        "image": "codearena-sandbox-javascript",
        "file_ext": ".js",
        "cmd_template": "node /sandbox/code{ext}",
    },
}


@dataclass
class ExecutionResult:
    """Result of running code in a sandbox container."""

    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    runtime_ms: float = 0.0
    memory_kb: int = 0
    timed_out: bool = False


class DockerSandbox:
    """Manages ephemeral Docker containers for safe code execution."""

    def __init__(self) -> None:
        """Initialize the Docker client and cache availability to avoid ping delays."""
        self._available = False
        try:
            self._client = docker.from_env()
            self._client.ping()
            self._available = True
            logger.info("Docker client initialized successfully")
        except Exception as e:
            logger.warning(f"Docker client initialization failed: {e}. Sandbox will use fallback.")
            self._client = None
            self._available = False

    def is_available(self) -> bool:
        """Check whether Docker is available (cached O(1) check)."""
        return self._available

    async def build_images(self) -> None:
        """Build sandbox Docker images if they don't already exist.

        This is called at application startup.
        """
        if not self.is_available():
            logger.warning("Docker not available — skipping sandbox image builds")
            return

        docker_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "docker",
            "sandbox",
        )

        image_files = {
            "codearena-sandbox-python": "Dockerfile.python",
            "codearena-sandbox-cpp": "Dockerfile.cpp",
            "codearena-sandbox-javascript": "Dockerfile.javascript",
        }

        loop = asyncio.get_event_loop()
        for image_name, dockerfile in image_files.items():
            try:
                self._client.images.get(image_name)
                logger.info(f"Image {image_name} already exists")
            except ImageNotFound:
                dockerfile_path = os.path.join(docker_dir, dockerfile)
                if os.path.exists(dockerfile_path):
                    logger.info(f"Building image {image_name} from {dockerfile}")
                    try:
                        await loop.run_in_executor(
                            None,
                            lambda name=image_name, df=dockerfile, dd=docker_dir: self._client.images.build(
                                path=dd,
                                dockerfile=df,
                                tag=name,
                                rm=True,
                            ),
                        )
                        logger.info(f"Successfully built {image_name}")
                    except Exception as e:
                        logger.error(f"Failed to build {image_name}: {e}")
                else:
                    logger.warning(f"Dockerfile not found: {dockerfile_path}")

    async def run_code(
        self,
        code: str,
        language: str,
        stdin: str = "",
        time_limit: float = 2.0,
        memory_limit: int = 256,
    ) -> ExecutionResult:
        """Run code inside an ephemeral Docker container.

        Args:
            code: Source code to execute.
            language: Programming language (python, cpp, javascript).
            stdin: Standard input to feed the program.
            time_limit: Time limit in seconds.
            memory_limit: Memory limit in MB.

        Returns:
            ExecutionResult with stdout, stderr, exit code, timing info.
        """
        if not self.is_available():
            return await self._fallback_run(code, language, stdin, time_limit)

        lang_config = LANGUAGE_CONFIG.get(language)
        if lang_config is None:
            return ExecutionResult(
                stderr=f"Unsupported language: {language}",
                exit_code=1,
            )

        container = None
        tmp_dir = tempfile.mkdtemp(prefix="codearena_")
        code_filename = f"code{lang_config['file_ext']}"
        code_path = os.path.join(tmp_dir, code_filename)

        try:
            # Write source code to temp file
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Write stdin to file if provided
            stdin_path = os.path.join(tmp_dir, "stdin.txt")
            with open(stdin_path, "w", encoding="utf-8") as f:
                f.write(stdin)

            cmd = lang_config["cmd_template"].format(ext=lang_config["file_ext"])
            if stdin:
                cmd = f"bash -c '{cmd} < /sandbox/stdin.txt'"

            loop = asyncio.get_event_loop()
            start_time = time.time()

            # Create and run the container
            container = await loop.run_in_executor(
                None,
                lambda: self._client.containers.run(
                    image=lang_config["image"],
                    command=cmd,
                    volumes={tmp_dir: {"bind": "/sandbox", "mode": "ro"}},
                    network_disabled=True,
                    mem_limit=f"{memory_limit}m",
                    cpu_quota=settings.SANDBOX_CPU_QUOTA,
                    pids_limit=64,
                    cap_drop=["ALL"],
                    security_opt=["no-new-privileges:true"],
                    read_only=True,
                    tmpfs={"/tmp": "size=64m"},
                    detach=True,
                    stderr=True,
                    stdout=True,
                ),
            )

            # Wait for completion with timeout
            try:
                exit_info = await asyncio.wait_for(
                    loop.run_in_executor(None, lambda: container.wait(timeout=int(time_limit + 1))),
                    timeout=time_limit + 2,
                )
                end_time = time.time()
                runtime_ms = (end_time - start_time) * 1000

                stdout = (
                    await loop.run_in_executor(None, lambda: container.logs(stdout=True, stderr=False))
                ).decode("utf-8", errors="replace")
                stderr = (
                    await loop.run_in_executor(None, lambda: container.logs(stdout=False, stderr=True))
                ).decode("utf-8", errors="replace")

                # Get memory stats
                try:
                    stats = await loop.run_in_executor(None, lambda: container.stats(stream=False))
                    memory_kb = stats.get("memory_stats", {}).get("max_usage", 0) // 1024
                except Exception:
                    memory_kb = 0

                return ExecutionResult(
                    stdout=stdout.strip(),
                    stderr=stderr.strip(),
                    exit_code=exit_info.get("StatusCode", 1),
                    runtime_ms=round(runtime_ms, 2),
                    memory_kb=memory_kb,
                    timed_out=False,
                )

            except (asyncio.TimeoutError, Exception) as timeout_err:
                # Kill the container on timeout
                try:
                    await loop.run_in_executor(None, container.kill)
                except Exception:
                    pass
                end_time = time.time()
                runtime_ms = (end_time - start_time) * 1000
                return ExecutionResult(
                    stderr="Time limit exceeded",
                    exit_code=137,
                    runtime_ms=round(runtime_ms, 2),
                    timed_out=True,
                )

        except ContainerError as e:
            return ExecutionResult(
                stderr=str(e),
                exit_code=e.exit_status,
            )
        except Exception as e:
            logger.error(f"Sandbox error: {e}")
            return ExecutionResult(
                stderr=f"Sandbox error: {str(e)}",
                exit_code=1,
            )
        finally:
            # Cleanup container
            if container is not None:
                try:
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(None, lambda: container.remove(force=True))
                except Exception:
                    pass
            # Cleanup temp files
            try:
                import shutil
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception:
                pass

    async def _fallback_run(
        self,
        code: str,
        language: str,
        stdin: str = "",
        time_limit: float = 2.0,
    ) -> ExecutionResult:
        """Fallback: run code directly via subprocess when Docker is unavailable.

        WARNING: This is only for development and has no security isolation.
        Supports Python and JavaScript.
        """
        if language not in ("python", "javascript"):
            return ExecutionResult(
                stderr=(
                    f"Local fallback without Docker currently supports Python and JavaScript.\n"
                    f"To run C++, please select Python in the language dropdown, install g++, or run via Docker Desktop."
                ),
                exit_code=1,
            )

        tmp_dir = tempfile.mkdtemp(prefix="codearena_fallback_")
        ext = ".py" if language == "python" else ".js"
        code_path = os.path.join(tmp_dir, f"code{ext}")

        try:
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)

            start_time = time.time()
            cmd = [sys.executable, "-B", "-u", code_path] if language == "python" else ["node", code_path]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(input=stdin.encode("utf-8") if stdin else None),
                    timeout=time_limit,
                )
                end_time = time.time()
                runtime_ms = (end_time - start_time) * 1000

                return ExecutionResult(
                    stdout=stdout_bytes.decode("utf-8", errors="replace").strip(),
                    stderr=stderr_bytes.decode("utf-8", errors="replace").strip(),
                    exit_code=proc.returncode or 0,
                    runtime_ms=round(runtime_ms, 2),
                    timed_out=False,
                )
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                    await proc.wait()
                except Exception:
                    pass
                end_time = time.time()
                return ExecutionResult(
                    stderr="Time limit exceeded",
                    exit_code=137,
                    runtime_ms=round((end_time - start_time) * 1000, 2),
                    timed_out=True,
                )
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    async def run_code_batch(
        self,
        code: str,
        language: str,
        inputs: list[str],
        time_limit: float = 2.0,
        memory_limit: int = 256,
        concurrency: int = 6,
    ) -> list[ExecutionResult]:
        """Execute multiple test inputs against the same code concurrently.

        Optimized to write the source code once and execute all test cases in parallel,
        drastically reducing latency from multiple seconds to sub-second.
        """
        if not inputs:
            return []

        if not self.is_available():
            return await self._fallback_run_batch(code, language, inputs, time_limit, concurrency)

        # In Docker mode, run up to `concurrency` containers concurrently
        sem = asyncio.Semaphore(concurrency)

        async def _run_docker_case(stdin_val: str) -> ExecutionResult:
            async with sem:
                return await self.run_code(code, language, stdin_val, time_limit, memory_limit)

        return await asyncio.gather(*[_run_docker_case(inp) for inp in inputs])

    async def _fallback_run_batch(
        self,
        code: str,
        language: str,
        inputs: list[str],
        time_limit: float = 2.0,
        concurrency: int = 6,
    ) -> list[ExecutionResult]:
        """Batch subprocess runner: writes code ONCE and runs test cases in parallel."""
        if language not in ("python", "javascript"):
            err_msg = (
                f"Local fallback without Docker currently supports Python and JavaScript.\n"
                f"To run C++, please select Python in the language dropdown, install g++, or run via Docker Desktop."
            )
            return [ExecutionResult(stderr=err_msg, exit_code=1) for _ in inputs]

        tmp_dir = tempfile.mkdtemp(prefix="codearena_batch_")
        ext = ".py" if language == "python" else ".js"
        code_path = os.path.join(tmp_dir, f"code{ext}")

        try:
            # Write source code once for all test cases
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)

            cmd = [sys.executable, "-B", "-u", code_path] if language == "python" else ["node", code_path]
            sem = asyncio.Semaphore(concurrency)

            async def _run_single(stdin_val: str) -> ExecutionResult:
                async with sem:
                    start_time = time.time()
                    try:
                        proc = await asyncio.create_subprocess_exec(
                            *cmd,
                            stdin=asyncio.subprocess.PIPE,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE,
                        )
                        try:
                            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                                proc.communicate(input=stdin_val.encode("utf-8") if stdin_val else None),
                                timeout=time_limit,
                            )
                            runtime_ms = (time.time() - start_time) * 1000
                            return ExecutionResult(
                                stdout=stdout_bytes.decode("utf-8", errors="replace").strip(),
                                stderr=stderr_bytes.decode("utf-8", errors="replace").strip(),
                                exit_code=proc.returncode or 0,
                                runtime_ms=round(runtime_ms, 2),
                                timed_out=False,
                            )
                        except asyncio.TimeoutError:
                            try:
                                proc.kill()
                                await proc.wait()
                            except Exception:
                                pass
                            return ExecutionResult(
                                stderr="Time limit exceeded",
                                exit_code=137,
                                runtime_ms=round((time.time() - start_time) * 1000, 2),
                                timed_out=True,
                            )
                    except Exception as e:
                        return ExecutionResult(
                            stderr=f"Process execution error: {e}",
                            exit_code=1,
                            runtime_ms=round((time.time() - start_time) * 1000, 2),
                        )

            results = await asyncio.gather(*[_run_single(inp) for inp in inputs])
            return list(results)
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    async def cleanup(self) -> None:
        """Cleanup any remaining sandbox containers."""
        if not self.is_available():
            return
        try:
            loop = asyncio.get_event_loop()
            containers = await loop.run_in_executor(
                None,
                lambda: self._client.containers.list(
                    filters={"ancestor": list(LANGUAGE_CONFIG.values())[0]["image"]},
                    all=True,
                ),
            )
            for c in containers:
                try:
                    await loop.run_in_executor(None, lambda cont=c: cont.remove(force=True))
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Cleanup error: {e}")


# Singleton instance
sandbox = DockerSandbox()
