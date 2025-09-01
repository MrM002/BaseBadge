// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ScoreCheckerUpgradeable} from "../src/ScoreCheckerUpgradeable.sol";

contract ScoreCheckerTest is Test {
    ScoreCheckerUpgradeable sc;
    address user = address(0x1234);

    function setUp() public {
        // deploy upgradeable instance via proxy
        ScoreCheckerUpgradeable impl = new ScoreCheckerUpgradeable(1e15);
        bytes memory initData = abi.encodeWithSelector(
            ScoreCheckerUpgradeable.initialize.selector,
            uint256(1e15),
            address(this),
            address(this)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        sc = ScoreCheckerUpgradeable(payable(address(proxy)));
        // ensure timestamp is after MIN_ISSUED_AT (2022-01-01)
        vm.warp(1_700_000_000);
        vm.deal(user, 1 ether);
    }

    function test_Setters() public {
        sc.setCheckFee(9e14);
        sc.setMinInterval(1200);
        sc.setAuthorizedSigner(address(0xCAFE));
        sc.setMaxSigAge(900);
    }

    function test_CheckScore_ExactFee() public {
        // mint a signed payload for user
        uint256 pk = 0xA11CE;
        address signer = vm.addr(pk);
        sc.setAuthorizedSigner(signer);
        vm.deal(user, 1 ether);
        uint256 score = 80;
        uint64 issuedAt = uint64(block.timestamp);
        uint256 nonce = 0;
        bytes32 typeHash = keccak256("Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)");
        bytes32 structHash = keccak256(abi.encode(typeHash, user, score, issuedAt, nonce));
        // build domain sep locally
        bytes32 domainSep = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("BaseBadgeScore")),
            keccak256(bytes("1")),
            block.chainid,
            address(sc)
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(user);
        sc.submitScore{value: 1e15}(score, issuedAt, nonce, sig);
        (uint256 s_, uint256 ts) = sc.getScore(user);
        assertEq(s_, score);
        assertGt(ts, 0);
    }

    function test_Revert_InvalidFee() public {
        uint256 pk = 0xA11CE;
        address signer = vm.addr(pk);
        sc.setAuthorizedSigner(signer);
        uint64 issuedAt = uint64(block.timestamp);
        uint256 nonce = 0;
        bytes32 typeHash = keccak256("Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)");
        bytes32 structHash = keccak256(abi.encode(typeHash, user, uint256(80), issuedAt, nonce));
        bytes32 domainSep = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("BaseBadgeScore")),
            keccak256(bytes("1")),
            block.chainid,
            address(sc)
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("InvalidFee(uint256,uint256)", uint256(1), uint256(1e15)));
        sc.submitScore{value: 1}(80, issuedAt, nonce, sig);
    }

    function test_Cooldown() public {
        uint256 pk = 0xA11CE;
        address signer = vm.addr(pk);
        sc.setAuthorizedSigner(signer);
        vm.startPrank(user);
        uint64 issuedAt = uint64(block.timestamp);
        bytes32 typeHash = keccak256("Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)");
        // first submit
        bytes32 structHash1 = keccak256(abi.encode(typeHash, user, uint256(70), issuedAt, uint256(0)));
        bytes32 domainSep = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("BaseBadgeScore")),
            keccak256(bytes("1")),
            block.chainid,
            address(sc)
        ));
        bytes32 digest1 = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash1));
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(pk, digest1);
        sc.submitScore{value: 1e15}(70, issuedAt, 0, abi.encodePacked(r1, s1, v1));

        // move chain time forward slightly (< minInterval) and assert cooldown is active via view
        vm.warp(block.timestamp + 10);
        vm.stopPrank();
        (bool canSubmit, uint256 timeRemaining) = sc.canSubmitScore(user);
        assertEq(canSubmit, false);
        assertGt(timeRemaining, 0);

        // skip cooldown
        vm.warp(block.timestamp + 601);
        uint64 issuedAt3 = uint64(block.timestamp); // fresh issuedAt to avoid stale
        bytes32 structHash3 = keccak256(abi.encode(typeHash, user, uint256(72), issuedAt3, uint256(1)));
        bytes32 digest3 = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash3));
        (uint8 v3, bytes32 r3, bytes32 s3) = vm.sign(pk, digest3);
        vm.prank(user);
        sc.submitScore{value: 1e15}(72, issuedAt3, 1, abi.encodePacked(r3, s3, v3));
    }

    function test_Pause() public {
        sc.pause();
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        bytes memory dummySig = hex""; // empty sig to trigger pause before signature checks
        sc.submitScore{value: 1e15}(1, block.timestamp, 0, dummySig);
        sc.unpause();
    }
}