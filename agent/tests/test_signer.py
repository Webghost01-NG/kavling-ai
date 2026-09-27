from eth_account import Account
from eth_account.messages import encode_typed_data
from kavling.signer import sign_appraisal

def test_sign_appraisal_eip712_recovery():
    # Use Alice testnet private key
    private_key = "0x00000000000000000000000000000000000000000000000000000000000a11ce"
    expected_signer = Account.from_key(private_key).address

    prop_id = "0x4b41564c494e472d42414c492d30310000000000000000000000000000000000"
    proof = sign_appraisal(
        property_id_hex=prop_id,
        valuation_usd_wei=750_000 * 10**18,
        price_per_fraction_wei=50 * 10**18,
        annual_yield_bps=980,
        nonce=1,
        private_key=private_key,
        chain_id=97,
        verifying_contract="0x1234567890123456789012345678901234567890"
    )

    assert proof["appraiser_agent"] == expected_signer
    assert proof["signature"].startswith("0x")
    assert len(proof["signature"]) == 132 # 65 bytes in hex + '0x'
    assert proof["nonce"] == 1
    assert proof["annual_yield_bps"] == 980
