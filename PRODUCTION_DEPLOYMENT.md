# 🚀 CodeArena — Production Deployment Guide (Free Tier)

This guide takes your local CodeArena codebase and deploys it to **live production URLs** on the web completely for free so real users can battle each other from anywhere.

---

## 🏗️ Production Architecture Overview

```text
[ Real Users ]
      │
      ├─── HTTPS ───> [ Vercel ] (Frontend React SPA)
      │                     │
      │                     │ REST API & WebSocket Duplex
      │                     v
      └─── WSS ─────> [ Render ] (Backend FastAPI + python-socketio)
                            │
               ┌────────────┴────────────┐
               v                         v
       [ Neon.tech ]              [ Upstash Redis ]
  (Serverless PostgreSQL)    (Serverless Cache & Queue)
```

---

## Step 1: Set Up Free Cloud Database (Neon PostgreSQL)

1. Go to **[neon.tech](https://neon.tech)** and sign up for free (using GitHub).
2. Create a project named **`codearena`**.
3. Under **Dashboard**, copy your **Connection String** (`postgresql://...`).
4. Modify the prefix to use the async driver:
   - Change `postgresql://` to `postgresql+asyncpg://`
   - Example:
     `postgresql+asyncpg://alex:pass@ep-cool-lake-1234.us-east-2.aws.neon.tech/neondb?ssl=require`
   *(Save this URL for Step 3).*

---

## Step 2: Set Up Free Serverless Redis (Upstash)

1. Go to **[upstash.com](https://upstash.com)** and sign up for free.
2. Click **Create Database** → Name: **`codearena-redis`** → Select Region close to your backend (e.g. `US-East` or `AP-South`).
3. Under the **Details** tab, copy the **Redis URL**:
   `redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`
   *(Save this URL for Step 3).*

---

## Step 3: Deploy Backend on Render (WebSockets & API)

1. Go to **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `sachin2711-code/codearena`.
4. Configure the service:
   - **Name**: `codearena-backend`
   - **Region**: Oregon or Frankfurt
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Advanced** → **Add Environment Variables**:
   ```ini
   DATABASE_URL = <Your Neon URL from Step 1>
   REDIS_URL = <Your Upstash URL from Step 2>
   CELERY_BROKER_URL = <Your Upstash URL from Step 2>
   ENVIRONMENT = production
   SECRET_KEY = <Generate any 32-character random string>
   FRONTEND_URL = *
   ```
6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to finish. Once live, copy your backend URL:
   `https://codearena-backend.onrender.com`

---

## Step 4: Deploy Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `codearena` repository.
4. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select **`frontend`**
5. Expand **Environment Variables**:
   ```ini
   VITE_API_URL = https://codearena-backend.onrender.com/api/v1
   VITE_WS_URL = https://codearena-backend.onrender.com
   ```
6. Click **Deploy**!
7. Within 60 seconds, your site is live with global SSL:
   `https://codearena.vercel.app`

---

## Step 5: Test Real User Flows

1. Open your live Vercel URL in **two different browser windows** (or share with a friend).
2. Click **"CHALLENGE FRIEND"** on the dashboard.
3. Click **"Create Challenge Link"** and copy the private duel URL:
   `https://codearena.vercel.app/duel/7X92B1`
4. Paste the link into the second window — both players instantly get matched into the battle arena!
