from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from database import get_db
from models.alert import Alert
from models.user import User
from schemas.alert import FeedbackRequest
from grading.weights import update_weights

router = APIRouter(prefix="/feedback", tags=["feedback"])

VALID_ACTIONS = {"acted", "acknowledged", "dismissed"}


@router.post("", status_code=200)
async def post_feedback(
    body: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.action not in VALID_ACTIONS:
        raise HTTPException(status_code=422, detail=f"action must be one of {VALID_ACTIONS}")

    result = await db.execute(
        select(Alert).where(Alert.id == body.alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await db.execute(update(Alert).where(Alert.id == alert.id).values(user_action=body.action))

    dominant = _dominant_component(alert)
    new_weights = await update_weights(
        user_id=current_user.id,
        dominant_component=dominant,
        action=body.action,
        current_weights=dict(current_user.weights or {}),
        db=db,
    )

    return {"status": "ok", "updated_weights": new_weights}


def _dominant_component(alert: Alert) -> str:
    scores = {
        "impact": alert.impact_score,
        "proximity": alert.proximity_score,
        "velocity": alert.velocity_score,
        "novelty": alert.novelty_score,
    }
    return max(scores, key=lambda k: scores[k])
