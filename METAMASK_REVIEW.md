# MetaMask domain reputation review request

## Report details

- **Domain:** https://kavling-ai.vercel.app
- **Project:** Kavling AI
- **Repository:** https://github.com/Webghost01-NG/kavling-ai
- **Purpose:** Hackathon prototype / testnet dApp
- **Network:** BNB Smart Chain Testnet
- **Chain ID:** 97 (`0x61`)
- **Observed warning:** MetaMask displays “Malicious — flagged as unsafe” when the user initiates the standard wallet connection from the app. The app does not suppress or bypass this warning. MetaMask has not approved or reviewed this project.

## Project and wallet behavior

Kavling AI demonstrates a deterministic, illustrative property valuation flow and a testnet fractional-vault workflow. It is not a production investment product, does not establish property ownership, and has no real asset or yield claims.

- The app never asks for a seed phrase, Secret Recovery Phrase, private key, wallet password, or other wallet credential.
- It does not collect wallet credentials or upload private wallet data.
- The frontend uses the standard injected EVM provider only after the user clicks **Connect wallet**: `eth_requestAccounts`, `eth_chainId`, `wallet_switchEthereumChain` and, if BSC Testnet is missing, `wallet_addEthereumChain`.
- State-changing calls are sent through the connected wallet. MetaMask presents each transaction for user review and approval; the app does not sign transactions silently.
- The app requests an EIP-712 signature from the valuation API only when that separately configured service is available; the user wallet is not asked to sign an appraisal during ordinary page load or valuation calculation.
- The code contains no fake connected address, automatic wallet connection, simulated transaction success, or fake claim success. When no compatible wallet is installed, the app displays: “MetaMask or another compatible EVM wallet is required.”
- All current tokens and native currency are testnet/mock assets. MockUSDT is a public test faucet token and has no monetary value.
- Contract source is public in the repository and verified through Sourcify. Contract links and deployment evidence are below.

## Public deployed contracts

Network: BNB Smart Chain Testnet (chain ID 97)

| Contract | Address | BscScan |
| --- | --- | --- |
| MockUSDT | `0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17` | [Contract page](https://testnet.bscscan.com/address/0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17) |
| KavlingRegistry | `0x0908E0409d593409D251306302FDca0C45198B9C` | [Contract page](https://testnet.bscscan.com/address/0x0908E0409d593409D251306302FDca0C45198B9C) |
| KavlingPropertyVault | `0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a` | [Contract page](https://testnet.bscscan.com/address/0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a) |

## Evidence and request checklist

Attach the following when submitting a false-positive/reputation review:

1. A screenshot of the exact MetaMask warning, including which MetaMask product/version and the time it appeared.
2. The exact affected URL, `https://kavling-ai.vercel.app`, and confirmation that it uses HTTPS.
3. This repository URL and the source commit being reviewed.
4. The contract address pages above and the independent deployment record in [DEPLOYMENT.md](DEPLOYMENT.md).
5. A concise description of the wallet methods listed above and confirmation that all writes require explicit wallet approval.
6. Contact/ownership details through the review form only; do not publish personal information in a public issue.

MetaMask's published route for a site owner who believes a warning is a false positive is the [`eth-phishing-detect` GitHub issue tracker](https://github.com/MetaMask/eth-phishing-detect/issues). Follow its current contribution/reporting instructions and include the evidence above. MetaMask recommends users avoid connecting to sites that show this warning; this document is for the site owner's review request and is not an instruction to bypass wallet protections. See the [MetaMask warning and reporting guidance](https://support.metamask.io/ru/stay-safe/safety-in-web3/deceptive-site-ahead-when-trying-to-connect-to-a-site/).

## Review status

**PENDING — not submitted.** No claim of MetaMask approval, review, or whitelist status is made.
