// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Script } from "forge-std/Script.sol";
import { ETH } from "../src/tokens/ETH.sol";

contract DeployETH is Script {
    function run() external returns(ETH) {
        vm.startBroadcast();
        ETH eth = new ETH();
        vm.stopBroadcast();

        return eth;
    }
}