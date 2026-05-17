REGION_BBOX = {
    "Americas":    {"lat_min": -60, "lat_max": 75,  "lon_min": -170, "lon_max": -30},
    "Europe":      {"lat_min": 35,  "lat_max": 72,  "lon_min": -25,  "lon_max": 45},
    "APAC":        {"lat_min": -50, "lat_max": 55,  "lon_min": 60,   "lon_max": 180},
    "Middle East": {"lat_min": 12,  "lat_max": 42,  "lon_min": 25,   "lon_max": 65},
    "Africa":      {"lat_min": -35, "lat_max": 38,  "lon_min": -20,  "lon_max": 55},
}

# Canonical centroid per region — used when multiple regions match
REGION_CENTROID = {
    "Americas":    {"lat": 37.09,  "lon": -95.71},   # continental US centre
    "Europe":      {"lat": 50.85,  "lon": 10.20},    # central Europe
    "APAC":        {"lat": 34.05,  "lon": 108.95},   # central Asia/Pacific
    "Middle East": {"lat": 27.00,  "lon": 45.00},    # Arabian Peninsula centre
    "Africa":      {"lat": 1.65,   "lon": 17.54},    # central Africa
}


def geo_tags_to_bbox(geo_tags: list[str]) -> dict | None:
    matched = [tag for tag in geo_tags if tag in REGION_BBOX]
    if not matched:
        return None

    if len(matched) == 1:
        # Single region — use exact bbox
        return REGION_BBOX[matched[0]]

    # Multiple regions — compute a centroid-based pseudo-bbox so the map pin
    # lands at a meaningful point rather than merging into a trans-oceanic box.
    lats = [REGION_CENTROID[r]["lat"] for r in matched]
    lons = [REGION_CENTROID[r]["lon"] for r in matched]
    mid_lat = sum(lats) / len(lats)
    mid_lon = sum(lons) / len(lons)
    spread = 5.0  # degrees — small box around the averaged centroid
    return {
        "lat_min": mid_lat - spread,
        "lat_max": mid_lat + spread,
        "lon_min": mid_lon - spread,
        "lon_max": mid_lon + spread,
    }
