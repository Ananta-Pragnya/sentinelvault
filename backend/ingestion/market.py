import random
from datetime import datetime
from ingestion.base import BaseIngester

TICKERS = ["AAPL", "TSLA", "NVDA", "SPY", "QQQ", "BTC-USD", "GLD", "TLT", "EUR/USD", "OIL"]

TICKER_GEO = {
    "AAPL": ["Americas"], "TSLA": ["Americas"], "NVDA": ["Americas"],
    "SPY": ["Americas"], "QQQ": ["Americas"],
    "BTC-USD": ["Americas", "Europe", "APAC"],
    "GLD": ["Americas", "Middle East"],
    "TLT": ["Americas"],
    "EUR/USD": ["Americas", "Europe"],
    "OIL": ["Americas", "Middle East"],
}
EVENTS = [
    "Unusual volume spike detected in {ticker}",
    "{ticker} breaks key resistance level",
    "Institutional accumulation observed in {ticker}",
    "Short interest surge in {ticker}",
    "{ticker} implied volatility expands sharply",
    "Options flow anomaly detected in {ticker}",
    "{ticker} correlation divergence with sector",
    "Liquidity drop-off in {ticker} order book",
]


class MarketIngester(BaseIngester):
    async def fetch(self) -> list[dict]:
        events = []
        for _ in range(random.randint(2, 6)):
            ticker = random.choice(TICKERS)
            template = random.choice(EVENTS)
            content = template.format(ticker=ticker)
            asset_class = "crypto" if "BTC" in ticker else (
                "fx" if "/" in ticker else (
                    "commodities" if ticker in ("GLD", "OIL") else (
                        "fixed_income" if ticker == "TLT" else "equities"
                    )
                )
            )
            events.append({
                "source": "market_feed",
                "raw_content": content,
                "geo_bbox": None,
                "asset_tags": [asset_class],
                "geo_tags": TICKER_GEO.get(ticker, ["Americas"]),
                "url": "",
                "timestamp": datetime.utcnow().isoformat(),
            })
        return events
