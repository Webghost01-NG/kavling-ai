# BNB Smart Chain Testnet deployment record

This is a receipt-derived record for the Kavling AI demo. Values marked as current state may change as the testnet contracts are used.

## Network and source

- Network: BNB Smart Chain Testnet
- Chain ID: `97`
- RPC: public BSC testnet JSON-RPC (`https://bsc-testnet-dataseed.bnbchain.org`)
- Explorer: [testnet.bscscan.com](https://testnet.bscscan.com)
- Deployment date: 2026-10-02 21:04:46 UTC
- Deployer (public address): `0x6CeD8D6Bad8Dfd2e60BCEA116fE74548f959f1F2`
- Appraiser signer: same address as deployer
- Source commit: [`42b7cd3`](https://github.com/Webghost01-NG/kavling-ai/commit/42b7cd3)
- Solidity compiler: `0.8.34`
- Foundry: `1.6.0-nightly`
- Optimizer: enabled, 200 runs; `via_ir = true`
- Deployment script: `contracts/script/DeployKavling.s.sol:DeployKavlingScript`
- Confirmation: receipts for each creation/configuration transaction returned status `0x1`; deployed bytecode was read from the BSC testnet RPC.

The Foundry dry run estimated approximately `0.0006790159 tBNB`; the broadcast gas estimate was approximately `0.0006818879 tBNB`. No repeated deployment was performed.

## Deployed contracts

| Contract | Address | Creation transaction | Block | Constructor arguments | Verification |
| --- | --- | --- | ---: | --- | --- |
| MockUSDT | `0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17` | [0x5f5fc6a9…afb0b](https://testnet.bscscan.com/tx/0x5f5fc6a9c8685f65f476a380801d8fe80f7f6108006a8c44949808dba97afb0b) | 134506917 | none | Sourcify `exact_match` |
| KavlingRegistry | `0x0908E0409d593409D251306302FDca0C45198B9C` | [0x13d8b691…e243f](https://testnet.bscscan.com/tx/0x13d8b69132a59aed5b295b098813500ecc8318dd38239518f237b721d71e243f) | 134506924 | appraiser: `0x6CeD8D6Bad8Dfd2e60BCEA116fE74548f959f1F2` | Sourcify `exact_match` |
| KavlingPropertyVault (Canggu) | `0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a` | [0x65658872…f4266](https://testnet.bscscan.com/tx/0x656588721e738eaf7c2276334e7eba8217d6ebd78d237275afa7316697ff4266) | 134506944 | name `Kavling Bali Canggu Villa`; symbol `KVL-CANGGU`; property ID below; registry `0x0908…8B9C`; MockUSDT `0x8cd2…7B17`; max fractions `15000e18`; goal `300000e18`; funding duration `30` days | Sourcify `exact_match` |

Contract address pages: [MockUSDT](https://testnet.bscscan.com/address/0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17), [KavlingRegistry](https://testnet.bscscan.com/address/0x0908E0409d593409D251306302FDca0C45198B9C), [KavlingPropertyVault](https://testnet.bscscan.com/address/0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a).

Keyless Sourcify submissions completed as exact matches for all three deployments. Foundry Sourcify job IDs: MockUSDT `833a5d76-51f9-4835-bb7a-837e7daa9e7d`; Registry `9aace793-592d-4cec-9986-04a8c152eabf`; Vault `171e4d63-5677-48c0-aabc-36f2093ab0f1`. BscScan pages may not be fetchable through automated clients; no BscScan API verification is claimed.

## Property and dependency configuration

- Property ID: `0x7f15bab648762b3f2ec1c5f3811c9968c66c15e9e0848513e95d6e726e8714e2` (`keccak256("BALI-CANGGU-VILLA-01")`)
- Registration: [transaction](https://testnet.bscscan.com/tx/0x01fd23d693c0f48118cfa1f808c67fc1211f64bb9c1cb7c015cd7dea4c9ab104), block `134506933`
- Registration values: `Canggu Sanctuary Eco-Villa`; `Bali, Indonesia`; placeholder title ref `SHM-0892-BALI`; placeholder metadata URI; 15,000 fractions; initial appraisal $750,000, $50/fraction, 980 bps; nonce 1.
- Vault linked in registry: [transaction](https://testnet.bscscan.com/tx/0xddbce25f3dd446525bae453f9e75fe6b0b40799abaa8a9ac464d5960c99cb5ae), block `134506951`.
- MockUSDT has 18 decimals, deployer owner, faucet function, and a 1,000,000 token initial supply to deployer.
- Initial vault state was Funding, with a $300,000 goal and a 30-day funding deadline.

Current state independently read from RPC on 2026-10-02: vault state `Active`; `totalUSDCollected` = `300000.5e18`; 6,000.01 fractions minted; property appraisal nonce 2; current valuation ≈ `$1,132,000`; price/fraction ≈ `$75.4667`; annual yield 1,290 bps. These values are mutable testnet state, not investment facts.

## Smoke-test transactions

Each transaction below was re-queried from BSC Testnet and returned status `0x1`.

| Action | Transaction | Block |
| --- | --- | ---: |
| Approve 300,000 MockUSDT for purchase | [0x67fd6260…41b3bd](https://testnet.bscscan.com/tx/0x67fd62600a3b20b8f1473f7d7942680e5661772d9a93533a57adc9173041b3bd) | 134506774 |
| Buy 6,000 fractions with MockUSDT | [0xe4a679c3…443f9](https://testnet.bscscan.com/tx/0xe4a679c3abb2da19d9863b15c13ae3f1ee6cf3948609a246adacd2922ef443f9) | 134506796 |
| Finalize funding; vault transfers escrow to issuer | [0xb583e8ca…1e52](https://testnet.bscscan.com/tx/0xb583e8ca21237c23aa464d29727757f3b306094de2b0d8ff40d04afde3fe1e52) | 134506813 |
| Approve and deposit 1,000 MockUSDT illustrative yield | [approve](https://testnet.bscscan.com/tx/0xb69104eeb863c476bc42c98317d0b280428b5f4be7371cc23bcfe1800abc9897), [deposit](https://testnet.bscscan.com/tx/0x2483a006223ed37d309b1a699161e4d8f3960279a38a2c5336438fde25189eb5) | 134506834, 134506851 |
| Claim MockUSDT yield | [transaction](https://testnet.bscscan.com/tx/0xa046bb91ebb8f2e8ac8d8d6d8817343c3f3b4789f71b0b2ecb607b146f099fb1) | 134506869 |
| Buy minimum 0.01 fraction with tBNB; excess refunded | [transaction](https://testnet.bscscan.com/tx/0x34d91b07090cd47220463d8b808a7871c72b0dea69abff42202c4ee12f114596) | 134506896 |
| Deposit 0.001 tBNB illustrative yield | [transaction](https://testnet.bscscan.com/tx/0x060ec34582e908333437b3cf510ee64b5ad9362ea953b6a92109dc31d9ea6947) | 134506917 |
| Appraiser signs and registry accepts updated appraisal (nonce 2) | [transaction](https://testnet.bscscan.com/tx/0x19d149fb12c7d9e124190ded89cead0b1be9b26046df3e30220ddb4734d821d5) | 134507786 |

The testnet BNB yield claim was attempted in the smoke sequence, but its transaction hash was not reliably captured for this report; it is therefore not claimed as confirmed evidence. Refund behavior is covered by Foundry tests, not an onchain smoke test. Deployment wallet was also issuer and buyer, so the funding payout returned to the same wallet; no independent investor wallet was used.

## Frontend and hosted agent

- Frontend: [https://kavling-ai.vercel.app](https://kavling-ai.vercel.app), public production deployment; GitHub repository connected to the Vercel project, with `frontend/` as root.
- Vercel production deployment: [live app](https://kavling-ai.vercel.app). A push to `feat/submission-hardening` automatically created a Vercel Git Preview deployment, confirming that the repository connection works. The stable production alias is not updated by pushes to this non-production branch; the Vercel production branch must be changed in project settings or the feature branch merged to the configured production branch. No merge was performed.
- Render Blueprint: `render.yaml`, `autoDeploy: true`. The public Render hostname currently returns 404; the signing API is **not deployed/healthy**.
- To activate agent signing, create/update the Render Blueprint and set `AGENT_PRIVATE_KEY` (secret) and `REGISTRY_ADDRESS=0x0908E0409d593409D251306302FDca0C45198B9C` in Render. Configure `CORS_ORIGINS=https://kavling-ai.vercel.app`; the key must correspond to the deployed registry appraiser address shown above. Then a frontend release must configure `deployment.agentUrl` to the live Render origin. Never commit the signing key. Until those setup/deploy steps are done, hosted UI appraisals are unsigned local estimates (the separately tested API→registry flow was run with a temporary process environment).

## Reproduce deployment

Use a disposable BSC Testnet wallet and protect the key in the shell/secret manager; do not write it into the repository or commit it. From `contracts/`:

```bash
export RPC_URL=https://bsc-testnet-dataseed.bnbchain.org
export CHAIN_ID=97
# Set DEPLOYER_PRIVATE_KEY through your secure secret manager.
forge build
forge test -vvv
forge script script/DeployKavling.s.sol:DeployKavlingScript --rpc-url "$RPC_URL" -vvvv
forge script script/DeployKavling.s.sol:DeployKavlingScript --rpc-url "$RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast -vvvv
```

The deployment script also reads the same key from `DEPLOYER_PRIVATE_KEY` through Foundry; the explicit option above is retained to match the documented script workflow. Never put a real private key into a tracked file or shell transcript.

## Web links

- GitHub source: https://github.com/Webghost01-NG/kavling-ai
- Live frontend: https://kavling-ai.vercel.app
- Registry: https://testnet.bscscan.com/address/0x0908E0409d593409D251306302FDca0C45198B9C
- Vault: https://testnet.bscscan.com/address/0xbb42F96B7Dd1FC127f7A9729C178EFE15ADa8F0a
- Token: https://testnet.bscscan.com/address/0x8cd2DA9E45D18c47A803f065a3625AE68bF37B17
