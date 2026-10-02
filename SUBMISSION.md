# Kavling AI — hackathon submission copy

## Project Name

Kavling AI

## Tagline

Explainable Indonesian property valuation, signed appraisals, and fractional vault mechanics on BNB Chain.

## Track

AI Agents; Finance & Commerce

## Problem

Property evaluation and access can be difficult when market evidence, use restrictions, title context, and regional risks are fragmented, while direct ownership requires significant capital. This prototype explores an auditable analysis and onchain transaction flow; it does not verify legal title or create enforceable property ownership.

## Solution

A deterministic Python valuation agent calculates estimates from explicit regional, zoning, title, building, and risk assumptions, then signs the appraisal payload with EIP-712. A Solidity registry checks the configured signer, expiry, timestamp, and per-property sequential nonce. A linked property vault demonstrates fractional accounting, funding escrow/refunds, and test-asset yield accounting.

## Why It Matters in Indonesia

The model explicitly represents Indonesian city scenarios and title categories such as SHM, HGB, and Hak Pakai. It treats zoning and local climate/seismic exposure as relevant analysis inputs, while making clear that all current figures and legal/title references are illustrative rather than sourced from official systems.

## Why BNB Chain

The EVM-compatible network supports wallet-submitted Solidity transactions and EIP-712 typed-data verification. The live demonstration is deployed to BNB Smart Chain Testnet, chain ID 97.

## AI Component

An automated Python agent computes a deterministic AVM using curated/hard-coded regional baselines and formulas for land/building value, zoning, title type, and modeled climate/seismic risk. It reads the deployed property nonce when the configured registry is reachable and signs an EIP-712 appraisal. It is not a trained model; it has no live BMKG, government, title, or market-data integration. A valid signature proves who signed the payload, not that the appraisal inputs are true.

## Blockchain Component

`KavlingRegistry` stores appraisal/property data and checks EIP-712 signatures, deadlines, and sequential nonces. A per-property `KavlingPropertyVault` issues fractional ERC-20 units and demonstrates USDT-like test-token or tBNB purchases, soft-cap escrow/refunds, and USDT/native-BNB reward accounting. `MockUSDT` is a faucet token without monetary value.

## Key Features

- Explainable property valuation studio with explicit assumptions.
- EIP-712 appraisal proof inspector and registry submission.
- Live BSC Testnet registry/vault reads and wallet transaction controls.
- Fraction purchases in MockUSDT or tBNB; funding finalization and test-yield flows.
- BscScan links for deployments and confirmed transaction receipts.

## Technical Architecture

Browser frontend → FastAPI deterministic AVM/signing service → EIP-712 payload → wallet-submitted `KavlingRegistry` transaction → linked per-property vault → investor/test-token interactions.

## Contract Addresses

Network: BNB Smart Chain Testnet (97)

- MockUSDT: `0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17`
- KavlingRegistry: `0x0908E0409d593409D251306302FDca0C45198B9C`
- KavlingPropertyVault: `0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a`

## BscScan Links

- [MockUSDT](https://testnet.bscscan.com/address/0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17)
- [KavlingRegistry](https://testnet.bscscan.com/address/0x0908E0409d593409D251306302FDca0C45198B9C)
- [KavlingPropertyVault](https://testnet.bscscan.com/address/0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a)
- [Fraction purchase](https://testnet.bscscan.com/tx/0xe4a679c3abb2da19d9863b15c13ae3f1ee6cf3948609a246adacd2922ef443f9)
- [Funding finalization](https://testnet.bscscan.com/tx/0xb583e8ca21237c23aa464d29727757f3b306094de2b0d8ff40d04afde3fe1e52)
- [Agent-signed appraisal update](https://testnet.bscscan.com/tx/0x19d149fb12c7d9e124190ded89cead0b1be9b26046df3e30220ddb4734d821d5)

## GitHub Repository

https://github.com/Webghost01-NG/kavling-ai

## Demo URL

https://kavling-ai.vercel.app

The public production frontend is manually deployed. A push to `feat/submission-hardening` automatically created a Vercel Preview deployment; that branch does not currently update the stable production alias.

## Demo Video URL

PENDING

## Tech Stack

Solidity 0.8.34, Foundry, OpenZeppelin contracts, Python 3.14 runtime in local test environment / FastAPI / Web3.py / eth-account, browser JavaScript ES modules, ethers.js 6, Vercel static hosting, Render Blueprint for the separate agent service.

## Testing Evidence

- Foundry: 12/12 tests pass; fuzz test executed 256 runs.
- Python: 17/17 tests pass (one Starlette/httpx deprecation warning).
- Testnet: successful deployment receipts, bytecode reads, Sourcify exact-match verification for all three contracts, and successful registration, vault linking, USDT/native buys, funding finalization, yield deposits/USDT claim, and agent-signed appraisal update. Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for receipts and details.
- Frontend: headless Chromium confirmed live RPC values render on the public site. Hosted API signing is not yet wired/deployed, and the wallet write path was not browser-tested with an interactive wallet in this environment.

## Current Limitations

- Render signing API is not yet deployed/healthy. The live app currently displays an unsigned local estimate; a separate API→registry signing flow was tested directly against the deployed registry. An operator must provision the Render service with the appraiser key, deployed registry address, CORS origin, and frontend agent URL.
- Property title, location, market values, regional baselines, climate/seismic inputs, and yield are not independently sourced or verified.
- One illustrative property is registered; the issuer and smoke-test investor were the same wallet.
- MockUSDT and tBNB are testnet-only. This is not an audited production system or legally enforceable real-estate tokenization.

## Future Roadmap

Provision a dedicated low-balance signing service; add sourced and timestamped market/risk data; run independent smart-contract, data, and legal reviews before considering real assets.
