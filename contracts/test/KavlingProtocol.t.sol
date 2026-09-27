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
        vm.deal(admin, 50 ether);
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
            nonce: 1,
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
            10_000 * 1e18,
            0, // Instant Active for base tests
            30
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
        assertEq(registry.propertyNonces(propertyId), 1);
    }

    function test_ReplayAttack_RevertsOnOldOrInvalidNonce() public {
        _setupPropertyAndVault();

        // Attempting to reuse nonce 1 should revert with InvalidNonce
        KavlingRegistry.Appraisal memory replayedAppraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 520_000 * 1e18,
            pricePerFraction: 52 * 1e18,
            annualYieldBps: 1020,
            timestamp: block.timestamp + 100,
            nonce: 1, // Replaying old nonce!
            deadline: block.timestamp + 2 hours
        });

        bytes memory sig = _signAppraisal(replayedAppraisal, appraiserPrivateKey);

        vm.expectRevert(KavlingRegistry.InvalidNonce.selector);
        registry.updateAppraisal(replayedAppraisal, sig);

        // Updating with correct sequential nonce (nonce 2) succeeds!
        KavlingRegistry.Appraisal memory validAppraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 520_000 * 1e18,
            pricePerFraction: 52 * 1e18,
            annualYieldBps: 1020,
            timestamp: block.timestamp + 100,
            nonce: 2, // Correct sequential nonce
            deadline: block.timestamp + 2 hours
        });

        bytes memory validSig = _signAppraisal(validAppraisal, appraiserPrivateKey);
        registry.updateAppraisal(validAppraisal, validSig);

        assertEq(registry.propertyNonces(propertyId), 2);
        assertEq(registry.getProperty(propertyId).valuationUSD, 520_000 * 1e18);
    }

    function test_StaleTimestamp_Reverts() public {
        _setupPropertyAndVault();

        // Appraisal with stale timestamp <= lastAppraisalTimestamp
        KavlingRegistry.Appraisal memory staleAppraisal = KavlingRegistry.Appraisal({
            propertyId: propertyId,
            valuationUSD: 530_000 * 1e18,
            pricePerFraction: 53 * 1e18,
            annualYieldBps: 1000,
            timestamp: block.timestamp, // Stale!
            nonce: 2,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(staleAppraisal, appraiserPrivateKey);

        vm.expectRevert(KavlingRegistry.StaleAppraisal.selector);
        registry.updateAppraisal(staleAppraisal, sig);
    }

    function test_SoftCapEscrow_FinalizeSuccess_ReleasesCapital() public {
        bytes32 escrowPropId = keccak256("ESCROW-PROP-01");

        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: escrowPropId,
            valuationUSD: 100_000 * 1e18,
            pricePerFraction: 10 * 1e18,
            annualYieldBps: 850,
            timestamp: block.timestamp,
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.startPrank(admin);
        registry.registerPropertyWithAppraisal(
            escrowPropId,
            "Jogja Heritage Hotel",
            "Yogyakarta",
            "HGB-99234-DIY",
            "ipfs://QmJogjaHeritageHotel",
            10_000 * 1e18,
            appraisal,
            sig
        );

        // Vault with $5,000 minFundingGoalUSD and 14 days deadline
        KavlingPropertyVault escrowVault = new KavlingPropertyVault(
            "Jogja Heritage Fractions",
            "KVL-JOGJA",
            escrowPropId,
            address(registry),
            address(usdt),
            10_000 * 1e18,
            5_000 * 1e18,
            14
        );
        registry.linkVault(escrowPropId, address(escrowVault));
        vm.stopPrank();

        assertTrue(escrowVault.state() == KavlingPropertyVault.VaultState.Funding);

        // Investor1 buys 600 fractions ($6,000) -> Exceeds $5,000 goal
        vm.startPrank(investor1);
        usdt.approve(address(escrowVault), type(uint256).max);
        escrowVault.buyWithUSDT(600 * 1e18);
        vm.stopPrank();

        // Funds are held in escrow vault
        assertEq(usdt.balanceOf(address(escrowVault)), 6_000 * 1e18);

        // Finalize funding
        uint256 adminUsdtBefore = usdt.balanceOf(admin);
        escrowVault.finalizeFunding();

        // Escrow funds swept to admin (property issuer) and state is Active
        assertTrue(escrowVault.state() == KavlingPropertyVault.VaultState.Active);
        assertEq(usdt.balanceOf(admin) - adminUsdtBefore, 6_000 * 1e18);
        assertEq(usdt.balanceOf(address(escrowVault)), 0);
    }

    function test_SoftCapEscrow_ExpiredDeadline_EnablesRefunds() public {
        bytes32 escrowPropId = keccak256("ESCROW-PROP-FAIL");

        KavlingRegistry.Appraisal memory appraisal = KavlingRegistry.Appraisal({
            propertyId: escrowPropId,
            valuationUSD: 100_000 * 1e18,
            pricePerFraction: 10 * 1e18,
            annualYieldBps: 850,
            timestamp: block.timestamp,
            nonce: 1,
            deadline: block.timestamp + 1 hours
        });

        bytes memory sig = _signAppraisal(appraisal, appraiserPrivateKey);

        vm.startPrank(admin);
        registry.registerPropertyWithAppraisal(
            escrowPropId,
            "Bandung Creative Hub",
            "Bandung",
            "SHM-88312-BDG",
            "ipfs://QmBandungHub",
            10_000 * 1e18,
            appraisal,
            sig
        );

        // Vault with $50,000 minFundingGoalUSD and 7 days deadline
        KavlingPropertyVault escrowVault = new KavlingPropertyVault(
            "Bandung Hub Fractions",
            "KVL-BDG",
            escrowPropId,
            address(registry),
            address(usdt),
            10_000 * 1e18,
            50_000 * 1e18,
            7
        );
        registry.linkVault(escrowPropId, address(escrowVault));
        vm.stopPrank();

        // Investor1 buys 100 fractions ($1,000)
        vm.startPrank(investor1);
        usdt.approve(address(escrowVault), type(uint256).max);
        escrowVault.buyWithUSDT(100 * 1e18);
        vm.stopPrank();

        // Investor2 buys 5 fractions with BNB ($50)
        vm.prank(investor2);
        escrowVault.buyWithBNB{value: 1 ether}(5 * 1e18);

        // Advance time past 7-day deadline
        vm.warp(block.timestamp + 8 days);

        // Enable refunds
        escrowVault.enableRefunds();
        assertTrue(escrowVault.state() == KavlingPropertyVault.VaultState.Refundable);

        // Investor 1 reclaims USDT refund
        uint256 inv1USDTBefore = usdt.balanceOf(investor1);
        vm.prank(investor1);
        escrowVault.claimRefund();
        assertEq(usdt.balanceOf(investor1) - inv1USDTBefore, 1_000 * 1e18);
        assertEq(escrowVault.balanceOf(investor1), 0);

        // Investor 2 reclaims BNB refund
        uint256 inv2BNBBefore = investor2.balance;
        vm.prank(investor2);
        escrowVault.claimRefund();
        assertGt(investor2.balance, inv2BNBBefore);
        assertEq(escrowVault.balanceOf(investor2), 0);
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

    function test_DualCurrencyYield_DepositAndClaimBNB() public {
        _setupPropertyAndVault();

        // Investor 1 buys 100 fractions
        vm.startPrank(investor1);
        usdt.approve(address(vault), type(uint256).max);
        vault.buyWithUSDT(100 * 1e18);
        vm.stopPrank();

        // Operator streams 5 BNB rental yield
        vm.prank(admin);
        vault.depositRentalYieldBNB{value: 5 ether}();

        assertEq(vault.calculateClaimableYieldBNB(investor1), 5 ether);

        uint256 balanceBefore = investor1.balance;
        vm.prank(investor1);
        vault.claimRentalYieldBNB();

        assertEq(investor1.balance - balanceBefore, 5 ether);
        assertEq(vault.calculateClaimableYieldBNB(investor1), 0);
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
