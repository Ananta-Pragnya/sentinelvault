from processing.nlp import extract_entities, embed
from processing.geo import geo_tags_to_bbox
from processing.clustering import compute_novelty
from datetime import datetime


async def process_event(raw: dict, recent_embeddings: list[list[float]]) -> dict:
    text = raw.get("raw_content", "")
    entities = extract_entities(text)
    emb = embed(text)
    geo_bbox = geo_tags_to_bbox(raw.get("geo_tags", []))
    novelty = compute_novelty(emb, recent_embeddings)

    asset_tags = list(set(raw.get("asset_tags", []) + entities.get("tickers", [])))

    return {
        "source": raw.get("source", "unknown"),
        "raw_content": text,
        "geo_bbox": geo_bbox,
        "asset_tags": asset_tags,
        "embedding": emb,
        "sentiment": entities["sentiment"],
        "intent": entities["intent"],
        "novelty": novelty,
        "url": raw.get("url", ""),
        "timestamp": raw.get("timestamp", datetime.utcnow().isoformat()),
    }
