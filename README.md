# 🏛️ Kavling AI — Autonomous AI Appraisal & Micro-Fractional Real Estate Protocol

[![BNB Smart Chain](https://img.shields.io/badge/Blockchain-BNB%20Chain%20%7C%20opBNB-F0B90B?style=for-the-badge&logo=binance&logoColor=black)](https://bnbchain.org)
[![Solidity](https://img.shields.io/badge/Smart%20Contracts-Solidity%200.8.20%20(Foundry)-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![EIP-712](https://img.shields.io/badge/Security-EIP--712%20Signed%20Appraisals-C9A84C?style=for-the-badge)](https://eips.ethereum.org/EIPS/eip-712)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%20%7C%20Tailwind%20CSS-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Autonomous Real Estate Tokenization on BNB Chain — Demarcating prime Southeast Asian physical assets into verifiable, yield-bearing micro-fractions from as low as \$5.**  
> *Submission for Indonesia Web3 Hackathon 2026 (BNB Chain × Binance Academy × Coinvestasi × Dev Web3 Jogja).*

---

## 🇮🇩 Ringkasan Eksekutif (Bahasa Indonesia)

**Kavling AI** adalah protokol tokenisasi aset properti (*Real World Assets* / RWA) berbasis **BNB Chain & opBNB** yang memecahkan hambatan modal tinggi dan penilaian properti yang lambat serta subjektif.

Di Indonesia dan Asia Tenggara, properti berimbal hasil tinggi (seperti villa di Canggu Bali, ruko komersial di Sudirman Jakarta, hingga creative loft di Yogyakarta) tidak terjangkau bagi sebagian besar investor retail, dengan proses valuasi manual yang memakan waktu berminggu-minggu.

**Solusi Kavling AI:**
1. **AI Appraisal Agent Mandiri:** Agen cerdas menganalisis data pembanding pasar (*comps*), tingkat okupansi, dan proyeksi hasil sewa (*rental yield*), lalu menerbitkan bukti valuasi terenkripsi **EIP-712** secara on-chain.
2. **Micro-Kavling Token ($5 Min):** Pengguna dapat membeli fraksi aset legal mulai dari \$5 USDT/tBNB dengan biaya transaksi sub-sen di opBNB.
3. **Yield Streaming Otomatis:** Penghasilan sewa dari penyewa fisik disalurkan langsung ke smart vault dan dapat diklaim oleh seluruh pemegang fraksi secara pro-rata kapan saja.

---

## 🇬🇧 Executive Summary (English)

**Kavling AI** bridges physical Southeast Asian real estate and DeFi liquidity on **BNB Chain**. By integrating autonomous AI appraisal agents with decentralized property vaults, Kavling AI enables transparent, instant, and fractional property investment.

### The Problem
* **High Capital Moat:** Prime properties require \$100,000+ upfront capital.
* **Opaque Offline Appraisals:** Property valuations are slow, subjective, and centralized.
* **Illiquidity & Fee Friction:** Traditional legal fractionalization is paperwork-heavy and high gas fees on L1 prevent micro-investments.

### The Kavling AI Solution
* **Cryptographic AI Appraisals:** An autonomous valuation agent synthesizes real-time neighborhood metrics, rental yields, and macroeconomic indexes into **EIP-712 typed signatures**.
* **Micro-Fractional Vaults (`KavlingPropertyVault.sol`):** ERC-20 compliant fractional ownership tokens with a \$5 minimum entry threshold.
* **Automated Rental Yield Streaming:** Real-time on-chain accounting (`accYieldPerShare`) allowing investors to claim their rental revenue share in USDT/BNB at any time.

---

## 🏗️ Architecture & Protocol Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Kavling AI Web Terminal                   │
│   - Modulify-Inspired Dark Bento Grid & Telemetry UI        │
│   - Live Interactive AI Property Appraisal Simulator        │
│   - Multi-Language Switcher (Bahasa Indonesia / English)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ EIP-712 Appraisal Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Autonomous AI Appraiser Agent               │
│   - Deep Neighborhood Comps & Cap Rate Synthesizer          │
│   - Generates EIP-712 Digest & Cryptographic Signature      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Verified Signature & Struct
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              BNB Chain / opBNB Smart Contracts              │
│                                                             │
│  1. KavlingRegistry.sol: Verifies EIP-712 AI Signatures     │
│  2. KavlingPropertyVault.sol: Fractional Minting & Yield    │
│  3. MockUSDT.sol: Liquidity settlement token                │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Smart Contracts (Foundry Verified)

| Contract | Description | Status |
| :--- | :--- | :---: |
| **`KavlingRegistry.sol`** | Master asset registry verifying EIP-712 appraisals from the AI Agent | ✅ Tested |
| **`KavlingPropertyVault.sol`** | Fractional ERC-20 vault with automated rental yield distribution | ✅ Tested |
| **`MockUSDT.sol`** | Faucet-enabled USDT settlement token for testnet demo | ✅ Tested |

### Running Contract Tests

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

---

## 🚀 Quickstart

### 1. Smart Contracts
```bash
cd contracts
forge build
forge test
```

### 2. Frontend dApp
```bash
cd frontend
npm install
npm run dev
```

---

## 👥 Hackathon Alignment

* **Event:** Indonesia Web3 Hackathon 2026
* **Organizers:** Binance Academy, BNB Chain, Coinvestasi & Dev Web3 Jogja
* **Tracks:** **AI Agents** & **Finance & Commerce**
* **Target Network:** BNB Smart Chain Testnet (Chain ID `97`) & opBNB Testnet (Chain ID `5611`)

---

## 📜 License
MIT License. Built with ❤️ for the global builder community and Indonesian Web3 ecosystem.
