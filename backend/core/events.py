import json
import asyncio
import redis.asyncio as aioredis
from config import get_settings

cfg = get_settings()

STREAM_KEY = "alert:events"
CONSUMER_GROUP = "alert-workers"


class EventBus:
    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def connect(self):
        self._redis = await aioredis.from_url(cfg.redis_url, decode_responses=True)
        try:
            await self._redis.xgroup_create(STREAM_KEY, CONSUMER_GROUP, id="0", mkstream=True)
        except Exception:
            pass  # group already exists

    async def publish(self, event: dict) -> str:
        payload = {"data": json.dumps(event)}
        msg_id = await self._redis.xadd(STREAM_KEY, payload)
        return msg_id

    async def consume(self, consumer_name: str, batch_size: int = 10):
        while True:
            messages = await self._redis.xreadgroup(
                CONSUMER_GROUP,
                consumer_name,
                {STREAM_KEY: ">"},
                count=batch_size,
                block=1000,
            )
            if not messages:
                await asyncio.sleep(0.1)
                continue
            for _, msg_list in messages:
                for msg_id, fields in msg_list:
                    yield msg_id, json.loads(fields["data"])

    async def ack(self, msg_id: str):
        await self._redis.xack(STREAM_KEY, CONSUMER_GROUP, msg_id)

    async def publish_alert(self, user_id: str, alert: dict):
        channel = f"user:{user_id}:alerts"
        await self._redis.publish(channel, json.dumps(alert))

    async def subscribe_user(self, user_id: str):
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(f"user:{user_id}:alerts")
        return pubsub


event_bus = EventBus()
