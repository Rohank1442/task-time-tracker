import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, Tuple

# Determine absolute path to the backend directory
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ROOT_DIR = BACKEND_DIR
ENV_PATH = os.path.join(ROOT_DIR, ".env")

# Use an absolute path for the DB so it always resolves to the same file
# regardless of which directory the server is started from.
_DB_PATH = os.path.join(BACKEND_DIR, "task_tracker.db")
_DEFAULT_DATABASE_URL = f"sqlite:///{_DB_PATH}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Task & Time Tracker API"
    PORT: int = 8000
    DATABASE_URL: str = _DEFAULT_DATABASE_URL
    
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
