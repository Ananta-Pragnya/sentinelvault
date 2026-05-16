import re
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None

POSITIVE_WORDS = {"surge", "rally", "growth", "gain", "rise", "strong", "bullish", "profit", "record"}
NEGATIVE_WORDS = {"crash", "plunge", "collapse", "crisis", "warning", "risk", "bear", "loss", "decline", "fall"}


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def extract_entities(text: str) -> dict:
    tickers = re.findall(r'\b[A-Z]{2,5}\b', text)
    tickers = [t for t in tickers if t not in {"US", "EU", "UK", "FED", "GDP", "CPI", "IPO", "USD"}]

    lower = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in lower)
    total = pos + neg
    sentiment = (pos - neg) / total if total > 0 else 0.0

    return {
        "tickers": list(set(tickers[:5])),
        "sentiment": round(sentiment, 3),
        "intent": "risk_alert" if neg > pos else ("opportunity" if pos > neg else "neutral"),
    }


def embed(text: str) -> list[float]:
    model = _get_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    import numpy as np
    a_arr = np.array(a)
    b_arr = np.array(b)
    denom = (np.linalg.norm(a_arr) * np.linalg.norm(b_arr))
    if denom == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / denom)
