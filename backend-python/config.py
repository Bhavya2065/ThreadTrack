import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_SERVER: str = "localhost"
    DB_DATABASE: str = "ThreadTrack"
    DB_USER: str = "sa"
    DB_PASSWORD: str = "Bhavya@95"
    
    class Config:
        env_file = ".env"

settings = Settings()
