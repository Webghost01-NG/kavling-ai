// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/KavlingRegistry.sol";
import "../src/KavlingPropertyVault.sol";
import "../src/MockUSDT.sol";

contract KavlingProtocolTest is Test {
    KavlingRegistry public registry;
    KavlingPropertyVault public vault;
    MockUSDT public usdt;

    uint256 internal appraiserPrivateKey = 0xA11CE;
    address internal aiAppraiser;

    address internal admin = address(0xAD);
    address internal investor1 = address(0x101);
    address internal investor2 = address(0x102);

    bytes32 internal propertyId = keccak256("BALI-CANGGU-VILLA-01");

    function setUp() public {
        aiAppraiser = vm.addr(appraiserPrivateKey);

        vm.startPrank(admin);
        usdt = new MockUSDT();
        registry = new KavlingRegistry(aiAppraiser);
        vm.stopPrank();

        // Fund investors with USDT
        usdt.faucet(investor1, 100_000 * 1e18);
        usdt.faucet(investor2, 100_000 * 1e18);
    }

    function _signAppraisal(
        KavlingRegistry.Appraisal memory appraisal,
        uint256 privateKey
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                registry.APPRAISAL_TYPEHASH(),
                appraisal.propertyId,
                appraisal.valuationUSD,
                appraisal.pricePerFraction,
                appraisal.annualYieldBps,
                appraisal.timestamp,
                appraisal.deadline
            )
        );

        // Calculate EIP-712 digest
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("KavlingRegistry")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(registry)
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_RegisterPropertyWithAppraisal_Success() public {
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 500_000 * 1e18,     // $500k USD
            pricePerFraction: 50 * 1e18,       // $50 per fraction
            annualYieldBps: 920,               // 9.20% APY
            timestamp: block.timestamp,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.prank(admin);
        registry.registerPropertyWithAppraisal(
            propertyId,
            "Villa Canggu Sanctuary",
            "Bali",
            "SHM-008234-BALI",
            "ipfs://QmKavlingBaliMetadataHash",
            10_000 * 1e18,
            appraisal,
            sig
        );

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        assertEq(prop.name, "Villa Canggu Sanctuary");
        assertEq(prop.valuationUSD, 500_000 * 1e18);
        assertEq(prop.pricePerFraction, 50 * 1e18);
        assertEq(prop.annualYieldBps, 920);
        assertTrue(prop.isActive);
    }

    function test_RegisterProperty_InvalidSigner_Reverts() public {
        uint256 fakeKey = 0xB0B;
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 500_000 * 1e18,
            pricePerFraction: 50 * 1e18,
            annualYieldBps: 920,
            timestamp: block.timestamp,
            deadline: block.timestamp + 1 hours
        });

        bytes memory badSig = _signAppraisal(appraisal, fakeKey);

        vm.prank(admin);
        vm.expectRevert(KavlingRegistry.InvalidSigner.selector);
        registry.registerPropertyWithAppraisal(
            propertyId,
            "Villa Canggu Sanctuary",
            "Bali",
            "SHM-008234-BALI",
            "ipfs://QmKavlingBaliMetadataHash",
            10_000 * 1e18,
            appraisal,
            badSig
        );
    }

    function test_FractionalPurchaseAndYieldStreaming() public {
        // 1. Register property
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 100_000 * 1e18,
            pricePerFraction: 10 * 1e18, // $10 per fraction
            annualYieldBps: 1050,         // 10.50% APY
            timestamp: block.timestamp,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.startPrank(admin);
        registry.registerPropertyWithAppraisal(
            propertyId,
            "Jogja Creative Loft",
            "Yogyakarta",
            "HGB-2026-JOGJA",
            "ipfs://QmJogjaLoft",
            10_000 * 1e18,
            appraisal,
            sig
        );

        vault = new KavlingPropertyVault(
            "Kavling Jogja Loft",
            "KVL-JOGJA",
            propertyId,
            address(registry),
            address(usdt),
            10_000 * 1e18
        );
        registry.linkVault(propertyId, address(vault));
        vm.stopPrank();

        // 2. Investor 1 buys 600 fractions ($6,000 USDT)
        vm.startPrank(investor1);
        usdt.approve(address(vault), type(uint256).max);
        vault.buyWithUSDT(600 * 1e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(investor1), 600 * 1e18);

        // 3. Investor 2 buys 400 fractions ($4,000 USDT)
        vm.startPrank(investor2);
        usdt.approve(address(vault), type(uint256).max);
        vault.buyWithUSDT(400 * 1e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(investor2), 400 * 1e18);
        assertEq(vault.totalSupply(), 1000 * 1e18);

        // 4. Operator deposits $1,000 monthly rental yield from tenants
        usdt.faucet(admin, 1_000 * 1e18);
        vm.startPrank(admin);
        usdt.approve(address(vault), 1_000 * 1e18);
        vault.depositRentalYield(1_000 * 1e18);
        vm.stopPrank();

        // Investor 1 owns 60% -> should claim $600
        // Investor 2 owns 40% -> should claim $400
        assertEq(vault.calculateClaimableYield(investor1), 600 * 1e18);
        assertEq(vault.calculateClaimableYield(investor2), 400 * 1e18);

        // 5. Investor 1 claims yield
        uint256 inv1BalanceBefore = usdt.balanceOf(investor1);
        vm.prank(investor1);
        vault.claimRentalYield();
        assertEq(usdt.balanceOf(investor1) - inv1BalanceBefore, 600 * 1e18);
        assertEq(vault.calculateClaimableYield(investor1), 0);
    }

    function test_PausableCircuitBreaker() public {
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 100_000 * 1e18,
            pricePerFraction: 10 * 1e18,
            annualYieldBps: 800,
            timestamp: block.timestamp,
            deadline: block.timestamp + 1 hours
        });
        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.startPrank(admin);
        registry.registerPropertyWithAppraisal(
            propertyId,
            "Jakarta Tech Hub",
            "Jakarta",
            "SHM-JKT-09",
            "ipfs://QmJakarta",
            10_000 * 1e18,
            appraisal,
            sig
        );
        vault = new KavlingPropertyVault(
            "Kavling Jakarta Hub",
            "KVL-JKT",
            propertyId,
            address(registry),
            address(usdt),
            10_000 * 1e18
        );
        registry.linkVault(propertyId, address(vault));

        // Pause vault
        vault.pause();
        vm.stopPrank();

        vm.startPrank(investor1);
        usdt.approve(address(vault), 1000 * 1e18);
        vm.expectRevert();
        vault.buyWithUSDT(10 * 1e18);
        vm.stopPrank();
    }
}
