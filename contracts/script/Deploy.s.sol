// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

contract Deploy is Script {
    function run() external {
        // TODO: only allow sepolia and local anvil
        // TODO: deploy MockUSDC, InvestorRegistry and FundToken (NAV 1.00)
        // TODO: grant MANAGER_ROLE to the demo manager, approve investor A
        // TODO: mint mUSDC and send some ETH to the demo wallets
        // TODO: write addresses to deployments/<network>.json
    }
}
