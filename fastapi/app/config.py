"""FastAPI 应用配置 — Pydantic Settings"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Foreign Trade API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database (FastAPI 独立数据库)
    DATABASE_URL: str = "postgresql+asyncpg://fastapi:fastapi@db-fastapi:5432/fastapi"

    # Redis
    REDIS_URL: str = "redis://:redis_password@redis:6379/1"

    # CORS
    FRONTEND_URL: str = "https://yourdomain.com"

    # Brevo Email
    BREVO_API_KEY: str = ""
    BREVO_API_URL: str = "https://api.brevo.com/v3"
    ADMIN_EMAIL: str = "admin@yourdomain.com"

    # Saleor GraphQL
    SALEOR_GRAPHQL_URL: str = "http://saleor-api:8000/graphql/"

    # Sentry
    SENTRY_DSN: str = ""

    # WhatsApp
    WHATSAPP_NUMBER: str = ""


settings = Settings()
