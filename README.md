# SentinelVault

> AI-powered alert forecasting platform for financial and geopolitical risk intelligence.

Real-time ingestion → NLP enrichment → anomaly detection → LLM summarisation → personalised graded alerts delivered via live dashboard, WebSocket feed, and AI chat assistant.

---

## Features

- **Live ingestion** — NewsAPI, RSS feeds, simulated market signals
- **5-layer AI pipeline** — NLP → geo-tagging → IsolationForest anomaly → causal chain → XGBoost-style forecast → Claude LLM summary
- **Personalised scoring** — `S = w1·Impact + w2·Proximity + w3·Velocity + w4·Novelty` tuned to each user's profile
- **RLHF weight updates** — alerts you act on increase that component's weight; dismissed alerts reduce it
- **Live dashboard** — WebSocket alert feed with severity filter + SVG world heat map
- **AI assistant** — chat interface powered by Claude with access to your recent alerts and profile
- **4-step onboarding** — asset classes, geographic exposure, role, risk tolerance, alert volume
- **Docker Compose** — single command startup

---

## Quick Start

```bash
# Clone
git clone https://github.com/Ananta-Pragnya/sentinelvault.git
cd sentinelvault

# Configure
cp .env.example .env
# Edit .env — fill in ANTHROPIC_API_KEY, NEWS_API_KEY, JWT_SECRET

# Launch everything
docker compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000  
API docs: http://localhost:8000/docs

---

## Local Dev (no Docker)

```bash
# Start infra
docker compose up postgres redis -d

# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async URL |
| `REDIS_URL` | Redis connection URL |
| `ANTHROPIC_API_KEY` | Claude API key (required for LLM features) |
| `NEWS_API_KEY` | newsapi.org key (optional — RSS works without it) |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRE_MINUTES` | Token lifetime (default 1440 = 24h) |

---

## Architecture

```
[Sources]  NewsAPI · RSS · Market feed
    ↓
[Processing]  NLP · Geo-tagging · Dedup via cosine similarity
    ↓  Redis Streams
[AI Core]  IsolationForest anomaly · Causal chains · Forecast · Claude summary
    ↓
[Grading]  Personalised score S ∈ [0,1] → Critical / High / Medium / Low
    ↓
[Delivery]  WebSocket dashboard · AI chat assistant · REST API
    ↓
[Feedback]  RLHF weight update per user action
```

---

## Scoring

```
S = (w1 × impact) + (w2 × proximity) + (w3 × velocity) + (w4 × novelty)

Default weights: w1=0.35  w2=0.30  w3=0.20  w4=0.15
Critical ≥ 0.85 | High ≥ 0.65 | Medium ≥ 0.40 | Low < 0.40
```

---

## Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy async, Alembic, Redis Streams
- **ML:** scikit-learn (IsolationForest), sentence-transformers (all-MiniLM-L6-v2)
- **LLM:** Groq — llama-3.3-70b-versatile (free tier)
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS v3
- **Auth:** JWT (python-jose + bcrypt)
- **Infra:** Docker Compose (PostgreSQL 16 + Redis 7)

---

Built with [Claude Code](https://claude.ai/claude-code)
