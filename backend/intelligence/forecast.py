import numpy as np


def forecast_probability(event: dict, anomaly_magnitude: float) -> dict:
    sentiment = event.get("sentiment", 0.0)
    novelty = event.get("novelty", 0.5)
    asset_count = len(event.get("asset_tags", []))

    base_prob = (
        0.4 * anomaly_magnitude +
        0.3 * abs(sentiment) +
        0.2 * novelty +
        0.1 * min(asset_count / 5.0, 1.0)
    )
    probability = float(np.clip(base_prob, 0.0, 1.0))

    confidence_width = 0.15 + (1.0 - probability) * 0.2
    horizon_hours = 24 if probability > 0.7 else (72 if probability > 0.4 else 168)

    return {
        "probability": round(probability, 3),
        "confidence_band": {
            "low": round(max(0.0, probability - confidence_width), 3),
            "high": round(min(1.0, probability + confidence_width), 3),
        },
        "horizon_hours": horizon_hours,
    }
