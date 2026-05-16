from abc import ABC, abstractmethod


class BaseIngester(ABC):
    @abstractmethod
    async def fetch(self) -> list[dict]:
        """Fetch raw events from the source. Returns list of normalized event dicts."""
        ...

    def normalize(self, raw: dict) -> dict:
        return {
            "source": raw.get("source", "unknown"),
            "raw_content": raw.get("content", ""),
            "geo_bbox": raw.get("geo_bbox", None),
            "asset_tags": raw.get("asset_tags", []),
        }
