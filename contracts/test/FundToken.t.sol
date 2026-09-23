// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {InvestorRegistry} from "../src/InvestorRegistry.sol";
import {FundToken} from "../src/FundToken.sol";

contract FundTokenTest is Test {
    uint256 constant NAV = 1e6; // 1.00 mUSDC per share

    MockUSDC usdc;
    InvestorRegistry registry;
    FundToken fund;

    address admin = makeAddr("admin");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address outsider = makeAddr("outsider");

    function setUp() public {
        usdc = new MockUSDC();
        registry = new InvestorRegistry(admin);
        fund = new FundToken("Demo Fund Share", "DFS", usdc, registry, NAV, admin);

        vm.startPrank(admin);
        registry.approve(alice);
        registry.approve(bob);
        vm.stopPrank();

        usdc.mint(alice, 1_000e6);
        usdc.mint(outsider, 1_000e6);
    }

    function test_InitialState() public view {
        assertEq(fund.nav(), NAV);
        assertEq(address(fund.asset()), address(usdc));
        assertEq(address(fund.registry()), address(registry));
        assertTrue(fund.hasRole(fund.MANAGER_ROLE(), admin));
    }

    function test_RevertWhen_InitialNavIsZero() public {
        vm.expectRevert(FundToken.InvalidNav.selector);
        new FundToken("Demo Fund Share", "DFS", usdc, registry, 0, admin);
    }

    // subscribe

    function test_SubscribeMintsSharesAtNav() public {
        uint256 shares = _subscribe(alice, 100e6);

        assertEq(shares, 100e18);
        assertEq(fund.balanceOf(alice), 100e18);
        assertEq(usdc.balanceOf(address(fund)), 100e6);
        assertEq(usdc.balanceOf(alice), 900e6);
    }

    function test_SubscribeUsesCurrentNav() public {
        _setNav(1.25e6);
        assertEq(_subscribe(alice, 100e6), 80e18);
    }

    function test_SubscribeEmitsEvent() public {
        vm.prank(alice);
        usdc.approve(address(fund), 100e6);

        vm.expectEmit(address(fund));
        emit FundToken.Subscribed(alice, 100e6, 100e18, NAV);

        vm.prank(alice);
        fund.subscribe(100e6);
    }

    function test_RevertWhen_SubscribingZero() public {
        vm.expectRevert(FundToken.ZeroAmount.selector);
        vm.prank(alice);
        fund.subscribe(0);
    }

    // redeem

    function test_RedeemPaysAtNav() public {
        _subscribe(alice, 100e6);

        vm.prank(alice);
        uint256 assets = fund.redeem(40e18);

        assertEq(assets, 40e6);
        assertEq(fund.balanceOf(alice), 60e18);
        assertEq(usdc.balanceOf(alice), 940e6);
    }

    function test_RedeemUsesUpdatedNav() public {
        _subscribe(alice, 100e6);
        usdc.mint(address(fund), 10e6); // gains that back the new NAV
        _setNav(1.1e6);

        vm.prank(alice);
        assertEq(fund.redeem(100e18), 110e6);
    }

    function test_RedeemEmitsEvent() public {
        _subscribe(alice, 100e6);

        vm.expectEmit(address(fund));
        emit FundToken.Redeemed(alice, 40e18, 40e6, NAV);

        vm.prank(alice);
        fund.redeem(40e18);
    }

    function test_RevertWhen_RedeemingZero() public {
        vm.expectRevert(FundToken.ZeroAmount.selector);
        vm.prank(alice);
        fund.redeem(0);
    }

    function test_RevertWhen_RedeemingMoreThanBalance() public {
        _subscribe(alice, 100e6);

        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientBalance.selector, alice, 100e18, 101e18
            )
        );
        vm.prank(alice);
        fund.redeem(101e18);
    }

    function test_RevertWhen_FundLacksLiquidity() public {
        _subscribe(alice, 100e6);
        _setNav(2e6);

        vm.expectRevert(
            abi.encodeWithSelector(FundToken.InsufficientLiquidity.selector, 100e6, 200e6)
        );
        vm.prank(alice);
        fund.redeem(100e18);
    }

    function test_RoundsDownInFavorOfFund() public {
        _setNav(3e6);

        uint256 shares = _subscribe(alice, 1e6);
        assertEq(shares, 333_333_333_333_333_333);
        assertEq(fund.previewRedeem(shares), 999_999);
    }

    // nav

    function test_ManagerCanUpdateNav() public {
        vm.warp(1 days);

        vm.expectEmit(address(fund));
        emit FundToken.NavUpdated(NAV, 1.1e6);
        _setNav(1.1e6);

        assertEq(fund.nav(), 1.1e6);
        assertEq(fund.navUpdatedAt(), 1 days);
    }

    function test_RevertWhen_NonManagerUpdatesNav() public {
        bytes32 role = fund.MANAGER_ROLE();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role
            )
        );
        vm.prank(alice);
        fund.setNav(2e6);
    }

    function test_RevertWhen_NavIsZero() public {
        vm.expectRevert(FundToken.InvalidNav.selector);
        _setNav(0);
    }

    // helpers

    function _subscribe(address investor, uint256 assets) internal returns (uint256 shares) {
        vm.startPrank(investor);
        usdc.approve(address(fund), assets);
        shares = fund.subscribe(assets);
        vm.stopPrank();
    }

    function _setNav(uint256 newNav) internal {
        vm.prank(admin);
        fund.setNav(newNav);
    }
}
