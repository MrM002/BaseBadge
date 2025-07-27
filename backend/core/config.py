from pydantic import BaseSettings
import os

class Settings(BaseSettings):
    app_name: str = "BaseBadge"
    environment: str = "development"
    api_version: str = "v1"
    backend_cors_origins: list[str] = ["*"]  # You can restrict in prod
    base_network: str = "base-mainnet"
    etherscan_api_key: str = ""
    alchemy_api_key: str = ""
    zerion_api_key: str = ""
    telegram_bot_token: str = ""
    chain_id: int = 8453

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()