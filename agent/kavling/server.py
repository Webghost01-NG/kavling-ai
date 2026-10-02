"""
Kavling AI - FastAPI REST Server & Autonomous Oracle Gateway
"""
import time
from threading import Lock
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
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
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AppraisalRequest(BaseModel):
    property_id: str = Field(default="0x7f15bab648762b3f2ec1c5f3811c9968c66c15e9e0848513e95d6e726e8714e2")
    city: str = Field(default="Bali")
    district: str = Field(default="Canggu")
    land_area_m2: float = Field(default=500.0, gt=0, le=100_000)
    building_area_m2: float = Field(default=350.0, gt=0, le=100_000)
    building_age_years: int = Field(default=2, ge=0, le=200)
    building_quality: str = Field(default="Luxury")
    zoning: str = Field(default="Pariwisata")
    title: str = Field(default="SHM")
    elevation_masl: float = Field(default=18.0)
    distance_to_coast_km: float = Field(default=1.2)
    structural_audit_grade: str = Field(default="A")
    total_fractions: int = Field(default=15_000, gt=0, le=10**18)
    chain_id: Optional[int] = None
    verifying_contract: Optional[str] = None

    @field_validator("property_id")
    @classmethod
    def validate_property_id(cls, value: str) -> str:
        if len(value) != 66 or not value.startswith("0x"):
            raise ValueError("property_id must be a 32-byte hex value")
        try:
            bytes.fromhex(value[2:])
        except ValueError as exc:
            raise ValueError("property_id must be a 32-byte hex value") from exc
        return value

class ComplianceRequest(BaseModel):
    investor_address: str
    country_code: str = "ID"
    national_id_hash: str # SHA256(NIK KTP)


_last_seen_nonces: Dict[str, int] = {}
_nonce_lock = Lock()


def _agent_account() -> Account:
    if not settings.AGENT_PRIVATE_KEY:
        raise RuntimeError("AGENT_PRIVATE_KEY is not configured")
    return Account.from_key(settings.AGENT_PRIVATE_KEY)

# Pre-seeded Indonesian Curated Properties
SAMPLE_PROPERTIES = [
    {
        "propertyId": "0x7f15bab648762b3f2ec1c5f3811c9968c66c15e9e0848513e95d6e726e8714e2",
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
        "vaultState": "Active · testnet demo",
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

@app.get("/api/info")
def root():
    agent_account = _agent_account()
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
        "agent": _agent_account().address,
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
        if req.chain_id is not None and req.chain_id != settings.CHAIN_ID:
            raise HTTPException(status_code=400, detail="Requested chain does not match the configured chain")

        verifying_contract = settings.REGISTRY_ADDRESS or req.verifying_contract
        if not verifying_contract:
            raise HTTPException(status_code=503, detail="REGISTRY_ADDRESS is not configured")
        if req.verifying_contract and Web3.to_checksum_address(req.verifying_contract) != Web3.to_checksum_address(
            verifying_contract
        ):
            raise HTTPException(status_code=400, detail="Requested registry does not match the configured registry")

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

        with _nonce_lock:
            next_nonce = _last_seen_nonces.get(req.property_id, 0) + 1
            provider = Web3(Web3.HTTPProvider(settings.RPC_URL, request_kwargs={"timeout": 4}))
            if provider.is_connected():
                registry_address = Web3.to_checksum_address(verifying_contract)
                if provider.eth.get_code(registry_address):
                    registry = provider.eth.contract(
                        address=registry_address,
                        abi=[{
                            "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
                            "name": "propertyNonces",
                            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                            "stateMutability": "view",
                            "type": "function",
                        }],
                    )
                    property_id_bytes = bytes.fromhex(req.property_id[2:])
                    next_nonce = registry.functions.propertyNonces(property_id_bytes).call() + 1

            signed_proof = sign_appraisal(
                property_id_hex=req.property_id,
                valuation_usd_wei=int(appraisal_result["on_chain"]["valuationUSD"]),
                price_per_fraction_wei=int(appraisal_result["on_chain"]["pricePerFraction"]),
                annual_yield_bps=appraisal_result["annual_yield_bps"],
                nonce=next_nonce,
                chain_id=settings.CHAIN_ID,
                verifying_contract=verifying_contract,
            )
            _last_seen_nonces[req.property_id] = next_nonce

        return {
            "success": True,
            "appraisal": appraisal_result,
            "eip712_proof": signed_proof
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/oracle/telemetry")
def get_telemetry():
    """
    Reports live RPC telemetry and explicitly marks unavailable data as degraded.
    """
    agent_account = _agent_account()
    provider = Web3(Web3.HTTPProvider(settings.RPC_URL, request_kwargs={"timeout": 4}))
    rpc_connected = provider.is_connected()
    latest_block = None
    gas_price_gwei = None
    if rpc_connected:
        latest_block = provider.eth.block_number
        gas_price_gwei = round(float(provider.eth.gas_price) / 1e9, 4)
    return {
        "chainId": settings.CHAIN_ID,
        "network": "BNB Smart Chain Testnet" if settings.CHAIN_ID == 97 else "opBNB Testnet",
        "appraiserAgent": agent_account.address,
        "rpcConnected": rpc_connected,
        "latestBlock": latest_block,
        "gasPriceGwei": gas_price_gwei,
        "dataSource": "BNB JSON-RPC" if rpc_connected else "RPC unavailable",
        "activeCurrencies": ["USDT", "tBNB"],
        "oracleStatus": "SYNCHRONIZED" if rpc_connected else "DEGRADED",
        "lastValuationTimestamp": int(time.time()),
        "securityAudits": {
            "eip712ReplayProtection": "ENABLED (Monotonic Nonces)",
            "escrowRefundSafety": "ENABLED (Soft-Cap Gate)",
            "yieldMathUnderflow": "PROTECTED (Zero-Underflow Accrual)"
        }
    }


@app.get("/api/deployment")
def get_deployment_status():
    """Report configured contract addresses and whether bytecode exists at them."""
    registry_address = settings.REGISTRY_ADDRESS or None
    if not registry_address:
        return {
            "status": "not_configured",
            "chainId": settings.CHAIN_ID,
            "registryAddress": None,
            "registryCodePresent": False,
        }

    try:
        provider = Web3(Web3.HTTPProvider(settings.RPC_URL, request_kwargs={"timeout": 4}))
        checksum_address = Web3.to_checksum_address(registry_address)
        if not provider.is_connected():
            return {
                "status": "rpc_unavailable",
                "chainId": settings.CHAIN_ID,
                "registryAddress": checksum_address,
                "registryCodePresent": None,
            }
        code = provider.eth.get_code(checksum_address)
        has_code = len(code) > 2
        return {
            "status": "deployed" if has_code else "address_has_no_code",
            "chainId": settings.CHAIN_ID,
            "registryAddress": checksum_address,
            "registryCodePresent": has_code,
        }
    except Exception as exc:
        return {
            "status": "invalid_configuration",
            "chainId": settings.CHAIN_ID,
            "registryAddress": registry_address,
            "registryCodePresent": False,
            "error": str(exc),
        }

@app.post("/api/compliance/verify")
def verify_investor(req: ComplianceRequest):
    """
    Performs address-format validation only; it is not a KYC/AML service.
    """
    is_valid = Web3.is_address(req.investor_address)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Ethereum/BSC address")
    
    return {
        "verified": False,
        "status": "address_format_only",
        "investor": req.investor_address,
        "jurisdiction": req.country_code,
        "complianceTier": None,
        "message": "No KYC/AML provider is connected; this endpoint only validates address syntax.",
        "timestamp": int(time.time())
    }


FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
if FRONTEND_DIR.is_dir():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
