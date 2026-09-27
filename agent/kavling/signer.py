"""
Kavling AI - EIP-712 Cryptographic Appraisal Signer
Generates cryptographically valid signatures for BNB Chain KavlingRegistry.
"""
import time
from typing import Dict, Any, Tuple
from eth_account import Account
from eth_account.messages import encode_typed_data
from .config import settings

def sign_appraisal(
    property_id_hex: str,
    valuation_usd_wei: int,
    price_per_fraction_wei: int,
    annual_yield_bps: int,
    nonce: int,
    deadline_seconds: int = 86400,
    timestamp: int | None = None,
    private_key: str | None = None,
    chain_id: int | None = None,
    verifying_contract: str | None = None
) -> Dict[str, Any]:
    """
    Signs an EIP-712 appraisal for KavlingRegistry with monotonic nonce protection.
    """
    pk = private_key or settings.AGENT_PRIVATE_KEY
    if not pk:
        raise ValueError("AGENT_PRIVATE_KEY is required; refusing to use an unsafe default key")
    if deadline_seconds <= 0:
        raise ValueError("deadline_seconds must be positive")
    signer_account = Account.from_key(pk)
    agent_address = signer_account.address

    now = int(time.time()) if timestamp is None else timestamp
    deadline = now + deadline_seconds

    # Ensure 32-byte hex for propertyId
    if not property_id_hex.startswith("0x"):
        property_id_hex = "0x" + property_id_hex
    if len(property_id_hex) != 66:
        raise ValueError("property_id_hex must be exactly 32 bytes")
    try:
        bytes.fromhex(property_id_hex[2:])
    except ValueError as exc:
        raise ValueError("property_id_hex must contain only hexadecimal characters") from exc

    c_id = settings.CHAIN_ID if chain_id is None else chain_id
    v_contract = verifying_contract or settings.REGISTRY_ADDRESS
    if not v_contract:
        raise ValueError("verifying_contract or REGISTRY_ADDRESS is required")
    from web3 import Web3
    v_contract = Web3.to_checksum_address(v_contract)

    typed_data = {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "Appraisal": [
                {"name": "propertyId", "type": "bytes32"},
                {"name": "valuationUSD", "type": "uint256"},
                {"name": "pricePerFraction", "type": "uint256"},
                {"name": "annualYieldBps", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"},
            ],
        },
        "primaryType": "Appraisal",
        "domain": {
            "name": "KavlingRegistry",
            "version": "1.0.0",
            "chainId": c_id,
            "verifyingContract": v_contract,
        },
        "message": {
            "propertyId": bytes.fromhex(property_id_hex[2:]),
            "valuationUSD": valuation_usd_wei,
            "pricePerFraction": price_per_fraction_wei,
            "annualYieldBps": annual_yield_bps,
            "timestamp": now,
            "nonce": nonce,
            "deadline": deadline,
        },
    }

    signable_message = encode_typed_data(full_message=typed_data)
    signed_message = Account.sign_message(signable_message, private_key=pk)
    recovered = Account.recover_message(signable_message, signature=signed_message.signature)

    if recovered.lower() != agent_address.lower():
        raise RuntimeError("EIP-712 signature recovery failed")

    return {
        "appraiser_agent": agent_address,
        "property_id": property_id_hex,
        "valuation_wei": str(valuation_usd_wei),
        "price_per_fraction_wei": str(price_per_fraction_wei),
        "annual_yield_bps": annual_yield_bps,
        "timestamp": now,
        "nonce": nonce,
        "deadline": deadline,
        "chain_id": c_id,
        "verifying_contract": v_contract,
        "signature": "0x" + signed_message.signature.hex(),
        "struct": {
            "propertyId": property_id_hex,
            "valuationUSD": str(valuation_usd_wei),
            "pricePerFraction": str(price_per_fraction_wei),
            "annualYieldBps": annual_yield_bps,
            "timestamp": now,
            "nonce": nonce,
            "deadline": deadline
        }
    }
