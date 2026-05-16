from apscheduler.schedulers.asyncio import AsyncIOScheduler
from ingestion.news import NewsIngester
from ingestion.market import MarketIngester
from core.events import event_bus
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()
_news = NewsIngester()
_market = MarketIngester()


async def _ingest_news():
    try:
        events = await _news.fetch()
        for e in events:
            await event_bus.publish(e)
        logger.info(f"Ingested {len(events)} news events")
    except Exception as exc:
        logger.error(f"News ingestion error: {exc}")


async def _ingest_market():
    try:
        events = await _market.fetch()
        for e in events:
            await event_bus.publish(e)
        logger.info(f"Ingested {len(events)} market events")
    except Exception as exc:
        logger.error(f"Market ingestion error: {exc}")


def start_scheduler():
    scheduler.add_job(_ingest_news, "interval", minutes=5, id="news_ingest")
    scheduler.add_job(_ingest_market, "interval", minutes=1, id="market_ingest")
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
