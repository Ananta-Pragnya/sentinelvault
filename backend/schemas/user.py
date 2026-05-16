from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Any


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileUpdate(BaseModel):
    asset_classes: list[str] | None = None
    regions: list[str] | None = None
    role: str | None = None
    risk_tolerance: float | None = None
    alert_volume: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    profile: dict[str, Any]
    weights: dict[str, float]
    created_at: datetime

    model_config = {"from_attributes": True}
