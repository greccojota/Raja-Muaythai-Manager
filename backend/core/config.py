from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "changeme-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql+asyncpg://raja_user:raja_pass@localhost:5432/raja_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:80",
        "http://localhost:5173",
    ]

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@raja.com.br"
    EMAILS_FROM_NAME: str = "Arena Thai Raja Stadium"
    ACADEMY_NAME: str = "Arena Thai Raja Stadium"
    ACADEMY_SIGNATURE: str = "Equipe Arena Thai Raja Stadium"
    PUBLIC_FRONTEND_URL: str = "http://localhost:5173"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


settings = Settings()
