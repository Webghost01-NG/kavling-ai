## Kavling AI Contracts

Foundry-based Solidity contracts, tests, and the BNB Smart Chain Testnet deployment script.

## Kavling deployment

The supported deployment script creates a testnet-only `MockUSDT`, registry, initial appraisal, and escrow vault, then links the vault to the registry. It requires explicit secrets; there is no development-key fallback.

### 1. Install dependencies

```shell
git submodule update --init --recursive
forge install
forge build
forge test -vvv
```

### 2. Configure a disposable testnet wallet

Fund a dedicated wallet with test BNB. Never use a mainnet key and never commit the variables below.

```shell
export DEPLOYER_PRIVATE_KEY=0x...
export RPC_URL=https://bsc-testnet-dataseed.bnbchain.org
export CHAIN_ID=97
```

The deployer is also the appraisal signer by default. To separate those identities, additionally set `AI_APPRAISER_PRIVATE_KEY` and `AI_APPRAISER_ADDRESS` to matching values.

### 3. Simulate, then broadcast

```shell
forge script script/DeployKavling.s.sol:DeployKavlingScript \
  --rpc-url "$RPC_URL" \
  -vvvv

forge script script/DeployKavling.s.sol:DeployKavlingScript \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast \
  -vvvv
```

After broadcasting, record the printed MockUSDT, registry, and vault addresses in an untracked deployment file or your hosting provider's environment variables. Do not put private keys in frontend code. Verify the addresses and transactions on the appropriate block explorer before describing the deployment as live.

`MockUSDT` is a faucet token for testnet/local testing only. It is not real USDT and has no redemption value.

## Build and test

```shell
forge build
forge test -vvv
```

## Deployed BNB Smart Chain Testnet instance

The current demo deployment is recorded in the root [DEPLOYMENT.md](../DEPLOYMENT.md), including receipt hashes, constructor arguments, Sourcify verification, and smoke-test evidence. These addresses are for chain ID 97 only; do not use them as mainnet contracts.
