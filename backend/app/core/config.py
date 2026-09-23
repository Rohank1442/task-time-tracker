import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Tuple

# Determine absolute path to root .env file
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(ROOT_DIR, ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Task & Time Tracker API"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./task_tracker.db"
    
    # Security / Auth
    JWT_SECRET: str = "super-secret-jwt-key-change-this-in-production-123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # AI API Keys (Optional)
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=(ENV_PATH, ".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
