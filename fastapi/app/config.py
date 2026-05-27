"""FastAPI 应用配置 — Pydantic Settings"""

import structlog

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = structlog.get_logger()


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

    # Admin Auth
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""
    ADMIN_JWT_SECRET: str = ""
    ADMIN_JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    def model_post_init(self, __context) -> None:
        """启动校验：生产环境安全检查"""
        if not self.ADMIN_JWT_SECRET or len(self.ADMIN_JWT_SECRET) < 32:
            if not self.DEBUG:
                raise ValueError(
                    "ADMIN_JWT_SECRET must be >= 32 chars in production. "
                    "Set a secure random string via environment variable."
                )
            else:
                logger.warning(
                    "admin_jwt_secret_insecure",
                    msg="Using insecure default JWT secret for development only.",
                )
                self.ADMIN_JWT_SECRET = "dev_insecure_jwt_secret_do_not_use_in_prod__"
        if not self.DEBUG:
            if not self.ADMIN_PASSWORD or len(self.ADMIN_PASSWORD) < 16:
                raise ValueError(
                    "ADMIN_PASSWORD must be set with >= 16 characters in production. "
                    "Set via ADMIN_PASSWORD environment variable."
                )


settings = Settings()
