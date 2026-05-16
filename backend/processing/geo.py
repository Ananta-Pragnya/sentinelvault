REGION_BBOX = {
    "Americas":    {"lat_min": -60, "lat_max": 75,  "lon_min": -170, "lon_max": -30},
    "Europe":      {"lat_min": 35,  "lat_max": 72,  "lon_min": -25,  "lon_max": 45},
    "APAC":        {"lat_min": -50, "lat_max": 55,  "lon_min": 60,   "lon_max": 180},
    "Middle East": {"lat_min": 12,  "lat_max": 42,  "lon_min": 25,   "lon_max": 65},
    "Africa":      {"lat_min": -35, "lat_max": 38,  "lon_min": -20,  "lon_max": 55},
}


def geo_tags_to_bbox(geo_tags: list[str]) -> dict | None:
    if not geo_tags:
        return None
    bboxes = [REGION_BBOX[tag] for tag in geo_tags if tag in REGION_BBOX]
    if not bboxes:
        return None
    return {
        "lat_min": min(b["lat_min"] for b in bboxes),
        "lat_max": max(b["lat_max"] for b in bboxes),
        "lon_min": min(b["lon_min"] for b in bboxes),
        "lon_max": max(b["lon_max"] for b in bboxes),
    }
