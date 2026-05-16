from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    anthropic_api_key: str
    news_api_key: str = ""
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    default_w1_impact: float = 0.35
    default_w2_proximity: float = 0.30
    default_w3_velocity: float = 0.20
    default_w4_novelty: float = 0.15

    threshold_critical: float = 0.85
    threshold_high: float = 0.65
    threshold_medium: float = 0.40

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
