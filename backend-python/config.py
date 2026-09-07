import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Neon/PostgreSQL connection string (set NEON_DATABASE_URL in backend-python/.env)
    NEON_DATABASE_URL: str = ""
    DATABASE_URL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()


def database_url() -> str:
    """Return the PostgreSQL connection string from settings or environment."""
    return (
        settings.NEON_DATABASE_URL
        or settings.DATABASE_URL
        or os.environ.get("NEON_DATABASE_URL", "")
    )
