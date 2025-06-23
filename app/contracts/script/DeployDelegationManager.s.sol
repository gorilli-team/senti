// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Script } from "forge-std/Script.sol";
import { DelegationManager } from "../src/DelegationManager.sol";

contract DeployDelegationManager is Script {
    function run() external {
        vm.startBroadcast();
        new DelegationManager(0x14679585102b1B0E5dbe755d27E55bc0B7e9Ae95);
        vm.stopBroadcast();
    }
}