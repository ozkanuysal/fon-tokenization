// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {InvestorRegistry} from "../src/InvestorRegistry.sol";
import {FundToken} from "../src/FundToken.sol";

contract FundTokenTest is Test {
    MockUSDC usdc;
    InvestorRegistry registry;
    FundToken fund;

    address admin = makeAddr("admin");

    function setUp() public {
        usdc = new MockUSDC();
        registry = new InvestorRegistry(admin);
        fund = new FundToken("Demo Fund Share", "DFS", usdc, registry, 1e6, admin);
    }

    function test_InitialState() public view {
        assertEq(fund.nav(), 1e6);
        assertEq(address(fund.asset()), address(usdc));
        assertEq(address(fund.registry()), address(registry));
        assertTrue(fund.hasRole(fund.MANAGER_ROLE(), admin));
    }
}
