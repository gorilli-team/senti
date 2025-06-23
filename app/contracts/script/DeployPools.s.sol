// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {SentiPool} from "../src/SentiPool.sol";
import {BTC} from "../src/tokens/BTC.sol";
import {ETH} from "../src/tokens/ETH.sol";
import {SOL} from "../src/tokens/SOL.sol";
import {USDT} from "../src/tokens/USDT.sol";
import {DeployBTC} from "./DeployBTC.s.sol";
import {DeployETH} from "./DeployETH.s.sol";
import {DeploySOL} from "./DeploySOL.s.sol";
import {DeployUSDT} from "./DeployUSDT.s.sol";

contract DeployPools is Script {
    BTC btc;
    ETH eth;
    SOL sol;
    USDT usdt;

    function run() external {
        DeployBTC deployBTC = new DeployBTC();
        btc = deployBTC.run();

        DeployETH deployETH = new DeployETH();
        eth = deployETH.run();

        DeploySOL deploySOL = new DeploySOL();
        sol = deploySOL.run();

        DeployUSDT deployUSDT = new DeployUSDT();
        usdt = deployUSDT.run();

        vm.startBroadcast();
        new SentiPool(address(btc), address(usdt), "Senti LP Token", "sLPT");
        new SentiPool(address(eth), address(usdt), "Senti LP Token", "sLPT");
        new SentiPool(address(sol), address(usdt), "Senti LP Token", "sLPT");
        vm.stopBroadcast();
    }
}
