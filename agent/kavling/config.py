"""
Kavling AI - Protocol Configuration
"""
import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    # There is deliberately no private-key fallback. Configure this through a secret store or .env.
    AGENT_PRIVATE_KEY: str = Field(default_factory=lambda: os.getenv("AGENT_PRIVATE_KEY", ""))
    
    # BNB Chain Network Config
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "97")) # 97 = BSC Testnet, 5611 = opBNB Testnet
    RPC_URL: str = os.getenv("RPC_URL", "https://data-seed-prebsc-1-s1.binance.org:8545/")
    REGISTRY_ADDRESS: str = os.getenv("REGISTRY_ADDRESS", "")
    
    # Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    
    # Valuation parameters
    DEFAULT_EXPIRY_SECONDS: int = 86400 # 24 hours

settings = Settings()
