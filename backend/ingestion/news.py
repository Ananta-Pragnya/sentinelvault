import httpx
import feedparser
from datetime import datetime
from ingestion.base import BaseIngester
from config import get_settings

cfg = get_settings()

RSS_FEEDS = [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://rss.ft.com/rss/time/sections/a16dda28-1dbc-11e4-9e34-00144feab7de",
]

ASSET_KEYWORDS = {
    "equities": ["stock", "equity", "shares", "nasdaq", "s&p", "dow", "ipo"],
    "fx": ["forex", "currency", "dollar", "euro", "yen", "pound", "fed rate"],
    "commodities": ["oil", "gold", "silver", "wheat", "copper", "crude"],
    "crypto": ["bitcoin", "ethereum", "crypto", "blockchain", "defi"],
    "fixed_income": ["bond", "treasury", "yield", "debt", "interest rate"],
    "real_estate": ["real estate", "housing", "mortgage", "reits", "property"],
}

GEO_KEYWORDS = {
    "Americas": ["us", "usa", "united states", "america", "canada", "brazil", "mexico"],
    "Europe": ["europe", "eu", "uk", "britain", "germany", "france", "ecb"],
    "APAC": ["china", "japan", "india", "asia", "australia", "korea", "singapore"],
    "Middle East": ["saudi", "iran", "israel", "opec", "gulf", "dubai", "uae"],
    "Africa": ["africa", "nigeria", "kenya", "south africa", "egypt"],
}


def _tag_assets(text: str) -> list[str]:
    lower = text.lower()
    return [cls for cls, kws in ASSET_KEYWORDS.items() if any(k in lower for k in kws)]


def _tag_geo(text: str) -> list[str]:
    lower = text.lower()
    return [region for region, kws in GEO_KEYWORDS.items() if any(k in lower for k in kws)]


class NewsIngester(BaseIngester):
    async def fetch(self) -> list[dict]:
        events = []
        events.extend(await self._fetch_newsapi())
        events.extend(self._fetch_rss())
        return events

    async def _fetch_newsapi(self) -> list[dict]:
        if not cfg.news_api_key:
            return []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/top-headlines",
                    params={"category": "business", "pageSize": 20, "apiKey": cfg.news_api_key},
                )
                resp.raise_for_status()
                articles = resp.json().get("articles", [])
                return [self._article_to_event(a, "newsapi") for a in articles if a.get("title")]
        except Exception:
            return []

    def _fetch_rss(self) -> list[dict]:
        events = []
        for url in RSS_FEEDS:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:10]:
                    text = f"{entry.get('title', '')} {entry.get('summary', '')}"
                    events.append({
                        "source": url,
                        "raw_content": text,
                        "geo_bbox": None,
                        "asset_tags": _tag_assets(text),
                        "geo_tags": _tag_geo(text),
                        "url": entry.get("link", ""),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception:
                continue
        return events

    def _article_to_event(self, article: dict, source: str) -> dict:
        text = f"{article.get('title', '')} {article.get('description', '')}"
        return {
            "source": source,
            "raw_content": text,
            "geo_bbox": None,
            "asset_tags": _tag_assets(text),
            "geo_tags": _tag_geo(text),
            "url": article.get("url", ""),
            "timestamp": datetime.utcnow().isoformat(),
        }
