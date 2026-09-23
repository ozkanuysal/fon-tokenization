// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract MockUSDCTest is Test {
    MockUSDC usdc;

    function setUp() public {
        usdc = new MockUSDC();
    }

    function test_HasSixDecimals() public view {
        assertEq(usdc.decimals(), 6);
    }

    function test_AnyoneCanMint() public {
        address alice = makeAddr("alice");

        vm.prank(alice);
        usdc.mint(alice, 100e6);

        assertEq(usdc.balanceOf(alice), 100e6);
    }
}
