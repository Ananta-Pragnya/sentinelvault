from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from models.user import User

LEARN_RATE = {
    "acted": +0.02,
    "dismissed": -0.01,
    "acknowledged": 0.00,
}


async def update_weights(
    user_id: str,
    dominant_component: str,
    action: str,
    current_weights: dict,
    db: AsyncSession,
) -> dict:
    delta = LEARN_RATE.get(action, 0.0)
    if delta == 0.0:
        return current_weights

    key_map = {
        "impact": "w1_impact",
        "proximity": "w2_proximity",
        "velocity": "w3_velocity",
        "novelty": "w4_novelty",
    }
    key = key_map.get(dominant_component)
    if not key:
        return current_weights

    new_weights = dict(current_weights)
    new_weights[key] = max(0.05, min(0.70, new_weights[key] + delta))

    total = sum(new_weights.values())
    new_weights = {k: round(v / total, 4) for k, v in new_weights.items()}

    await db.execute(update(User).where(User.id == user_id).values(weights=new_weights))
    await db.commit()
    return new_weights
