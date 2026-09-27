# 🏛️ Kavling AI — Autonomous Real Estate Tokenization Protocol on BNB Chain

[![BNB Smart Chain](https://img.shields.io/badge/Blockchain-BNB%20Chain%20%7C%20opBNB-F0B90B?style=for-the-badge&logo=binance&logoColor=black)](https://bnbchain.org)
[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20%20(Foundry)-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Python](https://img.shields.io/badge/AI%20Agent-Python%203.12%20%7C%20FastAPI%20%7C%20Web3.py-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![EIP-712](https://img.shields.io/badge/Security-EIP--712%20Signed%20Appraisals-C9A84C?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-712)
[![Foundry](https://img.shields.io/badge/Foundry%20Tests-10%2F10%20Passed-10B981?style=for-the-badge)](https://getfoundry.sh)
[![Pytest](https://img.shields.io/badge/Pytest-14%2F14%20Passed-10B981?style=for-the-badge)](https://pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Kavling AI is a prototype for model-driven property valuation, cryptographic appraisal attestations, and fractional real-estate vault accounting on BNB Chain.**

> **Status:** local/testnet prototype. The sample properties and market figures in this repository are illustrative. No property ownership, investment product, legal title, rental income, or production deployment is represented by this code.

---

## 🇮🇩 Ringkasan Eksekutif (Bahasa Indonesia)

**Kavling AI** adalah protokol inovasi Real World Asset (RWA) dan Agen AI terdesentralisasi yang dibangun di atas **BNB Smart Chain (Chain ID 97) & opBNB (Chain ID 5611)**. Protokol ini menyelesaikan permasalahan likuiditas rendah, batasan modal tinggi, dan proses valuasi properti manual yang lambat di Indonesia dan Asia Tenggara.

### Masalah Nyata di Indonesia:
1. **Hambatan Modal yang Tinggi:** Membeli properti premium (villa di Bali, perkantoran di SCBD Jakarta, atau creative hotel di Yogyakarta) membutuhkan modal ratusan juta hingga miliaran Rupiah, sehingga investor ritel terisolasi dari kelas aset berimbal hasil tinggi.
2. **Proses Valuasi Manual & Lambat:** Penilaian properti konvensional membutuhkan jasa penilai fisik yang memakan waktu 2–4 minggu dan berbiaya mahal serta rentan konflik kepentingan.
3. **Risiko Bencana Alam & Zonasi:** Indonesia berada di *Ring of Fire* (Sesar Opak di Jogja, Megathrust Sunda di Bali, Sesar Lembang di Bandung). Penilaian konvensional seringkali mengabaikan mitigasi risiko seismik dan tata ruang (RTRW/RDTR).

### Solusi Kavling AI:
* **Agen Penilai AI Mandiri (Python 3.12 + FastAPI + Web3.py):** Mengintegrasikan regresi hedonik, tata ruang RTRW/RDTR, data sesar gempa aktif BMKG, serta risiko legalitas sertifikat (SHM vs HGB). Menerbitkan bukti kriptografi **EIP-712** dengan proteksi *monotonic nonce* terhadap *replay attacks*.
* **Micro-Kavling Vaults (`KavlingPropertyVault.sol`):** Token fraksional ERC-20 yang dapat dibeli mulai dari **\$5 USDT atau native tBNB** dengan perlindungan *soft-cap escrow* dan hak pengembalian dana (*refund*) otomatis jika target pendanaan tidak tercapai.
* **Streaming Hasil Sewa Ganda (Dual-Currency Yield Distribution):** Pendapatan sewa fisik dalam USDT maupun native tBNB didistribusikan secara proporsional on-chain dengan invarian matematis anti-*underflow*.

---

## 🇬🇧 Executive Summary (English)

**Kavling AI** explores how a property valuation service can produce an explainable appraisal, sign that appraisal with EIP-712, and feed the result into an on-chain fractional-vault workflow. The valuation engine is a deterministic automated valuation model (AVM), not a trained machine-learning model or a legal property appraisal. By integrating regional assumptions, zoning factors, climate/seismic risk factors, and title-type discounts, it provides an inspectable prototype for future data-backed models.

---

## 🧮 Mathematical & Cryptographic Architecture

### 1. Multi-Factor Automated Valuation Model (AVM)
The Python valuation service implements a deterministic, multi-factor pricing model:

$$\text{Valuation} = \left( (\text{Land Area} \times P_{\text{land}} \times \mu_{\text{zone}} \times \lambda_{\text{title}} \times \eta_{\text{scale}}) + (\text{Building Area} \times P_{\text{build}} \times (1 - \delta_{\text{age}})) \right) \times \psi_{\text{climate}}$$

Where:
* $P_{\text{land}}$: Base subdistrict land rate per $\text{m}^2$ (Canggu: \$1,200; SCBD: \$4,500; Malioboro: \$1,400; Dago: \$1,100).
* $\mu_{\text{zone}}$: Spatial planning multiplier (Pariwisata = $1.15$, Komersial = $1.10$, Residensial = $1.00$).
* $\lambda_{\text{title}}$: Indonesian Agrarian Law (UUPA No. 5/1960) discount (SHM Freehold = $1.00$, HGB Commercial = $0.92$, Hak Pakai = $0.85$).
* $\psi_{\text{climate}}$: BMKG seismic and monsoon flood resilience factor calculated against active fault lines (Sunda Megathrust, Opak Fault, Lembang Fault).
* Net Rental Yield (BPS): Calculated based on net operating income (Cap Rate between $5.5\%$ and $14.5\%$).

---

### 2. EIP-712 Cryptographic Attestation with Monotonic Replay Protection
Appraisals are cryptographically signed using EIP-712 typed structured data. To prevent replay attacks and signature reuse, appraisals include a sequential monotonic nonce per property:

```solidity
struct Appraisal {
    bytes32 propertyId;
    uint256 valuationUSD;     // 18 decimals
    uint256 pricePerFraction; // 18 decimals
    uint256 annualYieldBps;   // Basis points (e.g., 980 = 9.80%)
    uint256 timestamp;        // Monotonic timestamp
    uint256 nonce;            // Sequential nonce: nonce == propertyNonces[propertyId] + 1
    uint256 deadline;         // Unix timestamp expiry
}
```

$$\text{APPRAISAL\_TYPEHASH} = \text{keccak256}("Appraisal(bytes32 propertyId,uint256 valuationUSD,uint256 pricePerFraction,uint256 annualYieldBps,uint256 timestamp,uint256 nonce,uint256 deadline)")$$

---

### 3. Dual-Currency Pro-Rata Rental Yield Streaming Math
In `KavlingPropertyVault.sol`, cumulative rental income is tracked independently for USDT and native BNB using precision accounting ($10^{18}$ scalar):

$$\Delta accYieldPerShare_{\text{USDT}} = \frac{\text{Yield}_{\text{USDT}} \times 10^{18}}{\text{Total Supply}}$$
$$\Delta accYieldPerShare_{\text{BNB}} = \frac{\text{Yield}_{\text{BNB}} \times 10^{18}}{\text{Total Supply}}$$

#### Zero-Underflow Invariant:
On fractional transfers, mints, and burns, the contract triggers internal balance settlement:
$$\text{PendingYield}_i \mathrel{+}= \max\left(0, \frac{\text{Balance}_i \times accYieldPerShare}{10^{18}} - \text{RewardDebt}_i\right)$$
$$\text{RewardDebt}_i = \frac{\text{NewBalance}_i \times accYieldPerShare}{10^{18}}$$
This mathematically guarantees that balances never underflow and historical accruals are never lost.

---

### 4. Capital Escrow & Soft-Cap Protection
`KavlingPropertyVault.sol` enforces a multi-phase state machine:
* `Funding`: Investor funds (USDT / tBNB) are retained in vault escrow.
* `Active`: Once `totalUSDCollected >= minFundingGoalUSD`, `finalizeFunding()` releases capital to the property issuer.
* `Refundable`: If `block.timestamp > fundingDeadline` without achieving soft-cap, `enableRefunds()` allows all investors to call `claimRefund()` to reclaim 100% of their deposited capital.

---

## 🏛️ System Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 Kavling AI Web Application                  │
│   - Modulify-Grade Dark Bento Grid Interface                │
│   - Real-Time Mathematical AI Valuation Studio              │
│   - Bilingual Language Toggle: Bahasa Indonesia & English   │
│   - Interactive EIP-712 Cryptographic Proof Inspector       │
│   - 1-Click Judge Walkthrough Simulator                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Autonomous AI Valuation Oracle Agent            │
│                 (Pure Python 3.12 + FastAPI)                │
│   - Geo-Zoning Model (RTRW/RDTR Jakarta, Bali, Jogja)       │
│   - BMKG Seismic Fault Line & Climate Flood Scoring         │
│   - EIP-712 Signer with Monotonic Nonce Monotonicity        │
└──────────────────────────────┬──────────────────────────────┘
                               │ EIP-712 Signed Digest
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              BNB Smart Chain / opBNB Contracts              │
│   - KavlingRegistry.sol: Central registry & replay defense  │
│   - KavlingPropertyVault.sol: Escrow & dual-rail yield      │
│   - MockUSDT.sol: Testnet payment rail                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Verification & Test Suites

### 1. Smart Contract Verification (Foundry)
Execute the complete test suite verifying all invariants, fuzz tests, replay rejection, and refund states:

```bash
cd contracts
forge test -vvv
```

The repository currently contains 10 Foundry tests and 14 Python tests. Run them locally and report the output from your environment; this README does not treat historical output as a live deployment guarantee.
* `test_BuyWithNativeBNB_AndRefundExcess()` — PASS
* `test_ComplianceGate_Enforced()` — PASS
* `test_DualCurrencyYield_DepositAndClaimBNB()` — PASS
* `test_Fuzz_BuyWithUSDT(uint256)` (256 fuzz runs) — PASS
* `test_RegisterPropertyWithAppraisal_Success()` — PASS
* `test_ReplayAttack_RevertsOnOldOrInvalidNonce()` — PASS
* `test_SoftCapEscrow_ExpiredDeadline_EnablesRefunds()` — PASS
* `test_SoftCapEscrow_FinalizeSuccess_ReleasesCapital()` — PASS
* `test_StaleTimestamp_Reverts()` — PASS
* `test_YieldClaimAfterTransfer_NoUnderflow()` — PASS

### 2. AI Valuation Agent Verification (Pytest)
Run the Python test suite:

```bash
PYTHONPATH=agent .venv/bin/pytest agent/tests/ -v
```

The Python tests cover the deterministic AVM, risk and zoning modules, API responses, and EIP-712 signature recovery.
* `test_canggu_villa_appraisal` — PASS
* `test_yogyakarta_heritage_appraisal` — PASS
* `test_climate_risk_high_elevation` — PASS
* `test_climate_risk_lowland_tidal` — PASS
* `test_bali_canggu_zoning` — PASS
* `test_jakarta_scbd_zoning` — PASS
* `test_unknown_city_fallback` — PASS
* `test_root_endpoint` — PASS
* `test_health_endpoint` — PASS
* `test_list_properties` — PASS
* `test_appraise_endpoint` — PASS
* `test_telemetry_endpoint` — PASS
* `test_compliance_verify` — PASS
* `test_sign_appraisal_eip712_recovery` — PASS

---

## 🚀 Quickstart & Local Execution

### 1. Launch Python AI Valuation Agent
```bash
source .venv/bin/activate
uvicorn kavling.server:app --app-dir agent --host 0.0.0.0 --port 8000
```
API docs available at: `http://localhost:8000/docs`

### 2. Launch Zero-Dependency Modulify Frontend
```bash
cd frontend
python3 -m http.server 3000
```
Open your browser at `http://localhost:3000`.

---

## ⚠️ Prototype boundaries

- The valuation inputs are repository-owned assumptions. They are not live market data and are not independently validated.
- The zoning, title, climate, and seismic modules are analytical demonstrations, not official legal, engineering, BMKG, or land-registry integrations.
- `SAMPLE_PROPERTIES` and the static frontend listings are illustrative demo data. They are not offers to sell property or tokens.
- The contracts are designed for local testing and testnet experimentation. They have not been audited, deployed to a production network, or approved by a regulator.
- The compliance endpoint only validates the shape of an address. It must not be described as KYC, AML, Bappebti, OJK, or accredited-investor verification.
- Do not put a real private key in the repository, browser bundle, or shell history. Configure `AGENT_PRIVATE_KEY` through a secret manager or an untracked environment file.

## Development notes

This repository is split into three independently testable parts:

1. `agent/` — FastAPI AVM and EIP-712 proof service.
2. `contracts/` — Foundry contracts and tests.
3. `frontend/` — dependency-free browser demo. It is intentionally usable without a deployed contract address, but labels local estimates and illustrative data as such.

The OpenZeppelin dependency is pinned as a git submodule. After cloning, run:

```bash
git submodule update --init --recursive
```

---

## 📜 License
MIT License. Created for the **Indonesia Web3 Hackathon 2026** on BNB Chain.
