// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/KavlingRegistry.sol";
import "../src/KavlingPropertyVault.sol";
import "../src/MockUSDT.sol";

/**
 * @title DeployKavlingProtocol
 * @notice Automated deployment script for BNB Smart Chain Testnet (Chain ID 97) or opBNB Testnet (Chain ID 5611).
 */
contract DeployKavlingProtocol is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address aiAppraiser = vm.envOr("AI_APPRAISER_ADDRESS", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("MockUSDT deployed to:", address(usdt));

        // 2. Deploy KavlingRegistry
        KavlingRegistry registry = new KavlingRegistry(aiAppraiser);
        console.log("KavlingRegistry deployed to:", address(registry));

        // 3. Register initial Genesis property: Villa Canggu Bali
        bytes32 baliPropId = keccak256("VILLA-CANGGU-BALI-01");
        
        // 4. Deploy first KavlingPropertyVault
        KavlingPropertyVault baliVault = new KavlingPropertyVault(
            "Kavling Villa Canggu",
            "KVL-BALI",
            baliPropId,
            address(registry),
            address(usdt),
            15_000 * 1e18
        );
        console.log("KavlingPropertyVault (Bali) deployed to:", address(baliVault));

        vm.stopBroadcast();
    }
}
