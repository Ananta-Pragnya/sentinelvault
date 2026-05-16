from pydantic import BaseModel
from datetime import datetime
from typing import Any


class AlertResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    title: str
    summary: str
    rationale: str
    severity: str
    score: float
    impact_score: float
    proximity_score: float
    velocity_score: float
    novelty_score: float
    anomaly_flag: bool
    causal_chain: list[Any]
    forecast: dict[str, Any]
    sources: list[str]
    geo_bbox: dict[str, Any] | None
    asset_tags: list[str]
    user_action: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeedbackRequest(BaseModel):
    alert_id: str
    action: str  # "acted" | "acknowledged" | "dismissed"


class AssistantRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []
