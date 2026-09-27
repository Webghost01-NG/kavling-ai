# 🏛️ Kavling AI — Autonomous AI Appraisal & Micro-Fractional Real Estate Protocol

[![BNB Smart Chain](https://img.shields.io/badge/Blockchain-BNB%20Chain%20%7C%20opBNB-F0B90B?style=for-the-badge&logo=binance&logoColor=black)](https://bnbchain.org)
[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20%20(Foundry)-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![EIP-712](https://img.shields.io/badge/Security-EIP--712%20Signed%20Appraisals-C9A84C?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-712)
[![Next.js](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20Tailwind-000000?style=for-the-badge&logo=react)](https://react.dev/)
[![Foundry](https://img.shields.io/badge/Tested%20With-Foundry%20(4%20Passed)-red?style=for-the-badge)](https://getfoundry.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Autonomous Real Estate Tokenization on BNB Chain — Demarcating prime Southeast Asian physical properties into cryptographically verified, yield-bearing micro-fractions from as low as \$5.**  
> *Official Submission for the Indonesia Web3 Hackathon 2026 (BNB Chain × Binance Academy × Coinvestasi × Dev Web3 Jogja).*

---

## 🇮🇩 Ringkasan Eksekutif (Bahasa Indonesia)

**Kavling AI** adalah protokol inovasi Real World Asset (RWA) dan Agen AI terdesentralisasi yang dibangun di atas **BNB Smart Chain & opBNB**. Protokol ini hadir untuk menyelesaikan permasalahan likuiditas rendah, batasan modal tinggi, dan proses valuasi properti manual yang lambat di Indonesia dan Asia Tenggara.

### Masalah Nyata di Indonesia:
1. **Hambatan Modal yang Tinggi:** Membeli properti premium (villa di Bali, perkantoran di SCBD Jakarta, atau creative loft di Yogyakarta) membutuhkan modal ratusan juta hingga miliaran Rupiah, sehingga investor ritel terisolasi dari kelas aset berimbal hasil tinggi.
2. **Proses Valuasi Manual & Lambat:** Penilaian properti konvensional membutuhkan jasa penilai fisik yang memakan waktu 2–4 minggu dan berbiaya mahal serta rentan konflik kepentingan.
3. **Fraksionalisasi Konvensional Tidak Efisien:** Pembagian kepemilikan lewat notaris tradisional sangat berbelit-belit, sementara biaya gas di L1 mahal untuk transaksi bernilai mikro.

### Solusi Kavling AI:
* **Agen Penilai AI Mandiri (Autonomous AI Appraiser):** Model matematis yang menyintesis data pembanding pasar (*market comps*), tingkat okupansi perhotelan/perkantoran, pendapatan operasional bersih (*Net Operating Income / NOI*), serta risiko legalitas sertifikat (SHM vs HGB). Agen ini menerbitkan bukti valuasi terenkripsi **EIP-712** secara instan.
* **Micro-Kavling Vaults (`KavlingPropertyVault.sol`):** Token fraksional standar ERC-20 yang dapat dibeli mulai dari **\$5 USDT / tBNB** dengan biaya gas sub-sen di opBNB.
* **Streaming Hasil Sewa Otomatis (Automated Rental Yield Distribution):** Pendapatan sewa fisik yang disetorkan oleh pengelola properti didistribusikan secara proporsional on-chain kepada seluruh pemilik fraksi token, yang dapat diklaim (*claim yield*) setiap saat secara non-kustodian.

---

## 🇬🇧 Executive Summary (English)

**Kavling AI** merges physical property yield with on-chain liquidity on **BNB Chain**. By connecting autonomous AI valuation agents with audited fractional property vaults, Kavling AI delivers transparent, sub-second, and mathematically verified real estate investment.

---

## 🧮 Mathematical & Cryptographic Architecture

### 1. The Autonomous Valuation Model (AVM)
The AI Appraisal Agent implements a **Blended Valuation Model** combining the **Replacement Cost / Comparative Market Analysis (CMA)** with the **Income Capitalization (NOI) Method**:

$$\text{Replacement Cost} = \left( (\text{Land Area} \times P_{\text{land}}) + (\text{Building Area} \times P_{\text{build}} \times \delta_{\text{deprec}}) \right) \times M_{\text{growth}} \times \lambda_{\text{title}}$$

Where:
* $P_{\text{land}}, P_{\text{build}}$: Real-time regional price indices per $\text{m}^2$ (Bali: \$1,450 / \$950; Jakarta: \$2,800 / \$1,350; Yogyakarta: \$780 / \$620; Bandung: \$950 / \$700).
* $\delta_{\text{deprec}}$: Building depreciation factor ($\max(0.65, 1.0 - (\text{age} \times 0.012))$).
* $M_{\text{growth}}$: Regional growth and digital nomad momentum score.
* $\lambda_{\text{title}}$: Indonesian title deed risk coefficient ($\text{SHM} = 1.0$, $\text{HGB} = 0.94$, $\text{Hak Pakai} = 0.88$).

$$\text{Gross Potential Revenue} = \text{ADR} \times 365 \times \text{Occupancy Rate}$$
$$\text{NOI} = \text{Gross Revenue} \times (1.0 - \text{OpEx Rate}) \quad (\text{where OpEx} = 28\%)$$
$$\text{Income Capitalization Value} = \frac{\text{NOI}}{\text{CapRate}_{\text{baseline}}}$$
$$V_{\text{blended}} = \left( 0.5 \times \text{Replacement Cost} \right) + \left( 0.5 \times \text{Income Capitalization Value} \right)$$

$$\text{Annual Yield (bps)} = \left( \frac{\text{NOI}}{V_{\text{blended}}} \right) \times 10,000$$

---

### 2. EIP-712 Cryptographic Attestation Specification
To prevent front-running, price tampering, or centralized oracle collusion, appraisals are signed using **EIP-712 typed structured data**:

```solidity
struct Appraisal {
    bytes32 propertyId;
    uint256 valuationUSD;     // 18 decimals
    uint256 pricePerFraction; // 18 decimals
    uint256 annualYieldBps;   // Basis points (e.g., 980 = 9.80%)
    uint256 timestamp;
    uint256 deadline;         // Signature validity window (24h)
}
```

$$\text{APPRAISAL\_TYPEHASH} = \text{keccak256}("Appraisal(bytes32 propertyId,uint256 valuationUSD,uint256 pricePerFraction,uint256 annualYieldBps,uint256 timestamp,uint256 deadline)")$$

$$\text{Digest} = \text{keccak256}\left( \mathtt{\backslash x19\backslash x01} \parallel \text{DomainSeparator} \parallel \text{StructHash} \right)$$

The smart contract `KavlingRegistry.sol` on BNB Chain verifies the ECDSA signature:
$$\text{ecrecover}(\text{Digest}, v, r, s) \equiv \text{aiAppraiserAgent}$$

---

### 3. Pro-Rata Rental Yield Streaming Math
In `KavlingPropertyVault.sol`, cumulative rental income is tracked using masterchef-style precision accounting ($10^{18}$ scalar):

$$\Delta accYieldPerShare = \frac{\text{Deposited Rental Yield} \times 10^{18}}{\text{Total Active Fractional Shares}}$$

When an investor claims yield:
$$\text{Claimable Amount} = \left( \frac{\text{Fractional Balance}_i \times accYieldPerShare}{10^{18}} - \text{RewardDebt}_i \right) + \text{PendingYield}_i$$

---

## 🏛️ System Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 Kavling AI Web Application                  │
│   - Modulify-Inspired Dark Bento Grid Terminal              │
│   - Real-Time Mathematical AI Valuation Simulator           │
│   - Multi-Lingual Switcher: Bahasa Indonesia & English      │
│   - Guided Demo / Judge Walkthrough Simulator               │
└──────────────────────────────┬──────────────────────────────┘
                               │ User Property Input
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Autonomous AI Appraisal Agent                │
│   - Mathematical Comps & NOI Capitalization Synthesis       │
│   - Generates Real secp256k1 EIP-712 Signature Vector       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Signed Payload
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              BNB Chain / opBNB Smart Contracts              │
│                                                             │
│  1. KavlingRegistry.sol: Verifies EIP-712 AI Signatures     │
│  2. KavlingPropertyVault.sol: ERC-20 Fractions & Yield      │
│  3. MockUSDT.sol: Faucet & Settlement Currency              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Smart Contract Security & Test Suite

Built with **Foundry**, incorporating:
- `ReentrancyGuard` on all state-modifying deposit/claim functions.
- `SafeERC20` to prevent token transfer quirks.
- `Pausable` circuit breaker for emergency administrative holds.
- Non-reusable expired signature rejection (`block.timestamp > deadline`).

### Test Suite Execution Output
```text
Ran 5 tests for test/KavlingProtocol.t.sol:KavlingProtocolTest
[PASS] test_BuyWithNativeBNB_AndRefundExcess() (gas: 1975934)
[PASS] test_ComplianceGate_Enforced() (gas: 2031984)
[PASS] test_Fuzz_BuyWithUSDT(uint256) (runs: 256, μ: 1994183, ~: 1994208)
[PASS] test_RegisterPropertyWithAppraisal_Success() (gas: 1867972)
[PASS] test_YieldClaimAfterTransfer_NoUnderflow() (gas: 2160918)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 126.92ms
```

---

## 🚀 Local Development & Verification

### 1. Smart Contracts
```bash
cd contracts
forge build
forge test -vvv
```

### 2. AI Appraisal Agent Service
```bash
cd agent
npm install
npm start
# Server listens on port 3001 with active BSC Testnet telemetry
```

### 3. Frontend Web Application
```bash
cd frontend
npm install
npm run build
npm run dev
# Open http://localhost:5173
```

---

## 🎯 Alignment with Indonesia Web3 Hackathon 2026

* **Tracks:** **AI Agents** & **Finance & Commerce**
* **Workshop Integration:** Direct evolution of Workshop Sesi 3–4 (*Foundry + Vaults*) and Sesi 6 (*AI Auto-Verification*).
* **Target Network:** BNB Smart Chain Testnet (Chain ID `97`) & opBNB Testnet (Chain ID `5611`).
* **Deployment Notice:** *Smart contracts are tested, compiled, and verified locally. On-chain broadcast to BSC Testnet will be executed with explicit operator confirmation.*

---

## 📜 License
MIT License. Crafted for the global builder community and the Indonesian Web3 ecosystem.
