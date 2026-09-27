# 🏝️ Kavling AI — Autonomous Real Estate Tokenization Protocol on BNB Chain

[![BNB Smart Chain](https://img.shields.io/badge/Blockchain-BNB%20Chain%20Testnet%20(97)-F3BA2F?style=for-the-badge&logo=binance&logoColor=black)](https://testnet.bscscan.com)
[![opBNB](https://img.shields.io/badge/L2-opBNB%20Compatible-F0B90B?style=for-the-badge&logo=binance&logoColor=black)](https://opbnb.bnbchain.org)
[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.34-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Tested%20With-Foundry%20(Forge)-E53935?style=for-the-badge)](https://getfoundry.sh/)
[![EIP-712](https://img.shields.io/badge/Security-EIP--712%20Signed%20Oracles-10B981?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-712)
[![Hackathon](https://img.shields.io/badge/Hackathon-Indonesia%20Web3%20Hackathon%202026-blue?style=for-the-badge)](https://indonesiaweb3hack.xyz)

> **Fractional Indonesian & Southeast Asian Prime Real Estate, autonomously appraised by verifiable AI agents and tokenized on BNB Chain with sub-$5 micro-investments and automated rental yield streaming.**

---

## 🇮🇩 Ringkasan Eksekutif (Bahasa Indonesia)

**Kavling AI** adalah protokol tokenisasi aset dunia nyata (Real World Assets / RWA) berbasis kecerdasan buatan (AI) yang dibangun di atas ekosistem **BNB Chain** (BNB Smart Chain & opBNB).

* **Masalah:** Investasi properti di Indonesia (seperti villa di Bali, perkantoran di SCBD Jakarta, atau creative loft di Yogyakarta) membutuhkan modal miliaran rupiah, proses notaris yang memakan waktu berminggu-minggu, serta biaya penilaian appraisal manual yang mahal dan tidak transparan.
* **Solusi Kami:** Kavling AI mendemokratisasi kepemilikan properti dengan membagi aset legal (SHM / HGB) menjadi pecahan token fraksional mulai dari **$5 USD**. Agen AI otonom kami melakukan valuasi wajar secara instan menggunakan data spasial dan perbandingan pasar lokal, menandatanganinya dengan standar kriptografis **EIP-712**, dan menerbitkan vault on-chain di BNB Chain dengan bagi hasil sewa otomatis.

---

## 🌍 Executive Summary (English)

**Kavling AI** bridges institutional artificial intelligence and on-chain decentralized finance to unlock liquid, fractional ownership of prime Southeast Asian real estate on **BNB Chain**.

* **The Problem:** Prime real estate in emerging economies remains illiquid, capital-intensive, and paper-burdened. Retail investors cannot participate in lucrative rental yields, while manual appraisals are slow, subjective, and prone to manipulation.
* **The Solution:** An autonomous **AI Property Appraisal Agent** synthesizes geospatial data, historical occupancy, and rental capitalization rates into **EIP-712 cryptographically signed valuation proofs**. These proofs are verified on-chain by `KavlingRegistry.sol` to deploy fractional ERC-20 vaults (`KavlingPropertyVault.sol`) on BNB Chain, enabling sub-second transactions, sub-$5 entry thresholds, and automated rental dividend streaming.

---

## 🏗️ System Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                  Kavling AI Modulify UI                     │
 │          (React 18 + Vite + Tailwind + Bilingual EN/ID)     │
 └──────────────┬───────────────────────────────┬──────────────┘
                │                               │
       Appraisal Input Params                   │ Buy / Claim Yield
                ▼                               ▼
 ┌──────────────────────────────┐     ┌────────────────────────────────┐
 │   Autonomous AI Valuation    │     │      BNB Smart Chain Testnet   │
 │        Agent Engine          │     │          (Chain ID 97)         │
 │  - Geospatial Comps (Bali,   │     ├────────────────────────────────┤
 │    Jakarta, Jogja, Bandung)  │     │ 1. KavlingRegistry.sol         │
 │  - Cap Rate & Yield Scoring  │     │    - EIP-712 Signature Check   │
 │  - EIP-712 Typed Data Signer │     │    - Property Asset Registry   │
 └──────────────┬───────────────┘     ├────────────────────────────────┤
                │                     │ 2. KavlingPropertyVault.sol    │
        EIP-712 Signed Proof          │    - Fractional Tokens (KVL)   │
        (v, r, s + Digest Hash)       │    - Pro-Rata Rental Streaming │
                │                     ├────────────────────────────────┤
                └────────────────────>│ 3. MockUSDT.sol                │
                                      │    - Instant Settlement Faucet │
                                      └────────────────────────────────┘
```

---

## 🌟 Key Technical Innovations

1. **🤖 Autonomous Multi-Factor AVM (Automated Valuation Model):**
   * Computes district-level building & land valuations across Indonesian high-demand cities (Bali Canggu/Uluwatu, Jakarta SCBD/Kuningan, Yogyakarta Prawirotaman, Bandung Dago).
   * Incorporates legal certificate weights (SHM Freehold vs. HGB Commercial Leasehold).
2. **🔐 Cryptographically Verifiable AI Valuations (EIP-712):**
   * Eliminates centralized oracle vulnerabilities. The AI agent signs typed appraisal structs off-chain (`propertyId`, `valuationUSD`, `pricePerFraction`, `annualYieldBps`, `deadline`).
   * `KavlingRegistry.sol` recovers the signer on-chain with zero gas overhead, reverting if unauthorized (`revert InvalidSigner()`).
3. **💸 Micro-Fractionalization on BNB Chain ($5 Minimum):**
   * Leveraging BNB Chain & opBNB's sub-cent gas fees, investors can purchase as little as 0.1 fraction of a luxury villa or commercial building.
4. **🌊 Automated On-Chain Rental Yield Streaming:**
   * Physical tenant rent is deposited into the smart vault in USDT.
   * Cumulative yield tracking (`accYieldPerShare`) allows fractional token holders to withdraw accumulated rental dividends at any moment.
5. **🎮 1-Click Judge Simulator / Guided Demo:**
   * Dedicated interactive walkthrough (`/simulator`) demonstrating the complete 3-step lifecycle: AI appraisal ➔ on-chain verification ➔ fractional purchase & rental claim.
6. **🇮🇩 Bilingual Interface (English & Bahasa Indonesia):**
   * Seamless one-click language toggle across the entire application.

---

## 📄 Smart Contracts Reference (BNB Smart Chain Testnet)

| Contract | Network | Compiler | Function / Purpose |
| :--- | :--- | :--- | :--- |
| **`KavlingRegistry.sol`** | BSC Testnet (97) | Solidity 0.8.34 | Central registry; verifies EIP-712 AI signatures & links vaults |
| **`KavlingPropertyVault.sol`** | BSC Testnet (97) | Solidity 0.8.34 | Fractional token (ERC-20); manages purchases & rental yield streaming |
| **`MockUSDT.sol`** | BSC Testnet (97) | Solidity 0.8.34 | Testnet payment token with built-in public faucet |
| **`DeployKavling.s.sol`** | BSC Testnet (97) | Foundry Script | Automated deployment & initial asset registration pipeline |

---

## 🧪 Verification & Automated Testing

### 1. Smart Contracts (Foundry)
All smart contracts have been thoroughly verified with the Foundry forge test runner:
```bash
cd contracts
forge test -vvv
```
**Test Results:**
```text
Ran 4 tests for test/KavlingProtocol.t.sol:KavlingProtocolTest
[PASS] test_FractionalPurchaseAndYieldStreaming() (gas: 1794269)
[PASS] test_PausableCircuitBreaker() (gas: 1533717)
[PASS] test_RegisterPropertyWithAppraisal_Success() (gas: 330676)
[PASS] test_RegisterProperty_InvalidSigner_Reverts() (gas: 29236)
Suite result: ok. 4 passed; 0 failed; 0 skipped
```

### 2. Autonomous AI Appraisal Engine
Unit tests verify the valuation math, comps scoring, and cryptographic EIP-712 signature verification:
```bash
cd agent
npm test
```
**Test Results:**
```text
✔ KavlingAIEngine - evaluates property and generates accurate comps
✔ KavlingAIEngine - generates valid EIP-712 cryptographic signature
tests 2 | pass 2 | fail 0
```

### 3. Frontend Production Build
The Modulify-inspired frontend compiles with zero warnings or errors:
```bash
cd frontend
npm run build
```
**Build Output:**
```text
✓ 1573 modules transformed.
dist/index.html                   1.08 kB
dist/assets/index.css            26.95 kB
dist/assets/index.js            212.92 kB
✓ built in 6.03s
```

---

## 🚀 Local Quickstart Guide

### Prerequisites
* **Node.js**: v18+ or v20+
* **Foundry (`forge`)**: Installed locally

### 1. Clone & Setup
```bash
git clone https://github.com/Webghost01-NG/kavling-ai.git
cd kavling-ai
```

### 2. Run Smart Contract Tests
```bash
cd contracts
forge test
```

### 3. Launch the AI Appraisal Agent
```bash
cd ../agent
npm install
npm start
# Agent REST API runs on http://localhost:3001
```

### 4. Launch the Sleek Modulify Frontend
```bash
cd ../frontend
npm install
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 🏆 Indonesia Web3 Hackathon 2026 Submission Context

* **Event:** Indonesia Web3 Hackathon 2026 (#WhereBuildersBuild)
* **Organizers:** Binance Academy, BNB Chain, Coinvestasi, Dev Web3 Jogja
* **Tracks Entered:**
  1. **AI Agents:** Autonomous real estate valuation agent capable of making independent economic appraisals and issuing cryptographic proofs on-chain.
  2. **Finance & Commerce:** Micro-fractional RWA vaults with automated pro-rata rental yield distribution.
  3. **Consumer Apps:** Intuitive bilingual mobile-first dApp removing Web3 complexity for everyday Indonesian property investors.
* **Demo Day Location:** Yogyakarta, Indonesia (October 2026)

---

## 📜 License
Licensed under the **MIT License**. Built with ❤️ for the **Indonesia Web3 Hackathon 2026**.
