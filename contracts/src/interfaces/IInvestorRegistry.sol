// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInvestorRegistry {
    function isApproved(address account) external view returns (bool);
}
