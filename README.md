# CodeArena ⚔️

> **Speed chess, but for competitive programming.**  
> Two programmers matched by rating, given the identical algorithmic challenge, racing to pass all hidden test cases in real-time.

Built by **[Sachin Kumar Upadhyay](https://github.com/sachin2711-code)**  
*NIT Patna • LeetCode Knight (Peak: 1897, 600+ Solved) • CodeChef 3★ (1654)*

---

## 🎯 The Motivation

Practicing on LeetCode or Codeforces is almost always asynchronous: you write code, submit it against test cases, and wait. But real-world technical interviews and competitive rounds are high-pressure and time-sensitive. 

I wanted to build a platform that brings the **real-time adrenaline of Chess.com speed duels into competitive programming**:
- Players join a matchmaking pool and get paired within **±100 ELO points**.
- Both coders receive the exact same problem statement and a synchronized 15-minute countdown.
- As you pass test cases, your opponent sees your progress bar tick forward in real-time over WebSockets (and vice versa).
- Once the duel finishes, an algorithmic review engine breaks down the asymptotic Big-O Time & Space complexities of both submissions and surfaces the optimal editorial approach.

---

## 🏗️ System Architecture

```text
               +-------------------------------------------------------+
               |            Client (React 18 + TypeScript)             |
               |       Monaco Editor • Animated Cursor • Zustand       |
               +---------------------------+---------------------------+
                                           |
                                  HTTP     |  WebSocket (Duplex)
                                  REST     |  Sub-50ms Latency
                                           v
               +-------------------------------------------------------+
               |         FastAPI ASGI Gateway (python-socketio)        |
               +-------------+-----------------------------+-----------+
                             |                             |
              Matchmaking &  |                             |  Task Dispatch
              State Cache    v                             v
               +---------------------------+  +------------------------+
               |     Redis 7 (In-Memory)   |  |   Celery Task Queue    |
               |  • ZRANGEBYSCORE (Queue)  |  +------------+-----------+
               |  • Pub/Sub Event Routing  |               |
               |  • Sliding Window Limiter |               v Worker Task
               +---------------------------+  +------------------------+
                             |                | Docker SDK Sandbox     |
                             v                | • Network: none        |
               +---------------------------+  | • Memory: 256MB cap    |
               |  PostgreSQL 16 / SQLite   |  | • CPU Quota: 50%       |
               |  Users, Matches, History  |  | • Timeout: 2.0s Hard   |
               +---------------------------+  +------------------------+
```

---

## 🔬 Core Engineering Highlights

### 1. Redis Sorted Set Matchmaking (`O(log N + M)`)
Instead of hammering a relational database with periodic polling queries (`SELECT * FROM queue WHERE...`), players entering matchmaking are added to a **Redis Sorted Set** where their score is their current ELO rating:
```python
# Matchmaking queue push
await redis.zadd("matchmaking_queue", {user_id: user_elo})

# Range query to find contenders within ±100 ELO points
contenders = await redis.zrangebyscore(
    "matchmaking_queue", 
    min=user_elo - 100, 
    max=user_elo + 100
)
```
This ensures matchmaking lookups execute with logarithmic time complexity, pairing players in milliseconds without table locks.

### 2. Air-Gapped Code Execution Sandbox
Running arbitrary user-submitted code is dangerous. A single malicious submission could run a fork bomb, open a reverse shell, or peg the server CPU to 100%.

CodeArena implements **7 defense-in-depth isolation layers** using the Docker SDK:
- **Zero Network Access (`--network none`)**: Drops all socket capabilities, preventing SSRF, external network calls, and data exfiltration.
- **Strict Memory Cgroup Ceiling (256MB)**: Prevents heap-allocation memory exhaustion attacks.
- **Hard CPU Quota (`cpu_quota=50000`)**: Caps execution to 50% of a single CPU core.
- **Read-Only Root Filesystem**: Prevents saving files or modifying system binaries.
- **Non-Root Execution**: Runs under an unprivileged `sandboxuser` (UID 1000).
- **Process Ephemerality**: Containers are spawned per-submission and force-killed after a 2-second timeout.
- **Local Fallback Mode**: If Docker Desktop is not running during local development, an isolated subprocess fallback mode safely executes Python and JavaScript with strict timeout guards.

### 3. Decoupled Asynchronous Worker Pipeline
Code evaluation is inherently CPU-bound. If the main FastAPI ASGI event loop waited for code compilation and 10+ test case executions, WebSocket heartbeats would drop and other active matches would freeze. 
- Submissions are dispatched immediately to a **Celery task queue**.
- Test case results are streamed back event-by-event to both players via **Redis Pub/Sub** and Socket.IO rooms.

### 4. Algorithmic Match Editorial
After each duel, the platform parses both players' code and generates a technical editorial:
- Asymptotic Big-O Time and Space analysis (e.g. $O(N)$ hash-table scan vs $O(N^2)$ nested loops).
- Identifies inefficiencies (e.g. repeated string concatenation vs list buffer).
- Provides a clean, syntax-highlighted optimal reference implementation.

### 5. Campus Branch Rivalry Aggregator
Designed for intra-campus competitive dynamics (e.g., CSE vs ECE vs MECH):
- Real-time SQL window aggregation tracking aggregate departmental ELO, total duels won, and win-rate percentages.
- Dynamic filtering by graduation year and academic department for localized leaderboards.

### 6. Real-Time Spectator & Auditorium Projector Mode
Built for live campus hackathons and finals duels:
- Dedicated `/spectate/:matchId` low-latency broadcast view designed for 1080p/4K auditorium projectors.
- Socket rooms broadcast dual progress bars, keystroke telemetry, and instant win banners without exposing private participant sessions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Monaco Editor (VS Code in-browser), Zustand, Socket.IO Client, Lucide Icons |
| **Backend** | Python 3.11, FastAPI (Async), python-socketio (ASGI), Celery, SQLAlchemy 2.0 Async, Pydantic V2 |
| **Data & Cache** | PostgreSQL 16 (Primary DB), Redis 7 (Queue, Cache, Pub/Sub), SQLite (zero-config local dev) |
| **Execution Sandbox** | Docker SDK for Python, Isolated GCC 13, Python 3.11, Node.js 20 micro-containers |
| **AI Editorial** | Google Gemini 1.5 Flash API (with rule-based heuristics fallback) |
| **DevOps** | Docker Compose, Nginx Reverse Proxy, GitHub Actions CI/CD |

---

## ⚡ Quick Start

You can run CodeArena either with **Docker** (recommended for production) or **locally in development mode** (zero Docker required).

### Option A: Local Dev Setup (Fastest — 2 Minutes)

#### 1. Start the Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The backend automatically creates a local SQLite database (`codearena.db`) and seeds 10 algorithmic problems with test cases on first run.

#### 2. Start the Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

### Option B: Docker Compose (Full Stack with PostgreSQL & Redis)

Make sure Docker Desktop is running, then run:

```bash
docker compose up --build
```

Services exposed:
- **Web App**: http://localhost:3000
- **FastAPI Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## ⌨️ Contest Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + '` | Run visible sample test cases |
| `Ctrl + Enter` | Submit code against all hidden test cases |
| `Escape` | Dismiss modal or cancel queue |

---

## 📁 Repository Structure

```text
codearena/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + Socket.IO ASGI mount
│   │   ├── database.py          # SQLAlchemy 2.0 async engine & sessionmaker
│   │   ├── models/              # User, Match, Problem, Submission models
│   │   ├── routers/             # Auth, Problems, Matches, Leaderboard
│   │   ├── services/            # Matchmaking, Judge, ELO, AI Analysis
│   │   ├── sockets/             # Real-time WebSocket battle & queue events
│   │   ├── tasks/               # Celery worker tasks for code run
│   │   └── utils/               # Docker Sandbox & JWT Security
│   ├── problems/                # Seed problems (Two Sum, Max Subarray, etc.)
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, ProblemPanel, CodeEditor, AnimatedCursor
│   │   ├── pages/               # Landing, Battle, Matchmaking, Dashboard
│   │   ├── services/            # Axios API & Socket.IO client
│   │   ├── stores/              # Zustand Auth & Match stores
│   │   └── types/               # TypeScript interfaces
│   ├── package.json             # NPM dependencies
│   └── Dockerfile               # Multi-stage Nginx build
├── nginx/
│   └── nginx.conf               # Reverse proxy config
├── docker-compose.yml           # Unified multi-service orchestration
└── README.md
```

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
