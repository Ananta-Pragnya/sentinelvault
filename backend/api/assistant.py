from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from database import get_db
from models.alert import Alert
from models.user import User
from schemas.alert import AssistantRequest
from intelligence.llm import assistant_response

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("")
async def chat(
    body: AssistantRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(desc(Alert.created_at))
        .limit(10)
    )
    recent_alerts = [
        {"id": a.id, "title": a.title, "severity": a.severity, "summary": a.summary}
        for a in result.scalars().all()
    ]

    user_context = {"profile": current_user.profile or {}, "recent_alerts": recent_alerts}
    reply = await assistant_response(body.message, body.history, user_context)
    return {"reply": reply}
