// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console2} from "forge-std/Script.sol";
import {ScoreCheckerUpgradeableV2} from "../src/ScoreCheckerUpgradeableV2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployScoreCheckerV2
 * @dev Script to deploy the ScoreCheckerUpgradeableV2 contract
 */
contract DeployScoreCheckerV2 is Script {
    // Configuration - adjust these values as needed
    uint256 public constant MAX_FEE = 0.001 ether; // 0.001 ETH max fee
    uint256 public constant INITIAL_CHECK_FEE = 0.0001 ether; // 0.0001 ETH initial fee
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // For now, we'll use the deployer as both owner and signer
        // In production, you should use separate addresses
        address owner = deployer;
        address signer = deployer;
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        ScoreCheckerUpgradeableV2 implementation = new ScoreCheckerUpgradeableV2(MAX_FEE);
        
                        // Prepare initialization data with exact signature
                bytes memory initData = abi.encodeWithSignature(
                    "initialize(uint256,address,address)",
                    INITIAL_CHECK_FEE,
                    deployer, // signer
                    deployer  // owner
                );
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        
        vm.stopBroadcast();
        
        console2.log("ScoreCheckerUpgradeableV2 deployed successfully!");
        console2.log("Deployer address:", deployer);
        console2.log("Implementation address:", address(implementation));
        console2.log("Proxy address:", address(proxy));
        console2.log("Owner:", owner);
        console2.log("Authorized signer:", signer);
        console2.log("Max fee:", MAX_FEE);
        console2.log("Initial check fee:", INITIAL_CHECK_FEE);
        
        // Instructions for next steps
        console2.log("\nNext steps:");
        console2.log("1. Verify the contract on Base Sepolia");
        console2.log("2. Test the contract functionality");
        console2.log("3. Deploy to Base Mainnet when ready");
    }
}
