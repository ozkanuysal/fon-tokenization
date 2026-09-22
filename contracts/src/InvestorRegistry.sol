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
        // TODO
    }

    function remove(address investor) external onlyRole(MANAGER_ROLE) {
        // TODO
    }

    function isApproved(address account) external view returns (bool) {
        // TODO
    }

    function investors() external view returns (address[] memory) {
        // TODO
    }
}
