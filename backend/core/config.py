from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv
import os

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
    backend_cors_origins: list[str] = ["*"]  # You can restrict in prod
    base_network: str = "base-mainnet"
    etherscan_api_key: str = ""
    base_rpc_url: str = "https://mainnet.base.org"
    chain_id: int = 8453
    
     # V2 Contract Configuration - UPDATED TO MATCH FRONTEND
    score_checker_v2_address: str = "0x461203d7137FdFA30907288656dBEB0f64408Fb9"
    score_checker_v2_implementation: str = "0x97AE9F69f01D2BAe2Fd8F9F3B0B9603ca792f6b7"
    
    # Legacy support (will be removed)
    score_checker_address: str = "0x461203d7137FdFA30907288656dBEB0f64408Fb9"
    # Private key should come from environment variables only
    authorized_signer_private_key: str = os.getenv("AUTHORIZED_SIGNER_PRIVATE_KEY", "")
    authorized_signer_address: str = "0xBC17B9198B04521C824A0B99Db452214f773835B"

    class Config:
        # We already pre-loaded .env files via python-dotenv
        env_file = None
        env_file_encoding = "utf-8"


settings = Settings()