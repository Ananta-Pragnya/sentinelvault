import asyncio
import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import AsyncSessionLocal
from models.user import User
from models.event import RawEvent
from models.alert import Alert
from core.events import event_bus
from processing.pipeline import process_event
from intelligence.anomaly import anomaly_detector
from intelligence.causal import score_causal_chain
from intelligence.forecast import forecast_probability
from intelligence.llm import summarise_event
from grading.scorer import compute_score, severity_meets_volume

logger = logging.getLogger(__name__)

_recent_embeddings: list[list[float]] = []
_recent_events: list[dict] = []
MAX_RECENT = 100


async def _persist_event(raw: dict, db: AsyncSession) -> RawEvent:
    event = RawEvent(
        id=str(uuid.uuid4()),
        source=raw.get("source", "unknown"),
        raw_content=raw.get("raw_content", ""),
        geo_bbox=raw.get("geo_bbox"),
        asset_tags=raw.get("asset_tags", []),
        timestamp=datetime.utcnow(),
        processed=False,
    )
    db.add(event)
    await db.flush()
    return event


async def _process_and_grade(raw_msg: dict):
    global _recent_embeddings, _recent_events

    async with AsyncSessionLocal() as db:
        enriched = await process_event(raw_msg, _recent_embeddings)
        emb = enriched.get("embedding", [])
        if emb:
            _recent_embeddings = (_recent_embeddings + [emb])[-MAX_RECENT:]

        db_event = await _persist_event(enriched, db)
        enriched["id"] = db_event.id

        is_anomaly, magnitude = anomaly_detector.score(enriched)
        causal_chain = score_causal_chain(enriched, _recent_events)
        forecast = forecast_probability(enriched, magnitude)

        try:
            llm_result = await summarise_event({
                "content": enriched["raw_content"][:500],
                "asset_tags": enriched["asset_tags"],
                "geo_bbox": enriched.get("geo_bbox"),
                "anomaly_magnitude": magnitude,
                "forecast": forecast,
                "causal_chain": causal_chain,
            })
        except Exception as exc:
            logger.warning(f"LLM summarise failed: {exc}")
            llm_result = {
                "title": enriched["raw_content"][:60],
                "summary": enriched["raw_content"][:200],
                "rationale_bullets": ["Automated signal detected.", f"Anomaly magnitude: {magnitude:.2f}"],
            }

        result = await db.execute(select(User))
        users = result.scalars().all()

        for user in users:
            grading = compute_score(
                event_tags=enriched["asset_tags"],
                event_bbox=enriched.get("geo_bbox"),
                anomaly_magnitude=magnitude,
                source_velocity=enriched.get("novelty", 0.5),
                novelty=enriched.get("novelty", 0.5),
                user_profile=user.profile or {},
                user_weights=user.weights or {},
            )

            volume_pref = (user.profile or {}).get("alert_volume", "medium")
            if not severity_meets_volume(grading["severity"], volume_pref):
                continue

            alert = Alert(
                id=str(uuid.uuid4()),
                event_id=db_event.id,
                user_id=user.id,
                title=llm_result.get("title", "Alert"),
                summary=llm_result.get("summary", ""),
                rationale="\n".join(llm_result.get("rationale_bullets", [])),
                severity=grading["severity"],
                score=grading["score"],
                impact_score=grading["impact_score"],
                proximity_score=grading["proximity_score"],
                velocity_score=grading["velocity_score"],
                novelty_score=grading["novelty_score"],
                anomaly_flag=is_anomaly,
                causal_chain=causal_chain,
                forecast=forecast,
                sources=[enriched.get("url", "")],
                geo_bbox=enriched.get("geo_bbox"),
                asset_tags=enriched["asset_tags"],
                created_at=datetime.utcnow(),
            )
            db.add(alert)
            await db.flush()

            await event_bus.publish_alert(user.id, {
                "id": alert.id,
                "title": alert.title,
                "severity": alert.severity,
                "score": alert.score,
                "summary": alert.summary,
                "asset_tags": alert.asset_tags,
                "created_at": alert.created_at.isoformat(),
            })

        db_event.processed = True
        await db.commit()

        _recent_events = (_recent_events + [enriched])[-MAX_RECENT:]


async def run_worker():
    logger.info("Worker started — consuming event stream")
    async for msg_id, raw_msg in event_bus.consume("worker-1"):
        try:
            await _process_and_grade(raw_msg)
        except Exception as exc:
            logger.error(f"Worker error processing {msg_id}: {exc}")
        finally:
            await event_bus.ack(msg_id)
