// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Script } from "forge-std/Script.sol";
import { BTC } from "../src/tokens/BTC.sol";

contract DeployBTC is Script {
    function run() external returns(BTC) {
        vm.startBroadcast();
        BTC btc = new BTC();
        vm.stopBroadcast();

        return btc;
    }
}