from processing.nlp import cosine_similarity

CAUSAL_RELATIONS = [
    ("oil price spike", "inflation risk"),
    ("fed rate hike", "bond sell-off"),
    ("earnings miss", "equity decline"),
    ("geopolitical tension", "safe haven flows"),
    ("currency depreciation", "import inflation"),
]


def score_causal_chain(event: dict, recent_events: list[dict]) -> list[dict]:
    chain = []
    emb = event.get("embedding", [])
    if not emb:
        return chain

    for prev in recent_events[-20:]:
        prev_emb = prev.get("embedding", [])
        if not prev_emb:
            continue
        sim = cosine_similarity(emb, prev_emb)
        if 0.4 < sim < 0.9:
            chain.append({
                "event_id": prev.get("id", "unknown"),
                "relation": "correlated",
                "probability": round(sim, 3),
            })

    return chain[:5]
