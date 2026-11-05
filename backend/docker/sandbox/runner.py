"""Universal execution wrapper for sandbox containers."""

import sys
import subprocess
import time

def run_command(cmd, stdin_data=None, timeout_sec=2):
    start = time.perf_counter()
    try:
        proc = subprocess.run(
            cmd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
        duration_ms = (time.perf_counter() - start) * 1000.0
        return proc.returncode, proc.stdout, proc.stderr, duration_ms
    except subprocess.TimeoutExpired:
        return -1, "", "Time Limit Exceeded", timeout_sec * 1000.0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    command = sys.argv[1:]
    stdin_content = sys.stdin.read()
    code, stdout, stderr, ms = run_command(command, stdin_content)
    sys.stdout.write(stdout)
    sys.stderr.write(stderr)
    sys.exit(code)
