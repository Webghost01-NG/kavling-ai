"""
Kavling AI - Protocol Configuration
"""
import os
from pydantic import BaseModel

class Settings(BaseModel):
    # Agent cryptographic identity (Standard testnet default: 0xA11CE)
    AGENT_PRIVATE_KEY: str = os.getenv("AGENT_PRIVATE_KEY", "0x00000000000000000000000000000000000000000000000000000000000a11ce")
    
    # BNB Chain Network Config
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "97")) # 97 = BSC Testnet, 5611 = opBNB Testnet
    RPC_URL: str = os.getenv("RPC_URL", "https://data-seed-prebsc-1-s1.binance.org:8545/")
    REGISTRY_ADDRESS: str = os.getenv("REGISTRY_ADDRESS", "0x0000000000000000000000000000000000000000")
    
    # Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Valuation parameters
    DEFAULT_EXPIRY_SECONDS: int = 86400 # 24 hours

settings = Settings()
