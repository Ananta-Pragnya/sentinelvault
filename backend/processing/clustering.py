from processing.nlp import cosine_similarity

SIMILARITY_THRESHOLD = 0.85


def deduplicate(events: list[dict], existing_embeddings: list[list[float]] | None = None) -> list[dict]:
    """Remove near-duplicate events using cosine similarity on embeddings."""
    kept: list[dict] = []
    kept_embeddings: list[list[float]] = list(existing_embeddings or [])

    for event in events:
        emb = event.get("embedding")
        if emb is None:
            kept.append(event)
            continue

        is_duplicate = any(
            cosine_similarity(emb, existing) >= SIMILARITY_THRESHOLD
            for existing in kept_embeddings
        )
        if not is_duplicate:
            kept.append(event)
            kept_embeddings.append(emb)

    return kept


def compute_novelty(embedding: list[float], recent_embeddings: list[list[float]]) -> float:
    if not recent_embeddings:
        return 1.0
    max_sim = max(cosine_similarity(embedding, e) for e in recent_embeddings)
    return round(1.0 - max_sim, 4)
