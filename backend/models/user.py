import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    profile: Mapped[dict] = mapped_column(JSON, default=lambda: {
        "asset_classes": [],
        "regions": [],
        "role": "analyst",
        "risk_tolerance": 0.5,
        "alert_volume": "medium",
    })
    weights: Mapped[dict] = mapped_column(JSON, default=lambda: {
        "w1_impact": 0.35,
        "w2_proximity": 0.30,
        "w3_velocity": 0.20,
        "w4_novelty": 0.15,
    })
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
