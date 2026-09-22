// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IInvestorRegistry} from "./interfaces/IInvestorRegistry.sol";

/// @notice Fund share token. Investors subscribe with the payment asset at the current NAV
/// and redeem shares back for the asset. Only approved investors can hold or move shares.
contract FundToken is ERC20, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IERC20 public immutable asset;
    IInvestorRegistry public immutable registry;

    /// @notice Price of one share (1e18 units) in asset units, e.g. 1_000_000 = 1.00 mUSDC.
    uint256 public nav;
    uint256 public navUpdatedAt;

    event Subscribed(address indexed investor, uint256 assets, uint256 shares, uint256 price);
    event Redeemed(address indexed investor, uint256 shares, uint256 assets, uint256 price);
    event NavUpdated(uint256 oldNav, uint256 newNav);

    error NotApprovedInvestor(address account);
    error ZeroAmount();
    error InvalidNav();
    error InsufficientLiquidity(uint256 available, uint256 required);

    constructor(
        string memory name_,
        string memory symbol_,
        IERC20 asset_,
        IInvestorRegistry registry_,
        uint256 initialNav,
        address admin
    ) ERC20(name_, symbol_) {
        if (initialNav == 0) revert InvalidNav();
        asset = asset_;
        registry = registry_;
        nav = initialNav;
        navUpdatedAt = block.timestamp;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function subscribe(uint256 assets) external nonReentrant returns (uint256 shares) {
        // TODO
    }

    function redeem(uint256 shares) external nonReentrant returns (uint256 assets) {
        // TODO
    }

    function setNav(uint256 newNav) external onlyRole(MANAGER_ROLE) {
        // TODO
    }

    function previewSubscribe(uint256 assets) public view returns (uint256) {
        // TODO
    }

    function previewRedeem(uint256 shares) public view returns (uint256) {
        // TODO
    }

    // Every mint, burn and transfer goes through here.
    function _update(address from, address to, uint256 value) internal override {
        // TODO: both sides must be approved (zero address means mint/burn)
        super._update(from, to, value);
    }
}
