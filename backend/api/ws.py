import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy import select

from config import get_settings
from database import AsyncSessionLocal
from models.user import User
from core.events import event_bus

router = APIRouter(tags=["websocket"])
cfg = get_settings()
logger = logging.getLogger(__name__)


async def _authenticate_ws(token: str) -> User | None:
    try:
        payload = jwt.decode(token, cfg.jwt_secret, algorithms=[cfg.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            return None
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            return result.scalar_one_or_none()
    except JWTError:
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user = await _authenticate_ws(token)
    if not user:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    pubsub = await event_bus.subscribe_user(user.id)
    logger.info(f"WebSocket connected: user {user.id}")

    try:
        async def _send_messages():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await websocket.send_text(message["data"])

        async def _keep_alive():
            while True:
                await asyncio.sleep(25)
                await websocket.send_text(json.dumps({"type": "ping"}))

        await asyncio.gather(_send_messages(), _keep_alive())
    except (WebSocketDisconnect, asyncio.CancelledError):
        logger.info(f"WebSocket disconnected: user {user.id}")
    finally:
        await pubsub.unsubscribe()
