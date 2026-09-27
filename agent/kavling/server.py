"""
Kavling AI - FastAPI REST Server & Autonomous Oracle Gateway
"""
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from eth_account import Account
from web3 import Web3

from .config import settings
from .avm import calculate_appraisal
from .signer import sign_appraisal
from .geo_zoning import INDONESIA_REGIONAL_BASE_PRICES

app = FastAPI(
    title="Kavling AI Oracle & Autonomous Valuation Engine",
    description="Decentralized Real Estate AVM and EIP-712 Oracle on BNB Chain",
    version="1.0.0"
)

# Enable CORS for browser frontend dApp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AppraisalRequest(BaseModel):
    property_id: str = Field(default="0x4b41564c494e472d42414c492d30310000000000000000000000000000000000")
    city: str = Field(default="Bali")
    district: str = Field(default="Canggu")
    land_area_m2: float = Field(default=500.0)
    building_area_m2: float = Field(default=350.0)
    building_age_years: int = Field(default=2)
    building_quality: str = Field(default="Luxury")
    zoning: str = Field(default="Pariwisata")
    title: str = Field(default="SHM")
    elevation_masl: float = Field(default=18.0)
    distance_to_coast_km: float = Field(default=1.2)
    structural_audit_grade: str = Field(default="A")
    total_fractions: int = Field(default=15_000)
    nonce: int = Field(default=1)
    chain_id: Optional[int] = None
    verifying_contract: Optional[str] = None

class ComplianceRequest(BaseModel):
    investor_address: str
    country_code: str = "ID"
    national_id_hash: str # SHA256(NIK KTP)

# Pre-seeded Indonesian Curated Properties
SAMPLE_PROPERTIES = [
    {
        "propertyId": "0x4b41564c494e472d42414c492d30310000000000000000000000000000000000",
        "name": "Canggu Sanctuary Eco-Villa",
        "city": "Bali",
        "district": "Canggu",
        "category": "Hospitality & Tourism",
        "legalDeedHash": "SHM-0892-BALI-BADUNG",
        "ipfsMetadata": "ipfs://bafybeicangguvillabali",
        "landAreaM2": 650,
        "buildingAreaM2": 420,
        "totalFractions": 15000,
        "valuationUSD": 750000,
        "pricePerFractionUSD": 50.00,
        "expectedYieldPercent": 9.80,
        "minFundingGoalUSD": 300000,
        "vaultState": "Active",
        "seismicResilience": 95.2,
        "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "propertyId": "0x4b41564c494e472d4a414b415254412d30320000000000000000000000000000",
        "name": "SCBD Pacific Executive Penthouse",
        "city": "Jakarta",
        "district": "SCBD",
        "category": "Commercial Grade A",
        "legalDeedHash": "HGB-1102-JKT-SELATAN",
        "ipfsMetadata": "ipfs://bafybeiscbdpacificjakarta",
        "landAreaM2": 120,
        "buildingAreaM2": 260,
        "totalFractions": 24000,
        "valuationUSD": 1200000,
        "pricePerFractionUSD": 50.00,
        "expectedYieldPercent": 8.40,
        "minFundingGoalUSD": 600000,
        "vaultState": "Funding",
        "seismicResilience": 93.8,
        "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80"
    },
    {
        "propertyId": "0x4b41564c494e472d4a4f474a412d303300000000000000000000000000000000",
        "name": "Malioboro Heritage Boutique Suites",
        "city": "Yogyakarta",
        "district": "Malioboro",
        "category": "Cultural Heritage Tourism",
        "legalDeedHash": "SHM-4421-DIY-YOGYA",
        "ipfsMetadata": "ipfs://bafybeiyogyamalioborosuites",
        "landAreaM2": 480,
        "buildingAreaM2": 520,
        "totalFractions": 9000,
        "valuationUSD": 450000,
        "pricePerFractionUSD": 50.00,
        "expectedYieldPercent": 10.50,
        "minFundingGoalUSD": 200000,
        "vaultState": "Active",
        "seismicResilience": 94.6,
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
    }
]

@app.get("/")
def root():
    agent_account = Account.from_key(settings.AGENT_PRIVATE_KEY)
    return {
        "protocol": "Kavling AI",
        "description": "Autonomous Real Estate Tokenization Protocol on BNB Chain",
        "appraiser_agent_address": agent_account.address,
        "target_chain_id": settings.CHAIN_ID,
        "supported_cities": list(INDONESIA_REGIONAL_BASE_PRICES.keys()),
        "status": "online"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "agent": Account.from_key(settings.AGENT_PRIVATE_KEY).address,
        "chainId": settings.CHAIN_ID
    }

@app.get("/api/properties")
def list_properties():
    return {
        "count": len(SAMPLE_PROPERTIES),
        "properties": SAMPLE_PROPERTIES
    }

@app.post("/api/appraise")
def appraise_property(req: AppraisalRequest):
    """
    Computes mathematical valuation and signs EIP-712 appraisal with nonce replay prevention.
    """
    try:
        appraisal_result = calculate_appraisal(
            property_id_hex=req.property_id,
            city=req.city,
            district=req.district,
            land_area_m2=req.land_area_m2,
            building_area_m2=req.building_area_m2,
            building_age_years=req.building_age_years,
            building_quality=req.building_quality,
            zoning=req.zoning,
            title=req.title,
            elevation_masl=req.elevation_masl,
            distance_to_coast_km=req.distance_to_coast_km,
            structural_audit_grade=req.structural_audit_grade,
            total_fractions=req.total_fractions
        )

        signed_proof = sign_appraisal(
            property_id_hex=req.property_id,
            valuation_usd_wei=int(appraisal_result["on_chain"]["valuationUSD"]),
            price_per_fraction_wei=int(appraisal_result["on_chain"]["pricePerFraction"]),
            annual_yield_bps=appraisal_result["annual_yield_bps"],
            nonce=req.nonce,
            chain_id=req.chain_id or settings.CHAIN_ID,
            verifying_contract=req.verifying_contract or settings.REGISTRY_ADDRESS
        )

        return {
            "success": True,
            "appraisal": appraisal_result,
            "eip712_proof": signed_proof
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/oracle/telemetry")
def get_telemetry():
    """
    Simulated & live RPC telemetry for BNB Chain hackathon demonstration.
    """
    agent_account = Account.from_key(settings.AGENT_PRIVATE_KEY)
    return {
        "chainId": settings.CHAIN_ID,
        "network": "BNB Smart Chain Testnet" if settings.CHAIN_ID == 97 else "opBNB Testnet",
        "appraiserAgent": agent_account.address,
        "bnbPriceUSD": 600.0,
        "gasPriceGwei": 3.0,
        "blockTimeSeconds": 3.0,
        "activeCurrencies": ["USDT", "tBNB"],
        "oracleStatus": "SYNCHRONIZED",
        "lastValuationTimestamp": int(time.time()),
        "securityAudits": {
            "eip712ReplayProtection": "ENABLED (Monotonic Nonces)",
            "escrowRefundSafety": "ENABLED (Soft-Cap Gate)",
            "yieldMathUnderflow": "PROTECTED (Zero-Underflow Accrual)"
        }
    }

@app.post("/api/compliance/verify")
def verify_investor(req: ComplianceRequest):
    """
    Simulates Indonesian Bappebti/OJK compliant KYC verification.
    """
    is_valid = Web3.is_address(req.investor_address)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Ethereum/BSC address")
    
    return {
        "verified": True,
        "investor": req.investor_address,
        "jurisdiction": req.country_code,
        "complianceTier": "Accredited SEA RWA Investor",
        "timestamp": int(time.time())
    }
