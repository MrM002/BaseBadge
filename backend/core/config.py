# FIXED: backend/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field, AliasChoices
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from common locations before Pydantic reads them
# 1) Project root .env
root_env = Path(__file__).resolve().parents[2] / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)

# 2) backend/.env (preferred for backend-specific config)
backend_env = Path(__file__).resolve().parents[1] / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)

class Settings(BaseSettings):
    app_name: str = "BaseBadge"
    environment: str = "development"
    api_version: str = "v1"

    # Preserve original default while allowing env alias override
    backend_cors_origins: list[str] = Field(
        default=["*"],
        validation_alias=AliasChoices("BACKEND_CORS_ORIGINS", "backend_cors_origins"),
    )

    admin_addresses: list[str] = Field(
        default=[],
        validation_alias=AliasChoices("ADMIN_ADDRESSES", "ADMIN_WALLETS", "admin_addresses"),
    )

    # JWT/Auth
    jwt_secret: str = Field(
        default="",  # read from env if provided, else empty
        validation_alias=AliasChoices("JWT_SECRET", "JWT_SECRET_KEY", "jwt_secret"),
    )
    enforce_auth: bool = Field(
        default=False,
        validation_alias=AliasChoices("ENFORCE_AUTH", "enforce_auth"),
    )

    # API Keys and Secrets - loaded from ENV
    etherscan_api_key: str = ""
    alchemy_api_key: str = ""
    moralis_api_key: str = ""
    zerion_api_key: str = ""

    # Blockchain Config
    base_network: str = "base-mainnet"
    base_rpc_url: str = "https://mainnet.base.org"
    chain_id: int = 8453

    # Database Config
    database_url: str = ""
    redis_url: str = ""

    # V2 Contract Configuration - UPDATED TO MATCH FRONTEND
    score_checker_v2_address: str = Field(
        default="0x461203d7137FdFA30907288656dBEB0f64408Fb9",
        validation_alias=AliasChoices("SCORE_CHECKER_V2_ADDRESS", "SCORECHECKER_V2_ADDRESS"),
    )
    score_checker_v2_implementation: str = "0x97AE9F69f01D2BAe2Fd8F9F3B0B9603ca792f6b7"

    # Legacy support (will be removed)
    score_checker_address: str = Field(
        default="0x461203d7137FdFA30907288656dBEB0f64408Fb9",
        validation_alias=AliasChoices("SCORE_CHECKER_ADDRESS", "SCORECHECKER_ADDRESS"),
    )
    authorized_signer_private_key: str = Field(
        default="",
        validation_alias=AliasChoices("AUTHORIZED_SIGNER_PRIVATE_KEY", "AUTHZ_PRIVATE_KEY"),
    )
    authorized_signer_address: str = "0xBC17B9198B04521C824A0B99Db452214f773835B"

    # Notification settings
    telegram_bot_token: str = ""

    class Config:
        # We already pre-loaded .env files via python-dotenv
        env_file = None
        env_file_encoding = "utf-8"
        # Keep default case-sensitivity to preserve original behavior

settings = Settings()
