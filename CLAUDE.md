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

## Bloomberg Terminal Design System (globals.css)

All UI is built on `bb-*` CSS classes and CSS variables. **Never use Tailwind for layout — use inline styles with these vars.**

### CSS Variables
```css
--bg:#0c0c0c  --bg2:#111111  --bg3:#161616
--bdr:#222222  --bhi:#2e2e2e
--txt:#f5f5f5  --txt2:#888888  --txt3:#444444
--live:#00e676  --live-d:#00331a
--red:#ff4444  --red-d:#1a0000
--ora:#ff8c42  --ora-d:#1a0800
--yel:#e6c340  --yel-d:#1a1500
```

### bb-* Class Reference
| Class | Purpose |
|-------|---------|
| `bb-nav` | 40px top nav bar, flex, borderBottom |
| `bb-brand` | Logo text — 13px 700 letterSpacing 2px |
| `bb-live-badge` | Green bordered pill with blinking dot |
| `bb-live-dot` | 5×5 green dot, blink animation |
| `bb-nav-link` | Nav tab — borderLeft separator, hover→bg3 |
| `bb-nav-btn` | Nav action — `primary` variant = white bg |
| `bb-alert` | 3-col grid row (sev-col / content / score) |
| `bb-alert.selected` | bg3 + 2px white left border |
| `bb-sev-col` | Severity column: 2px vertical bar + rotated label |
| `bb-sev-bar` | 2px×44px colored bar |
| `bb-sev-label` | 8px rotated text label (CRIT/HIGH/MED/LOW) |
| `bb-alert-title` | 12px 700 alert headline |
| `bb-alert-body` | 11px summary text |
| `bb-alert-meta` | Flex row of ticker tags |
| `bb-tick` | Ticker tag — 10px bordered monospace |
| `bb-alert-right` | Right column: ID, age, score number + 1px track |
| `bb-score-num` | 18px 700 score display |
| `bb-score-track` | 48px×1px background track |
| `bb-score-fill` | Filled portion of track |
| `bb-action-btn` | ACT/ACK/DISMISS — 9px bordered; `.acted` = green bg |
| `bb-sidebar-section` | 9px letterSpacing-2 section header, bg2 |
| `bb-sidebar-row` | Key/value row — justify-between, borderBottom |
| `bb-sidebar-key` | 10px dim label |
| `bb-sidebar-val` | 12px 700 value — `.red/.ora/.live/.dim` variants |
| `bb-filter-btn` | Filter tab — `.active` = bg3 |
| `bb-detail-hdr` | Detail panel header — same style as sidebar-section |
| `bb-detail-block` | Padded block with borderBottom |
| `bb-detail-label` | 9px section label within detail block |
| `bb-rationale-line` | Evidence bullet — `>` green prefix via ::before |
| `bb-formula` | Code-style scoring formula box — green text, bg2 border |
| `bb-wt-row` | Weight row: label + 1px track + pct |
| `bb-wt-track / bb-wt-fill` | 1px weight bar |
| `bb-stat` | Stats bar cell — large number + small label |
| `bb-how-step` | Pipeline step cell |
| `bb-hero-tag / bb-hero-h1 / bb-hero-sub` | Landing hero text |
| `bb-terminal-bar` | Mock terminal header bar |
| `bb-btn-white / bb-btn-ghost` | CTA buttons |
| `bb-trust-item` | Green ✓ prefix trust item |
| `bb-cta-h / bb-cta-sub / bb-cta-micro` | CTA section text |
| `bb-ob-node` | Square step indicator — `.done` = white fill, `.active` = green border |
| `bb-ob-connector` | Horizontal connector line between nodes |
| `bb-ob-grid / bb-ob-opt` | Option grid (asset/region pickers) — `.sel` = green bg |
| `bb-ob-input` | Form input — monospace, borderColor transitions |
| `bb-launch / bb-back` | Onboarding CTA and back buttons |
| `bb-chat-user / bb-chat-ai` | Chat message bubbles |
| `bb-chat-input / bb-chat-send` | Chat input bar |
| `ticker-wrap / ticker-inner` | Scrolling ticker marquee |
| `alert-enter` | Slide-up entrance animation |

---

## Key Files

### Frontend
```
frontend/app/globals.css          — Bloomberg design system (bb-* classes + CSS vars)
frontend/app/page.tsx             — Landing: ticker bar → nav → 2-col hero → stats →
                                    5-col pipeline → scoring + dashboard wireframe → CTA
frontend/app/dashboard/page.tsx   — 3-col dashboard: sidebar | alert feed | detail panel
frontend/app/onboarding/page.tsx  — 4-step wizard wrapper (220px left panel + form right)
frontend/app/assistant/page.tsx   — AI chat page with nav back button
frontend/components/
  AlertCard.tsx     — bb-alert row: sev bar | content | score. ACT/ACK/DISMISS → POST /feedback
  AlertFeed.tsx     — WebSocket consumer, exponential backoff reconnect, passes onSelect/selected
  WorldMap.tsx      — Split layout: 280px region table (count bar + severity breakdown)
                      + SVG map (continent polygons, grid lines, 3-ring alert pins)
  OnboardingWizard.tsx — Square node steps, flush grid pickers, handleAuth auto-register flow
  AssistantChat.tsx — SV ANALYST label, green › suggestion prefix, bb-chat-* classes
  SeverityBadge.tsx — Square dot, Bloomberg color palette
```

### Backend
```
backend/main.py                   — FastAPI app + lifespan
backend/config.py                 — pydantic-settings (.env)
backend/database.py               — async SQLAlchemy
backend/models/                   — User, RawEvent, Alert ORM
backend/schemas/                  — Pydantic schemas
backend/api/                      — auth, alerts, profile, feedback, assistant, ws
backend/ingestion/
  news.py     — NewsIngester: NewsAPI + RSS. GEO_KEYWORDS has ~30 terms per region
                including city names (London, Tokyo, Shanghai, Frankfurt, Wall Street…)
  market.py   — MarketIngester: simulated events. TICKER_GEO maps each ticker to
                correct regions (EUR/USD→Europe+Americas, OIL→Middle East+Americas, BTC→global)
backend/processing/
  geo.py      — geo_tags_to_bbox(): single region → exact REGION_BBOX,
                multiple regions → centroid average + 5° spread (prevents Atlantic bbox)
  pipeline.py — orchestrates NLP + geo + clustering
backend/intelligence/             — anomaly.py, causal.py, forecast.py, llm.py
backend/grading/                  — scorer.py (S formula), weights.py (RLHF)
backend/core/                     — events.py (EventBus/Redis Streams), worker.py
backend/migrations/               — Alembic env.py + 0001_initial
```

---

## Dashboard Layout (3-col)
```
180px SIDEBAR  |  flex-1 FEED  |  260px DETAIL
───────────────────────────────────────────────
SYSTEM         │ [filter bar]  │ AI RATIONALE
  STATUS: LIVE │ alert rows    │   SEVERITY
  SIGNALS/HR   │ (bb-alert)    │   SUMMARY
  LATENCY      │               │   EVIDENCE >
  FEED: WS+RSS │               │   FORMULA
ALERTS         │               │   COMPONENT BARS
  CRITICAL: N  │               │   ASSET TAGS
  HIGH: N       │               │   TIMESTAMP
  MEDIUM: N    │               │ (or compact WorldMap
  LOW: N        │               │  when nothing selected)
EXPOSURE       │               │
  AMERICAS     │               │
  EUROPE       │               │
  M.EAST       │               │
  APAC         │               │
RLHF           │               │
  ACTED        │               │
  DISMISSED    │               │
```

NAV_TABS: `["ALERTS", "MAP", "ASSISTANT"]`
- MAP tab: replaces 3-col with full WorldMap (flex:1, overflow:hidden)
- ASSISTANT tab: routes to `/assistant`

---

## WorldMap Component

### Projection
```ts
function project(lat: number, lon: number): [number, number] {
  return [
    ((lon + 180) / 360) * 100,   // x ∈ [0,100]
    ((90 - lat) / 180) * 50,     // y ∈ [0,50] — MUST be *50 not *100
  ];
}
// viewBox: "0 0 100 50"
```

### Continent Polygons (SVG path strings in 100×50 space)
- North America, South America, Greenland, Europe, Africa, Asia, Australia

### Regions
```ts
{ key:"AMERICAS", centLat:40, centLon:-100, match: (_l,lo) => lo < -30 }
{ key:"EUROPE",   centLat:50, centLon:15,   match: (la,lo) => lo>=-25 && lo<45 && la>=35 }
{ key:"M.EAST",   centLat:27, centLon:45,   match: (la,lo) => lo>=25 && lo<65 && la>=12 && la<42 }
{ key:"APAC",     centLat:25, centLon:110,  match: (la,lo) => lo>=60 || (lo>=45 && la<35) }
{ key:"AFRICA",   centLat:1,  centLon:18,   match: (la,lo) => lo>=-20 && lo<55 && la<35 }
```

### Full view layout
- **Left 280px**: per-region exposure table — count bar, CRIT/HIGH/MED/LOW severity breakdown, status label (STABLE/MOD/ELEV/HIGH)
- **Right**: SVG map — lat/lon grid lines, equator, continent fills, centroid labels, 3-ring glow pins (outer opacity 0.04, mid 0.12, core 0.9)

### Compact mode
- `<WorldMap alerts={alerts} compact />` — SVG only, used in detail panel idle state

---

## Geotagging Pipeline

### Flow
```
news.py._tag_geo() → geo_tags list on raw event
  ↓ pipeline.py
geo.py.geo_tags_to_bbox(geo_tags) → geo_bbox JSON
  ↓
Alert.geo_bbox stored in PostgreSQL
  ↓
WorldMap reads alert.geo_bbox → projects lat/lon → SVG circle
```

### geo.py logic
- Single region match → exact `REGION_BBOX` (wide coverage bbox)
- Multiple region match → average `REGION_CENTROID` lat/lons, return 5° spread bbox
  - Prevents pins plotting in Atlantic Ocean for EU+Americas articles

### GEO_KEYWORDS coverage (news.py)
Each region has ~30 keywords including country names, adjectives, cities, central banks, and exchanges.

### TICKER_GEO (market.py)
```python
TICKER_GEO = {
    "AAPL/TSLA/NVDA/SPY/QQQ/TLT": ["Americas"],
    "BTC-USD": ["Americas", "Europe", "APAC"],
    "GLD":     ["Americas", "Middle East"],
    "EUR/USD": ["Americas", "Europe"],
    "OIL":     ["Americas", "Middle East"],
}
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
GROQ_API_KEY=...          # Llama 3.3 70B (free tier)
NEWS_API_KEY=...          # newsapi.org free tier (optional — RSS works without it)
JWT_SECRET=...
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

**CRITICAL:** Never put API keys inline in docker-compose.yml — use `env_file: backend/.env` (gitignored). GitHub push protection will block the commit.

---

## Docker Compose Rules
- Containers address each other by service name (`postgres`, `redis`), NOT localhost
- `NEXT_PUBLIC_*` vars are baked at build time — must rebuild image after changing them
- Never volume-mount frontend service (standalone build — image is self-contained)
- Always use `env_file: backend/.env` for secrets

## Running Locally
```bash
# One-command Docker start
cp .env.example .env   # fill in API keys
docker compose up --build
# Backend  → http://localhost:8000
# Frontend → http://localhost:3000

# Or individually:
docker compose up postgres redis -d
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
cd frontend && npm run dev   # → http://localhost:3000
```

**Always give http://localhost:3000 link when the app is running.**

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
- Always provide http://localhost:3000 when app is running — never just say "running locally"
