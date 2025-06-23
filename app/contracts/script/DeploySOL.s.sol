// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Script } from "forge-std/Script.sol";
import { SOL } from "../src/tokens/SOL.sol";

contract DeploySOL is Script {
    function run() external returns(SOL) {
        vm.startBroadcast();
        SOL sol = new SOL();
        vm.stopBroadcast();

        return sol;
    }
}