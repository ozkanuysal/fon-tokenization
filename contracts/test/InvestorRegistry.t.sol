// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {InvestorRegistry} from "../src/InvestorRegistry.sol";

contract InvestorRegistryTest is Test {
    InvestorRegistry registry;

    address admin = makeAddr("admin");
    address manager = makeAddr("manager");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        registry = new InvestorRegistry(admin);

        bytes32 role = registry.MANAGER_ROLE();
        vm.prank(admin);
        registry.grantRole(role, manager);
    }

    function test_ManagerCanApprove() public {
        vm.expectEmit(address(registry));
        emit InvestorRegistry.InvestorApproved(alice);

        vm.prank(manager);
        registry.approve(alice);

        assertTrue(registry.isApproved(alice));
    }

    function test_ManagerCanRemove() public {
        vm.startPrank(manager);
        registry.approve(alice);

        vm.expectEmit(address(registry));
        emit InvestorRegistry.InvestorRemoved(alice);
        registry.remove(alice);
        vm.stopPrank();

        assertFalse(registry.isApproved(alice));
    }

    function test_InvestorsReturnsApprovedAddresses() public {
        vm.startPrank(manager);
        registry.approve(alice);
        registry.approve(bob);
        registry.remove(alice);
        vm.stopPrank();

        address[] memory list = registry.investors();
        assertEq(list.length, 1);
        assertEq(list[0], bob);
    }

    function test_RevertWhen_CallerIsNotManager() public {
        bytes32 role = registry.MANAGER_ROLE();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role
            )
        );
        vm.prank(alice);
        registry.approve(alice);

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role
            )
        );
        vm.prank(alice);
        registry.remove(bob);
    }

    function test_RevertWhen_ApprovingZeroAddress() public {
        vm.expectRevert(InvestorRegistry.ZeroAddress.selector);
        vm.prank(manager);
        registry.approve(address(0));
    }

    function test_RevertWhen_AlreadyApproved() public {
        vm.startPrank(manager);
        registry.approve(alice);

        vm.expectRevert(abi.encodeWithSelector(InvestorRegistry.AlreadyApproved.selector, alice));
        registry.approve(alice);
        vm.stopPrank();
    }

    function test_RevertWhen_RemovingUnknownInvestor() public {
        vm.expectRevert(abi.encodeWithSelector(InvestorRegistry.NotRegistered.selector, alice));
        vm.prank(manager);
        registry.remove(alice);
    }
}
