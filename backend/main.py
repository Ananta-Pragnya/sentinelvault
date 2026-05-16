import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.events import event_bus
from core.worker import run_worker
from ingestion.scheduler import start_scheduler, stop_scheduler
from api.auth import router as auth_router
from api.alerts import router as alerts_router
from api.profile import router as profile_router
from api.feedback import router as feedback_router
from api.assistant import router as assistant_router
from api.ws import router as ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

_worker_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _worker_task
    await event_bus.connect()
    start_scheduler()
    _worker_task = asyncio.create_task(run_worker())
    logger.info("SentinelVault backend started")
    yield
    stop_scheduler()
    if _worker_task:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
    logger.info("SentinelVault backend stopped")


app = FastAPI(
    title="SentinelVault API",
    description="AI-powered alert forecasting platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(alerts_router)
app.include_router(profile_router)
app.include_router(feedback_router)
app.include_router(assistant_router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentinelvault"}
