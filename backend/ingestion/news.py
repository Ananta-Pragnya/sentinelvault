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
    "Americas": [
        "us", "usa", "united states", "america", "american", "canada", "canadian",
        "brazil", "brazilian", "mexico", "mexican", "argentina", "chile", "colombia",
        "new york", "wall street", "federal reserve", "nasdaq", "nyse", "s&p",
        "washington", "silicon valley", "toronto", "sao paulo", "buenos aires",
    ],
    "Europe": [
        "europe", "european", "eu", "uk", "britain", "british", "england",
        "germany", "german", "france", "french", "italy", "italian", "spain", "spanish",
        "netherlands", "sweden", "switzerland", "swiss", "poland", "russia", "russian",
        "ukraine", "ecb", "boe", "bundesbank", "london", "paris", "berlin", "frankfurt",
        "amsterdam", "zurich", "geneva", "milan", "madrid", "stockholm", "oslo",
    ],
    "APAC": [
        "china", "chinese", "japan", "japanese", "india", "indian", "asia", "asian",
        "australia", "australian", "korea", "korean", "singapore", "taiwan", "taiwanese",
        "hong kong", "indonesia", "thailand", "vietnam", "malaysia", "philippines",
        "pboc", "boj", "rbi", "nikkei", "sensex", "asx", "hang seng", "kospi",
        "tokyo", "beijing", "shanghai", "mumbai", "sydney", "seoul", "jakarta",
        "manila", "bangkok", "kuala lumpur", "taipei", "new zealand",
    ],
    "Middle East": [
        "saudi", "saudi arabia", "iran", "iranian", "israel", "israeli", "opec",
        "gulf", "dubai", "uae", "abu dhabi", "qatar", "kuwait", "bahrain", "oman",
        "jordan", "iraq", "turkey", "turkish", "egypt", "egyptian", "middle east",
        "aramco", "riyadh", "tehran", "tel aviv", "istanbul", "ankara",
    ],
    "Africa": [
        "africa", "african", "nigeria", "nigerian", "kenya", "kenyan",
        "south africa", "south african", "egypt", "egyptian", "ghana", "ethiopia",
        "tanzania", "morocco", "angola", "cameroon", "rwanda", "senegal",
        "johannesburg", "lagos", "nairobi", "cairo", "accra", "addis ababa",
        "jse", "rand", "naira",
    ],
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
