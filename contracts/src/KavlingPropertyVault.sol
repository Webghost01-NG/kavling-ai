// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./KavlingRegistry.sol";

/**
 * @title KavlingPropertyVault
 * @notice Fractional RWA Token Vault representing ownership of a specific property parcel on BNB Chain.
 * @dev Supports capital escrow with soft-cap refunds, dual payment rails (USDT & native tBNB),
 *      dual-currency rental yield distribution (USDT & BNB) with zero-underflow accrual, and compliance gating.
 */
contract KavlingPropertyVault is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    enum VaultState {
        Funding,
        Active,
        Refundable
    }

    bytes32 public immutable propertyId;
    KavlingRegistry public immutable registry;
    IERC20 public immutable paymentToken; // e.g. USDT on BNB Chain (18 decimals on BSC)

    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_PURCHASE_FRACTION = 1e16; // 0.01 fractional token (~$0.50 - $5)

    uint256 public immutable maxFractions;
    uint256 public immutable minFundingGoalUSD;
    uint256 public immutable fundingDeadline;

    VaultState public state;
    uint256 public totalFractionsMinted;
    uint256 public totalUSDCollected;

    // Investor Escrow Accounting (for soft-cap refund protection)
    mapping(address => uint256) public usdtDeposited;
    mapping(address => uint256) public bnbDeposited;

    // Configurable BNB Price in USD (18 decimals, default $600 = 600e18)
    uint256 public bnbPriceUSD = 600 * 1e18;

    // Dual-Rail Rental Yield Distribution Accounting (USDT)
    uint256 public accYieldPerShare; // Cumulative USDT rental yield per fraction (scaled by 1e18)
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingYield;

    // Dual-Rail Rental Yield Distribution Accounting (Native BNB)
    uint256 public accYieldPerShareBNB; // Cumulative BNB rental yield per fraction (scaled by 1e18)
    mapping(address => uint256) public rewardDebtBNB;
    mapping(address => uint256) public pendingYieldBNB;

    event FractionsPurchased(address indexed buyer, uint256 fractionAmount, uint256 costPaymentToken, bool isNativeBNB);
    event FundingFinalized(uint256 totalUSDCollected, uint256 totalFractionsMinted);
    event RefundsEnabled();
    event RefundClaimed(address indexed investor, uint256 usdtRefund, uint256 bnbRefund, uint256 fractionsBurned);
    event RentalYieldDeposited(address indexed operator, uint256 yieldAmount, uint256 newAccYieldPerShare);
    event RentalYieldDepositedBNB(address indexed operator, uint256 yieldAmountBNB, uint256 newAccYieldPerShareBNB);
    event RentalYieldClaimed(address indexed investor, uint256 claimedAmount);
    event RentalYieldClaimedBNB(address indexed investor, uint256 claimedBNB);
    event BnbPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event VaultStateChanged(VaultState previousState, VaultState newState);

    error MaxSupplyExceeded();
    error BelowMinPurchase();
    error VaultNotActive();
    error VaultNotFunding();
    error VaultNotRefundable();
    error FundingGoalNotMet();
    error FundingPeriodStillActive();
    error InsufficientPayment();
    error ZeroAddress();
    error InvestorNotVerified();
    error RefundFailed();
    error NoDepositToRefund();
    error TransfersDisabledDuringFunding();

    constructor(
        string memory name,
        string memory symbol,
        bytes32 _propertyId,
        address _registry,
        address _paymentToken,
        uint256 _maxFractions,
        uint256 _minFundingGoalUSD,
        uint256 _fundingDurationDays
    ) ERC20(name, symbol) Ownable(msg.sender) {
        if (_registry == address(0) || _paymentToken == address(0)) revert ZeroAddress();
        propertyId = _propertyId;
        registry = KavlingRegistry(_registry);
        paymentToken = IERC20(_paymentToken);
        maxFractions = _maxFractions;
        minFundingGoalUSD = _minFundingGoalUSD;

        if (_minFundingGoalUSD > 0) {
            state = VaultState.Funding;
            fundingDeadline = block.timestamp + (_fundingDurationDays * 1 days);
        } else {
            state = VaultState.Active;
            fundingDeadline = block.timestamp;
        }
    }

    receive() external payable {}

    function setBnbPriceUSD(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be > 0");
        emit BnbPriceUpdated(bnbPriceUSD, _newPrice);
        bnbPriceUSD = _newPrice;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Purchase fractional shares using USDT on BNB Chain.
     * @param fractionAmount Amount of fractions to buy (18 decimals).
     */
    function buyWithUSDT(uint256 fractionAmount) external nonReentrant whenNotPaused {
        if (!registry.verifyInvestor(msg.sender)) revert InvestorNotVerified();
        if (fractionAmount < MIN_PURCHASE_FRACTION) revert BelowMinPurchase();
        if (totalFractionsMinted + fractionAmount > maxFractions) revert MaxSupplyExceeded();
        if (state == VaultState.Refundable) revert VaultNotActive();

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        if (!prop.isActive) revert VaultNotActive();

        uint256 costUSDT = (fractionAmount * prop.pricePerFraction) / PRECISION;
        if (costUSDT == 0) revert InsufficientPayment();

        totalFractionsMinted += fractionAmount;
        totalUSDCollected += costUSDT;
        _mint(msg.sender, fractionAmount);

        if (state == VaultState.Funding) {
            // Held in contract escrow until soft-cap is reached
            usdtDeposited[msg.sender] += costUSDT;
            paymentToken.safeTransferFrom(msg.sender, address(this), costUSDT);
        } else {
            // Vault already Active: directly route proceeds to property issuer
            paymentToken.safeTransferFrom(msg.sender, owner(), costUSDT);
        }

        emit FractionsPurchased(msg.sender, fractionAmount, costUSDT, false);
    }

    /**
     * @notice Purchase fractional shares using native BNB (tBNB on testnet).
     * @param fractionAmount Amount of fractions to buy (18 decimals).
     */
    function buyWithBNB(uint256 fractionAmount) external payable nonReentrant whenNotPaused {
        if (!registry.verifyInvestor(msg.sender)) revert InvestorNotVerified();
        if (fractionAmount < MIN_PURCHASE_FRACTION) revert BelowMinPurchase();
        if (totalFractionsMinted + fractionAmount > maxFractions) revert MaxSupplyExceeded();
        if (state == VaultState.Refundable) revert VaultNotActive();

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        if (!prop.isActive) revert VaultNotActive();

        uint256 costUSD = (fractionAmount * prop.pricePerFraction) / PRECISION;
        if (costUSD == 0) revert InsufficientPayment();

        // Required BNB: (costUSD * 1e18) / bnbPriceUSD
        uint256 costBNB = (costUSD * PRECISION) / bnbPriceUSD;
        if (msg.value < costBNB) revert InsufficientPayment();

        totalFractionsMinted += fractionAmount;
        totalUSDCollected += costUSD;
        _mint(msg.sender, fractionAmount);

        if (state == VaultState.Funding) {
            // Retain in contract escrow for investor protection
            bnbDeposited[msg.sender] += costBNB;
        } else {
            // Vault already Active: transfer to property issuer
            (bool sentOwner,) = payable(owner()).call{value: costBNB}("");
            require(sentOwner, "BNB transfer to owner failed");
        }

        // Refund any excess payment back to the buyer immediately
        uint256 excess = msg.value - costBNB;
        if (excess > 0) {
            (bool sentRefund,) = payable(msg.sender).call{value: excess}("");
            if (!sentRefund) revert RefundFailed();
        }

        emit FractionsPurchased(msg.sender, fractionAmount, costBNB, true);
    }

    /**
     * @notice Finalizes funding round once soft-cap goal is met, releasing escrow to property issuer.
     */
    function finalizeFunding() external nonReentrant {
        if (state != VaultState.Funding) revert VaultNotFunding();
        if (totalUSDCollected < minFundingGoalUSD) revert FundingGoalNotMet();

        state = VaultState.Active;
        emit VaultStateChanged(VaultState.Funding, VaultState.Active);
        emit FundingFinalized(totalUSDCollected, totalFractionsMinted);

        // Sweep collected escrow to issuer
        uint256 usdtBal = paymentToken.balanceOf(address(this));
        if (usdtBal > 0) {
            paymentToken.safeTransfer(owner(), usdtBal);
        }

        uint256 bnbBal = address(this).balance;
        if (bnbBal > 0) {
            (bool sent,) = payable(owner()).call{value: bnbBal}("");
            require(sent, "BNB release failed");
        }
    }

    /**
     * @notice Enables refunds if funding deadline has expired without reaching soft-cap target.
     */
    function enableRefunds() external nonReentrant {
        if (state != VaultState.Funding) revert VaultNotFunding();
        if (block.timestamp <= fundingDeadline) revert FundingPeriodStillActive();
        if (totalUSDCollected >= minFundingGoalUSD) revert FundingGoalNotMet();

        state = VaultState.Refundable;
        emit VaultStateChanged(VaultState.Funding, VaultState.Refundable);
        emit RefundsEnabled();
    }

    /**
     * @notice Investors reclaim their USDT & BNB if the funding round fails to reach soft-cap.
     */
    function claimRefund() external nonReentrant {
        if (state != VaultState.Refundable) revert VaultNotRefundable();

        uint256 usdtRefund = usdtDeposited[msg.sender];
        uint256 bnbRefund = bnbDeposited[msg.sender];
        if (usdtRefund == 0 && bnbRefund == 0) revert NoDepositToRefund();

        usdtDeposited[msg.sender] = 0;
        bnbDeposited[msg.sender] = 0;

        uint256 investorFractions = balanceOf(msg.sender);
        if (investorFractions > 0) {
            _burn(msg.sender, investorFractions);
        }

        if (usdtRefund > 0) {
            paymentToken.safeTransfer(msg.sender, usdtRefund);
        }

        if (bnbRefund > 0) {
            (bool sent,) = payable(msg.sender).call{value: bnbRefund}("");
            if (!sent) revert RefundFailed();
        }

        emit RefundClaimed(msg.sender, usdtRefund, bnbRefund, investorFractions);
    }

    /**
     * @notice Deposit rental yield earned from physical tenants (in USDT).
     */
    function depositRentalYield(uint256 yieldAmount) external nonReentrant whenNotPaused {
        require(state == VaultState.Active, "Vault must be Active to stream yield");
        require(yieldAmount > 0, "Yield must be > 0");
        require(totalSupply() > 0, "No active fractions");

        paymentToken.safeTransferFrom(msg.sender, address(this), yieldAmount);

        accYieldPerShare += (yieldAmount * PRECISION) / totalSupply();

        emit RentalYieldDeposited(msg.sender, yieldAmount, accYieldPerShare);
    }

    /**
     * @notice Deposit rental yield directly in native BNB.
     */
    function depositRentalYieldBNB() external payable nonReentrant whenNotPaused {
        require(state == VaultState.Active, "Vault must be Active to stream yield");
        require(msg.value > 0, "Yield must be > 0");
        require(totalSupply() > 0, "No active fractions");

        accYieldPerShareBNB += (msg.value * PRECISION) / totalSupply();

        emit RentalYieldDepositedBNB(msg.sender, msg.value, accYieldPerShareBNB);
    }

    /**
     * @notice Calculate claimable USDT rental yield for an investor without underflow risks.
     */
    function calculateClaimableYield(address investor) public view returns (uint256) {
        uint256 balance = balanceOf(investor);
        uint256 accumulated = (balance * accYieldPerShare) / PRECISION;

        uint256 currentPeriodYield = 0;
        if (accumulated >= rewardDebt[investor]) {
            currentPeriodYield = accumulated - rewardDebt[investor];
        }

        return currentPeriodYield + pendingYield[investor];
    }

    /**
     * @notice Calculate claimable BNB rental yield for an investor without underflow risks.
     */
    function calculateClaimableYieldBNB(address investor) public view returns (uint256) {
        uint256 balance = balanceOf(investor);
        uint256 accumulated = (balance * accYieldPerShareBNB) / PRECISION;

        uint256 currentPeriodYield = 0;
        if (accumulated >= rewardDebtBNB[investor]) {
            currentPeriodYield = accumulated - rewardDebtBNB[investor];
        }

        return currentPeriodYield + pendingYieldBNB[investor];
    }

    /**
     * @notice Claim accumulated USDT rental earnings to investor wallet.
     */
    function claimRentalYield() external nonReentrant whenNotPaused {
        uint256 claimable = calculateClaimableYield(msg.sender);
        require(claimable > 0, "No USDT yield available");

        pendingYield[msg.sender] = 0;
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accYieldPerShare) / PRECISION;

        paymentToken.safeTransfer(msg.sender, claimable);

        emit RentalYieldClaimed(msg.sender, claimable);
    }

    /**
     * @notice Claim accumulated native BNB rental earnings to investor wallet.
     */
    function claimRentalYieldBNB() external nonReentrant whenNotPaused {
        uint256 claimable = calculateClaimableYieldBNB(msg.sender);
        require(claimable > 0, "No BNB yield available");

        pendingYieldBNB[msg.sender] = 0;
        rewardDebtBNB[msg.sender] = (balanceOf(msg.sender) * accYieldPerShareBNB) / PRECISION;

        (bool sent,) = payable(msg.sender).call{value: claimable}("");
        require(sent, "BNB yield transfer failed");

        emit RentalYieldClaimedBNB(msg.sender, claimable);
    }

    /**
     * @dev Zero-underflow dual yield accounting hook on ERC-20 transfers, mints, and burns.
     * Settles pending yield on both USDT and BNB before state mutation, then updates debt.
     */
    function _update(address from, address to, uint256 value) internal override {
        // Fractions remain non-transferable until the funding outcome is known.
        // Without this gate, a buyer could transfer tokens away and still claim
        // the original deposit, leaving the recipient with unrefundable tokens.
        if (from != address(0) && to != address(0) && state != VaultState.Active) {
            revert TransfersDisabledDuringFunding();
        }

        // Settle pending yield on USDT
        if (from != address(0)) {
            uint256 fromAccumulated = (balanceOf(from) * accYieldPerShare) / PRECISION;
            if (fromAccumulated >= rewardDebt[from]) {
                pendingYield[from] += fromAccumulated - rewardDebt[from];
            }
            uint256 fromAccBNB = (balanceOf(from) * accYieldPerShareBNB) / PRECISION;
            if (fromAccBNB >= rewardDebtBNB[from]) {
                pendingYieldBNB[from] += fromAccBNB - rewardDebtBNB[from];
            }
        }

        if (to != address(0)) {
            uint256 toAccumulated = (balanceOf(to) * accYieldPerShare) / PRECISION;
            if (toAccumulated >= rewardDebt[to]) {
                pendingYield[to] += toAccumulated - rewardDebt[to];
            }
            uint256 toAccBNB = (balanceOf(to) * accYieldPerShareBNB) / PRECISION;
            if (toAccBNB >= rewardDebtBNB[to]) {
                pendingYieldBNB[to] += toAccBNB - rewardDebtBNB[to];
            }
        }

        // Execute ERC-20 state change
        super._update(from, to, value);

        // Align rewardDebt to match new balances exactly
        if (from != address(0)) {
            rewardDebt[from] = (balanceOf(from) * accYieldPerShare) / PRECISION;
            rewardDebtBNB[from] = (balanceOf(from) * accYieldPerShareBNB) / PRECISION;
        }
        if (to != address(0)) {
            rewardDebt[to] = (balanceOf(to) * accYieldPerShare) / PRECISION;
            rewardDebtBNB[to] = (balanceOf(to) * accYieldPerShareBNB) / PRECISION;
        }
    }

    /**
     * @notice Emergency escape hatch for stuck non-payment tokens.
     */
    function emergencyTokenWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(paymentToken), "Cannot drain payment token");
        IERC20(token).safeTransfer(to, amount);
    }
}
