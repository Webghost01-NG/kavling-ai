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
 * @notice Fractional RWA Token Vault representing ownership of a specific property parcel.
 * @dev Enforces AI-appraised pricing, micro-fractional purchases ($5 min), and pro-rata rental yield distribution.
 */
contract KavlingPropertyVault is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public immutable propertyId;
    KavlingRegistry public immutable registry;
    IERC20 public immutable paymentToken; // e.g. USDT on BNB Chain

    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_PURCHASE_FRACTION = 1e16; // 0.01 fractional token (~$5)
    
    uint256 public immutable maxFractions;
    uint256 public totalFractionsMinted;

    // Rental Yield Distribution Accounting
    uint256 public accYieldPerShare; // Cumulative rental yield per fraction (scaled by 1e18)
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingYield;

    event FractionsPurchased(address indexed buyer, uint256 fractionAmount, uint256 costPaymentToken);
    event RentalYieldDeposited(uint256 amount, uint256 newAccYieldPerShare);
    event RentalYieldClaimed(address indexed investor, uint256 claimedAmount);

    error MaxSupplyExceeded();
    error BelowMinPurchase();
    error VaultNotActive();
    error InsufficientPayment();

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
        propertyId = _propertyId;
        registry = KavlingRegistry(_registry);
        paymentToken = IERC20(_paymentToken);
        maxFractions = _maxFractions;
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
        if (fractionAmount < MIN_PURCHASE_FRACTION) revert BelowMinPurchase();
        if (totalFractionsMinted + fractionAmount > maxFractions) revert MaxSupplyExceeded();

        KavlingRegistry.Property memory prop = registry.getProperty(propertyId);
        if (!prop.isActive) revert VaultNotActive();

        // Calculate cost: fractionAmount * pricePerFraction / 1e18
        uint256 cost = (fractionAmount * prop.pricePerFraction) / PRECISION;
        if (cost == 0) revert InsufficientPayment();

        // Settle pending yield rewards before updating balance
        _updateReward(msg.sender);

        totalFractionsMinted += fractionAmount;
        _mint(msg.sender, fractionAmount);

        paymentToken.safeTransferFrom(msg.sender, owner(), cost);

        emit FractionsPurchased(msg.sender, fractionAmount, cost);
    }

    /**
     * @notice Deposit rental yield earned from physical tenants (in USDT).
     */
    function depositRentalYield(uint256 yieldAmount) external nonReentrant whenNotPaused {
        require(yieldAmount > 0, "Yield must be > 0");
        require(totalSupply() > 0, "No active fractions");

        paymentToken.safeTransferFrom(msg.sender, address(this), yieldAmount);

        accYieldPerShare += (yieldAmount * PRECISION) / totalSupply();

        emit RentalYieldDeposited(yieldAmount, accYieldPerShare);
    }

    /**
     * @notice Calculate claimable rental yield for an investor.
     */
    function calculateClaimableYield(address investor) public view returns (uint256) {
        uint256 balance = balanceOf(investor);
        if (balance == 0) return pendingYield[investor];

        uint256 accumulated = (balance * accYieldPerShare) / PRECISION;
        return (accumulated - rewardDebt[investor]) + pendingYield[investor];
    }

    /**
     * @notice Claim accumulated rental earnings.
     */
    function claimRentalYield() external nonReentrant whenNotPaused {
        _updateReward(msg.sender);
        uint256 claimable = pendingYield[msg.sender];
        require(claimable > 0, "No yield available");

        pendingYield[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, claimable);

        emit RentalYieldClaimed(msg.sender, claimable);
    }

    function _updateReward(address account) internal {
        if (account != address(0)) {
            pendingYield[account] = calculateClaimableYield(account);
            rewardDebt[account] = (balanceOf(account) * accYieldPerShare) / PRECISION;
        }
    }

    // Hook to maintain accurate yield debt on transfers
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0)) _updateReward(from);
        if (to != address(0)) _updateReward(to);
        super._update(from, to, value);
    }
}
