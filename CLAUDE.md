# SentinelVault — Claude Code Session Memory

## Project Overview
AI-powered alert forecasting platform. Ingests news + market data in real time, runs anomaly detection + LLM summarisation, and delivers personalised alerts via a live dashboard, WebSocket feed, and AI chat assistant.

---

## Locations
- **Repo:** `C:\Users\user\Desktop\Claude Repo Projects\Sleaky All Ears`
- **GitHub:** https://github.com/Ananta-Pragnya/sentinelvault
- **Backend entry:** `backend/main.py`
- **Frontend entry:** `frontend/app/layout.tsx` (Next.js 14 App Router)

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Backend | FastAPI + uvicorn, Python 3.12 |
| Database | PostgreSQL (SQLAlchemy async + Alembic) |
| Cache / Streams | Redis 7 (pub/sub + Redis Streams) |
| ML | scikit-learn IsolationForest, sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Anthropic API — claude-sonnet-4-20250514 |
| Ingestion | NewsAPI + RSS (feedparser) + simulated market feed |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS v3 |
| Auth | JWT (python-jose + bcrypt) |
| Infra | Docker Compose (single command) |

---

## Architecture — 5-Layer Pipeline
```
[Sources]  NewsAPI · RSS · Simulated market feed
    ↓  normalise + dedupe
[Processing]  NLP (entities + sentiment) · Geo-tagging · Novelty via cosine similarity
    ↓  enriched events on Redis Stream
[AI Core]  IsolationForest anomaly · Causal chain scoring · Forecast · LLM summary
    ↓  scored signal + rationale
[Grading]  S = w1·Impact + w2·Proximity + w3·Velocity + w4·Novelty  (per-user weights)
    ↓  graded alert persisted to PostgreSQL + published to user pub/sub channel
[Delivery]  /dashboard WebSocket feed · /assistant chat · REST API
    ↓
[Feedback loop]  RLHF weight update → PostgreSQL
```

---

## Key Files
```
backend/
  main.py                   — FastAPI app + lifespan (connects bus, starts scheduler + worker)
  config.py                 — pydantic-settings (reads .env)
  database.py               — async SQLAlchemy engine + Base
  models/                   — User, RawEvent, Alert ORM models
  schemas/                  — Pydantic request/response schemas
  api/                      — auth, alerts, profile, feedback, assistant, ws
  ingestion/                — NewsIngester (NewsAPI + RSS), MarketIngester, APScheduler
  processing/               — nlp.py, geo.py, clustering.py, pipeline.py
  intelligence/             — anomaly.py, causal.py, forecast.py, llm.py
  grading/                  — scorer.py (S formula), weights.py (RLHF)
  core/                     — events.py (EventBus / Redis Streams), worker.py (consumer loop)
  migrations/               — Alembic env.py + 0001_initial migration

frontend/
  app/layout.tsx            — root layout
  app/page.tsx              — redirect → /onboarding or /dashboard
  app/onboarding/page.tsx   — 4-step profile wizard
  app/dashboard/page.tsx    — live feed + world map + severity filter
  app/assistant/page.tsx    — AI chat interface
  components/
    OnboardingWizard.tsx    — multi-step auth + profile form
    AlertFeed.tsx           — WebSocket consumer + alert list (auto-reconnect)
    AlertCard.tsx           — single alert with Act/Ack/Dismiss feedback
    WorldMap.tsx            — SVG heat map of geotagged alerts
    SeverityBadge.tsx       — Critical/High/Medium/Low colour-coded badge
    AssistantChat.tsx       — streaming chat with AI assistant
```

---

## Scoring Formula
```
S = (w1 * impact) + (w2 * proximity) + (w3 * velocity) + (w4 * novelty)

Severity:  S ≥ 0.85 → critical | S ≥ 0.65 → high | S ≥ 0.40 → medium | else → low
RLHF:      acted → +0.02 on dominant | dismissed → -0.01 | acknowledged → no change
           re-normalise so w1+w2+w3+w4 = 1.0 after every update
```

---

## Environment Variables (backend/.env)
```
DATABASE_URL=postgresql+asyncpg://alertuser:alertpass@localhost:5432/alertplatform
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=...          # same key as FinMotion (free tier, Llama 3.3 70B)
NEWS_API_KEY=...          # newsapi.org free tier (optional — RSS works without it)
JWT_SECRET=...
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

---

## Running Locally
```bash
# 1. Start infra
docker compose up postgres redis -d

# 2. Backend (from repo root)
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Frontend (from repo root)
cd frontend
npm install
npm run dev   # → http://localhost:3000
```

## One-command Docker start
```bash
cp .env.example .env   # fill in API keys
docker compose up --build
# Backend → http://localhost:8000
# Frontend → http://localhost:3000
```

---

## API Endpoints
```
POST  /auth/register      — create account
POST  /auth/login         — get JWT
GET   /auth/me            — current user
GET   /profile            — full profile + weights
PUT   /profile            — update preferences
GET   /alerts             — paginated alerts (?severity=high&limit=50)
GET   /alerts/{id}        — single alert detail
POST  /feedback           — alert action tracking (RLHF)
POST  /assistant          — AI chat
WS    /ws?token=...       — live alert stream
GET   /health             — health check
```

---

## User Preferences
- Production-quality, no stubs
- Futuristic naming (sentinelvault)
- Windows 11 + PowerShell + Git Bash
- GitHub: Ananta-Pragnya
