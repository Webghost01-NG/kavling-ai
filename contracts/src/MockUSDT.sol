// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token (18 decimals for testnet parity) with faucet capability for Kavling AI testing.
 */
contract MockUSDT is ERC20, Ownable {
    constructor() ERC20("Mock Tether USD", "USDT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
