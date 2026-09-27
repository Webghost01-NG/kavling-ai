## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

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
export RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
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

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
