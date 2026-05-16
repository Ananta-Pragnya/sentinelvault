import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    def __init__(self, contamination: float = 0.1):
        self._model = IsolationForest(contamination=contamination, random_state=42)
        self._fitted = False
        self._history: list[list[float]] = []

    def _features(self, event: dict) -> list[float]:
        sentiment = event.get("sentiment", 0.0)
        novelty = event.get("novelty", 0.5)
        asset_count = len(event.get("asset_tags", []))
        content_len = min(len(event.get("raw_content", "")) / 500.0, 1.0)
        return [sentiment, novelty, asset_count / 10.0, content_len]

    def score(self, event: dict) -> tuple[bool, float]:
        feats = self._features(event)
        self._history.append(feats)

        if len(self._history) < 20:
            magnitude = abs(event.get("sentiment", 0.0)) * 0.5 + event.get("novelty", 0.5) * 0.5
            return False, round(magnitude, 4)

        if len(self._history) % 20 == 0 or not self._fitted:
            X = np.array(self._history[-200:])
            self._model.fit(X)
            self._fitted = True

        X_new = np.array([feats])
        pred = self._model.predict(X_new)[0]
        score_raw = self._model.score_samples(X_new)[0]
        magnitude = float(np.clip(-score_raw / 0.5, 0.0, 1.0))
        is_anomaly = pred == -1
        return is_anomaly, round(magnitude, 4)


anomaly_detector = AnomalyDetector()
