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
 * @dev Supports dual payment rails (USDT & native tBNB), zero-underflow rental yield accounting, and compliance gates.
 */
contract KavlingPropertyVault is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public immutable propertyId;
    KavlingRegistry public immutable registry;
    IERC20 public immutable paymentToken; // e.g. USDT on BNB Chain (18 decimals on BSC)

    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_PURCHASE_FRACTION = 1e16; // 0.01 fractional token (~$0.50 - $5)
    
    uint256 public immutable maxFractions;
    uint256 public totalFractionsMinted;

    // Configurable BNB Price in USD (18 decimals, default $600 = 600e18)
    uint256 public bnbPriceUSD = 600 * 1e18;

    // Rental Yield Distribution Accounting
    uint256 public accYieldPerShare; // Cumulative rental yield per fraction (scaled by 1e18)
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingYield;

    event FractionsPurchased(address indexed buyer, uint256 fractionAmount, uint256 costPaymentToken, bool isNativeBNB);
    event RentalYieldDeposited(address indexed operator, uint256 yieldAmount, uint256 newAccYieldPerShare);
    event RentalYieldClaimed(address indexed investor, uint256 claimedAmount);
    event BnbPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FundsWithdrawn(address indexed to, uint256 amount);

    error MaxSupplyExceeded();
    error BelowMinPurchase();
    error VaultNotActive();
    error InsufficientPayment();
    error ZeroAddress();
    error InvestorNotVerified();
    error RefundFailed();

    constructor(
        string memory name,
        string memory symbol,
        bytes32 _propertyId,
        address _registry,
        address _paymentToken,
        uint256 _maxFractions
    ) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {
        if (_registry == address(0) || _paymentToken == address(0)) revert ZeroAddress();
        propertyId = _propertyId;
        registry = KavlingRegistry(_registry);
        paymentToken = IERC20(_paymentToken);
        maxFractions = _maxFractions;
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

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        if (!prop.isActive) revert VaultNotActive();

        uint256 costUSDT = (fractionAmount * prop.pricePerFraction) / PRECISION;
        if (costUSDT == 0) revert InsufficientPayment();

        totalFractionsMinted += fractionAmount;
        _mint(msg.sender, fractionAmount);

        paymentToken.safeTransferFrom(msg.sender, owner(), costUSDT);

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

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        if (!prop.isActive) revert VaultNotActive();

        uint256 costUSD = (fractionAmount * prop.pricePerFraction) / PRECISION;
        if (costUSD == 0) revert InsufficientPayment();

        // Calculate required BNB: (costUSD * 1e18) / bnbPriceUSD
        uint256 costBNB = (costUSD * PRECISION) / bnbPriceUSD;
        if (msg.value < costBNB) revert InsufficientPayment();

        totalFractionsMinted += fractionAmount;
        _mint(msg.sender, fractionAmount);

        // Forward BNB to owner
        (bool sentOwner, ) = payable(owner()).call{value: costBNB}("");
        require(sentOwner, "BNB transfer to owner failed");

        // Refund excess BNB to buyer
        uint256 refund = msg.value - costBNB;
        if (refund > 0) {
            (bool sentRefund, ) = payable(msg.sender).call{value: refund}("");
            if (!sentRefund) revert RefundFailed();
        }

        emit FractionsPurchased(msg.sender, fractionAmount, costBNB, true);
    }

    /**
     * @notice Deposit rental yield earned from physical tenants (in USDT).
     */
    function depositRentalYield(uint256 yieldAmount) external nonReentrant whenNotPaused {
        require(yieldAmount > 0, "Yield must be > 0");
        require(totalSupply() > 0, "No active fractions");

        paymentToken.safeTransferFrom(msg.sender, address(this), yieldAmount);

        accYieldPerShare += (yieldAmount * PRECISION) / totalSupply();

        emit RentalYieldDeposited(msg.sender, yieldAmount, accYieldPerShare);
    }

    /**
     * @notice Calculate claimable rental yield for an investor without underflow risks.
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
     * @notice Claim accumulated rental earnings to investor wallet.
     */
    function claimRentalYield() external nonReentrant whenNotPaused {
        // Compute total claimable yield
        uint256 claimable = calculateClaimableYield(msg.sender);
        require(claimable > 0, "No yield available");

        // Reset pending and align debt
        pendingYield[msg.sender] = 0;
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accYieldPerShare) / PRECISION;

        paymentToken.safeTransfer(msg.sender, claimable);

        emit RentalYieldClaimed(msg.sender, claimable);
    }

    /**
     * @dev Flawless yield accounting hook on ERC-20 transfers, mints, and burns.
     * Accrues pending yield on current balance before changing state, then resets debt on new balance.
     */
    function _update(address from, address to, uint256 value) internal override {
        // Settle pending yield on old balances before balance modification
        if (from != address(0)) {
            uint256 fromAccumulated = (balanceOf(from) * accYieldPerShare) / PRECISION;
            if (fromAccumulated >= rewardDebt[from]) {
                pendingYield[from] += fromAccumulated - rewardDebt[from];
            }
        }

        if (to != address(0)) {
            uint256 toAccumulated = (balanceOf(to) * accYieldPerShare) / PRECISION;
            if (toAccumulated >= rewardDebt[to]) {
                pendingYield[to] += toAccumulated - rewardDebt[to];
            }
        }

        // Execute state transfer in OpenZeppelin ERC-20
        super._update(from, to, value);

        // Align rewardDebt to match new balances exactly
        if (from != address(0)) {
            rewardDebt[from] = (balanceOf(from) * accYieldPerShare) / PRECISION;
        }
        if (to != address(0)) {
            rewardDebt[to] = (balanceOf(to) * accYieldPerShare) / PRECISION;
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
