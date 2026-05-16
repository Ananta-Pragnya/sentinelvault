from config import get_settings

cfg = get_settings()

REGION_MAP = {
    "Americas":    {"lat": (-60, 75),  "lon": (-170, -30)},
    "Europe":      {"lat": (35, 72),   "lon": (-25, 45)},
    "APAC":        {"lat": (-50, 55),  "lon": (60, 180)},
    "Middle East": {"lat": (12, 42),   "lon": (25, 65)},
    "Africa":      {"lat": (-35, 38),  "lon": (-20, 55)},
}


def geo_overlap_score(event_bbox: dict | None, user_regions: list[str]) -> float:
    if not event_bbox or not user_regions:
        return 0.1
    for region in user_regions:
        bounds = REGION_MAP.get(region)
        if not bounds:
            continue
        lat_ok = event_bbox.get("lat_min", 0) <= bounds["lat"][1] and event_bbox.get("lat_max", 0) >= bounds["lat"][0]
        lon_ok = event_bbox.get("lon_min", 0) <= bounds["lon"][1] and event_bbox.get("lon_max", 0) >= bounds["lon"][0]
        if lat_ok and lon_ok:
            return 1.0
    return 0.1


def asset_overlap_score(event_tags: list[str], user_classes: list[str]) -> float:
    if not event_tags or not user_classes:
        return 0.0
    event_set = {t.lower() for t in event_tags}
    user_set = {c.lower() for c in user_classes}
    overlap = len(event_set & user_set)
    return min(overlap / max(len(user_set), 1), 1.0)


def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def compute_score(
    event_tags: list[str],
    event_bbox: dict | None,
    anomaly_magnitude: float,
    source_velocity: float,
    novelty: float,
    user_profile: dict,
    user_weights: dict,
) -> dict[str, float]:
    w1 = user_weights.get("w1_impact", cfg.default_w1_impact)
    w2 = user_weights.get("w2_proximity", cfg.default_w2_proximity)
    w3 = user_weights.get("w3_velocity", cfg.default_w3_velocity)
    w4 = user_weights.get("w4_novelty", cfg.default_w4_novelty)

    impact = clamp(asset_overlap_score(event_tags, user_profile.get("asset_classes", [])) * anomaly_magnitude)
    proximity = clamp(geo_overlap_score(event_bbox, user_profile.get("regions", [])))
    velocity = clamp(source_velocity)
    novelty_s = clamp(novelty)

    S = (w1 * impact) + (w2 * proximity) + (w3 * velocity) + (w4 * novelty_s)

    if S >= cfg.threshold_critical:
        severity = "critical"
    elif S >= cfg.threshold_high:
        severity = "high"
    elif S >= cfg.threshold_medium:
        severity = "medium"
    else:
        severity = "low"

    components = {"impact": impact, "proximity": proximity, "velocity": velocity, "novelty": novelty_s}

    return {
        "score": round(clamp(S), 2),
        "severity": severity,
        "impact_score": round(impact, 2),
        "proximity_score": round(proximity, 2),
        "velocity_score": round(velocity, 2),
        "novelty_score": round(novelty_s, 2),
        "dominant": max(components, key=lambda k: components[k]),
    }


def severity_meets_volume(severity: str, volume_pref: str) -> bool:
    ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    GATE = {"low": 3, "medium": 2, "high": 1}
    return ORDER.get(severity, 0) >= GATE.get(volume_pref, 2)
