// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {ScoreCheckerUpgradeable} from "../src/ScoreCheckerUpgradeable.sol";

interface IUUPSUpgradeableLike {
    function upgradeToAndCall(address newImplementation, bytes calldata data) external;
}

contract UpgradeContract is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(pk);

        uint256 maxFee = vm.envOr("MAX_FEE_WEI", uint256(1e15));
        ScoreCheckerUpgradeable newImpl = new ScoreCheckerUpgradeable(maxFee);

        IUUPSUpgradeableLike(proxyAddress).upgradeToAndCall(address(newImpl), "");

        vm.stopBroadcast();

        console.log("Upgraded to:", address(newImpl));
    }
}


