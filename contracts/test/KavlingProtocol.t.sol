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

        // Fund investors with USDT & native BNB
        usdt.faucet(investor1, 100_000 * 1e18);
        usdt.faucet(investor2, 100_000 * 1e18);
        vm.deal(investor1, 100 ether);
        vm.deal(investor2, 100 ether);
        vm.deal(admin, 10 ether);
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

    function _setupPropertyAndVault() internal {
        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 500_000 * 1e18,     // $500k USD
            pricePerFraction: 50 * 1e18,       // $50 per fraction
            annualYieldBps: 980,               // 9.80% APY
            timestamp: block.timestamp,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.startPrank(admin);
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

        vault = new KavlingPropertyVault(
            "Kavling Bali Canggu Villa",
            "KVL-CANGGU",
            propertyId,
            address(registry),
            address(usdt),
            10_000 * 1e18
        );
        registry.linkVault(propertyId, address(vault));
        vm.stopPrank();
    }

    function test_RegisterPropertyWithAppraisal_Success() public {
        _setupPropertyAndVault();
        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        assertEq(prop.name, "Villa Canggu Sanctuary");
        assertEq(prop.valuationUSD, 500_000 * 1e18);
        assertEq(prop.pricePerFraction, 50 * 1e18);
        assertEq(prop.annualYieldBps, 980);
        assertTrue(prop.isActive);
    }

    function test_BuyWithNativeBNB_AndRefundExcess() public {
        _setupPropertyAndVault();

        // 1 fraction is $50. With BNB @ $600, 1 fraction = 50/600 = 0.083333333333333333 BNB
        // Buyer sends 1.0 BNB -> Should receive ~0.916666 BNB refund
        uint256 initialInvestorBalance = investor1.balance;

        vm.prank(investor1);
        vault.buyWithBNB{value: 1 ether}(1 * 1e18);

        assertEq(vault.balanceOf(investor1), 1 * 1e18);
        uint256 costUSD = 50 * 1e18;
        uint256 bnbPrice = 600 * 1e18;
        uint256 expectedBNBCost = (costUSD * 1e18) / bnbPrice;
        assertEq(initialInvestorBalance - investor1.balance, expectedBNBCost);
    }

    function test_YieldClaimAfterTransfer_NoUnderflow() public {
        _setupPropertyAndVault();

        // Investor 1 buys 100 fractions ($5,000)
        vm.startPrank(investor1);
        usdt.approve(address(vault), type(uint256).max);
        vault.buyWithUSDT(100 * 1e18);
        vm.stopPrank();

        // Operator deposits $1,000 rental yield
        usdt.faucet(admin, 1_000 * 1e18);
        vm.startPrank(admin);
        usdt.approve(address(vault), 1_000 * 1e18);
        vault.depositRentalYield(1_000 * 1e18);
        vm.stopPrank();

        // Investor 1 transfers 40 fractions to Investor 2
        vm.prank(investor1);
        vault.transfer(investor2, 40 * 1e18);

        // Operator deposits another $500 rental yield
        usdt.faucet(admin, 500 * 1e18);
        vm.startPrank(admin);
        usdt.approve(address(vault), 500 * 1e18);
        vault.depositRentalYield(500 * 1e18);
        vm.stopPrank();

        // VERIFY: Neither call underflows, both claim exactly what they are owed!
        // Inv 1 was 100% owner for period 1 ($1000), and 60% owner for period 2 ($300) = $1,300 total
        // Inv 2 was 0% owner for period 1 ($0), and 40% owner for period 2 ($200) = $200 total
        assertEq(vault.calculateClaimableYield(investor1), 1300 * 1e18);
        assertEq(vault.calculateClaimableYield(investor2), 200 * 1e18);

        // Execute claims
        uint256 inv1USDTBefore = usdt.balanceOf(investor1);
        vm.prank(investor1);
        vault.claimRentalYield();
        assertEq(usdt.balanceOf(investor1) - inv1USDTBefore, 1300 * 1e18);

        uint256 inv2USDTBefore = usdt.balanceOf(investor2);
        vm.prank(investor2);
        vault.claimRentalYield();
        assertEq(usdt.balanceOf(investor2) - inv2USDTBefore, 200 * 1e18);
    }

    function test_ComplianceGate_Enforced() public {
        _setupPropertyAndVault();

        // Admin enables compliance
        vm.prank(admin);
        registry.setComplianceEnforced(true);

        // Unverified investor1 tries to buy -> Reverts
        vm.startPrank(investor1);
        usdt.approve(address(vault), type(uint256).max);
        vm.expectRevert(KavlingPropertyVault.InvestorNotVerified.selector);
        vault.buyWithUSDT(10 * 1e18);
        vm.stopPrank();

        // Admin verifies investor1
        vm.prank(admin);
        registry.setInvestorVerification(investor1, true);

        // Investor1 can now purchase
        vm.startPrank(investor1);
        vault.buyWithUSDT(10 * 1e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(investor1), 10 * 1e18);
    }

    function test_Fuzz_BuyWithUSDT(uint256 amount) public {
        _setupPropertyAndVault();

        // Bound amount between 0.01 fractions and 1000 fractions
        amount = bound(amount, 1e16, 1000 * 1e18);

        vm.startPrank(investor1);
        usdt.approve(address(vault), type(uint256).max);
        vault.buyWithUSDT(amount);
        vm.stopPrank();

        assertEq(vault.balanceOf(investor1), amount);
    }
}
