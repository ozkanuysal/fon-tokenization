// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IInvestorRegistry} from "./interfaces/IInvestorRegistry.sol";

/// @notice Allowlist of investors that can hold fund shares.
contract InvestorRegistry is IInvestorRegistry, AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    EnumerableSet.AddressSet private _investors;

    event InvestorApproved(address indexed investor);
    event InvestorRemoved(address indexed investor);

    error ZeroAddress();
    error AlreadyApproved(address investor);
    error NotRegistered(address investor);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function approve(address investor) external onlyRole(MANAGER_ROLE) {
        if (investor == address(0)) revert ZeroAddress();
        if (!_investors.add(investor)) revert AlreadyApproved(investor);
        emit InvestorApproved(investor);
    }

    function remove(address investor) external onlyRole(MANAGER_ROLE) {
        if (!_investors.remove(investor)) revert NotRegistered(investor);
        emit InvestorRemoved(investor);
    }

    function isApproved(address account) external view returns (bool) {
        return _investors.contains(account);
    }

    /// @notice Full list for the admin screen. Fine for a demo-sized list, not for thousands.
    function investors() external view returns (address[] memory) {
        return _investors.values();
    }
}
