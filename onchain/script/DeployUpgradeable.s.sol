// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ScoreCheckerUpgradeable} from "../src/ScoreCheckerUpgradeable.sol";

contract DeployUpgradeable is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // Deploy implementation with MAX_FEE = env or default (1e15 = 0.001 ETH)
        uint256 maxFee = vm.envOr("MAX_FEE_WEI", uint256(1e15));
        ScoreCheckerUpgradeable implementation = new ScoreCheckerUpgradeable(maxFee);

        // Prepare initializer data
        uint256 checkFee = vm.envOr("CHECK_FEE_WEI", uint256(5e14));
        address signer = vm.envOr("AUTHORIZED_SIGNER", deployer);
        address owner = vm.envOr("OWNER", deployer);

        bytes memory initData = abi.encodeWithSelector(
            ScoreCheckerUpgradeable.initialize.selector,
            checkFee,
            signer,
            owner
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        vm.stopBroadcast();

        console.log("Implementation:", address(implementation));
        console.log("Proxy:", address(proxy));
        console.log("ScoreCheckerUpgradeable at:", address(proxy));
    }
}


