// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title VestToken
 * @dev A simple ERC20 token for demonstrating the Token Vesting System.
 * Mints the entire initial supply to the deployer.
 */
contract VestToken is ERC20 {
    uint8 private _decimals;

    /**
     * @dev Constructor that mints initial supply to the deployer.
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param initialSupply_ The initial supply (in whole tokens, will be multiplied by 10^decimals)
     * @param decimals_ The number of decimals for the token
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply_ * 10 ** decimals_);
    }

    /**
     * @dev Returns the number of decimals used for token amounts.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
