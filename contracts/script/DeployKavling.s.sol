// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/KavlingRegistry.sol";
import "../src/KavlingPropertyVault.sol";
import "../src/MockUSDT.sol";

contract DeployKavlingScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address aiAppraiser = vm.envOr("AI_APPRAISER_ADDRESS", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDT (or use existing BSC Testnet USDT)
        MockUSDT usdt = new MockUSDT();
        console.log("MockUSDT deployed to:", address(usdt));

        // 2. Deploy KavlingRegistry
        KavlingRegistry registry = new KavlingRegistry(aiAppraiser);
        console.log("KavlingRegistry deployed to:", address(registry));

        // 3. Register Flagship Property: Canggu Sanctuary Villa
        bytes32 propertyId = keccak256("BALI-CANGGU-VILLA-01");
        
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 750_000 * 1e18,     // $750k USD
            pricePerFraction: 50 * 1e18,       // $50 per fraction
            annualYieldBps: 980,               // 9.80% APY
            timestamp: block.timestamp,
            nonce: 1,
            deadline: block.timestamp + 365 days
        });

        // Compute and sign EIP-712 digest
        bytes32 structHash = keccak256(
            abi.encode(
                registry.APPRAISAL_TYPEHASH(),
                appraisal.propertyId,
                appraisal.valuationUSD,
                appraisal.pricePerFraction,
                appraisal.annualYieldBps,
                appraisal.timestamp,
                appraisal.nonce,
                appraisal.deadline
            )
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("KavlingRegistry")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(registry)
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(deployerPrivateKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        registry.registerPropertyWithAppraisal(
            propertyId,
            "Canggu Sanctuary Eco-Villa",
            "Bali, Indonesia",
            "SHM-0892-BALI",
            "ipfs://bafybeicangguvillabali",
            15_000 * 1e18,
            appraisal,
            sig
        );

        // 4. Deploy Vault for Canggu Villa with Escrow Protection
        KavlingPropertyVault vault = new KavlingPropertyVault(
            "Kavling Bali Canggu Villa",
            "KVL-CANGGU",
            propertyId,
            address(registry),
            address(usdt),
            15_000 * 1e18,
            300_000 * 1e18, // $300,000 Soft-Cap
            30              // 30 days
        );
        console.log("KavlingPropertyVault (Canggu) deployed to:", address(vault));

        registry.linkVault(propertyId, address(vault));

        vm.stopBroadcast();
    }
}
