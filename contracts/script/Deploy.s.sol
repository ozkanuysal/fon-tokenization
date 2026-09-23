// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {InvestorRegistry} from "../src/InvestorRegistry.sol";
import {FundToken} from "../src/FundToken.sol";

/// @notice Deploys the fund and prepares the demo wallets. Addresses are written to
/// deployments/<network>.json, which the web app and the backend read.
contract Deploy is Script {
    uint256 constant SEPOLIA = 11155111;
    uint256 constant ANVIL = 31337;

    uint256 constant INITIAL_NAV = 1e6; // 1.00 mUSDC
    uint256 constant DEMO_USDC = 10_000e6;
    uint256 constant DEMO_GAS = 0.02 ether;

    function run() external {
        require(block.chainid == SEPOLIA || block.chainid == ANVIL, "Deploy: testnet only");

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address manager = vm.envAddress("MANAGER_ADDRESS");
        address investorA = vm.envAddress("INVESTOR_A_ADDRESS");
        address investorB = vm.envAddress("INVESTOR_B_ADDRESS");
        uint256 startBlock = block.number;

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC();
        InvestorRegistry registry = new InvestorRegistry(deployer);
        FundToken fund =
            new FundToken("Demo Fund Share", "DFS", usdc, registry, INITIAL_NAV, deployer);

        registry.grantRole(registry.MANAGER_ROLE(), manager);
        fund.grantRole(fund.MANAGER_ROLE(), manager);
        registry.approve(investorA); // investor B stays unapproved to demo the approval flow

        usdc.mint(manager, DEMO_USDC);
        usdc.mint(investorA, DEMO_USDC);
        usdc.mint(investorB, DEMO_USDC);

        if (block.chainid == SEPOLIA) {
            _sendGas(manager);
            _sendGas(investorA);
            _sendGas(investorB);
        }

        vm.stopBroadcast();

        _writeDeployment(address(usdc), address(registry), address(fund), startBlock);
    }

    function _sendGas(address to) internal {
        (bool ok,) = payable(to).call{value: DEMO_GAS}("");
        require(ok, "Deploy: gas transfer failed");
    }

    function _writeDeployment(address usdc, address registry, address fund, uint256 startBlock)
        internal
    {
        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "startBlock", startBlock);
        vm.serializeAddress(key, "usdc", usdc);
        vm.serializeAddress(key, "registry", registry);
        string memory json = vm.serializeAddress(key, "fund", fund);

        string memory network = block.chainid == SEPOLIA ? "sepolia" : "local";
        vm.writeJson(json, string.concat(vm.projectRoot(), "/../deployments/", network, ".json"));
    }
}
