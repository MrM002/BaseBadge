// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ScoreCheckerUpgradeable} from "../src/ScoreCheckerUpgradeable.sol";

contract ScoreCheckerEIP712Test is Test {
    ScoreCheckerUpgradeable sc;
    address user = address(0x1111);

    // signer pk and address for authorizedSigner
    uint256 signerPK;
    address signer;

    // EIP-712 constants
    bytes32 constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 constant NAME_HASH = keccak256(bytes("BaseBadgeScore"));
    bytes32 constant VERSION_HASH = keccak256(bytes("1"));
    bytes32 constant SCORE_TYPEHASH = keccak256(
        "Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)"
    );

    function setUp() public {
        // deploy implementation and proxy
        ScoreCheckerUpgradeable impl = new ScoreCheckerUpgradeable(1e15); // MAX_FEE
        signerPK = 0xA11CE;
        signer = vm.addr(signerPK);
        bytes memory initData = abi.encodeWithSelector(
            ScoreCheckerUpgradeable.initialize.selector,
            uint256(1e15), // checkFee
            signer,         // authorized signer
            address(this)   // owner
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        sc = ScoreCheckerUpgradeable(payable(address(proxy)));
        // ensure timestamp after MIN_ISSUED_AT
        vm.warp(1_700_000_000);
        // adjust sig age for tests
        sc.setMaxSigAge(900);

        vm.deal(user, 1 ether);
        // disable rate limit for signature tests
        sc.setMinInterval(0);
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            NAME_HASH,
            VERSION_HASH,
            block.chainid,
            address(sc)
        ));
    }

    function _digest(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
    }

    function test_submitScore_withSignature() public {
        uint256 score = 88;
        uint64 issuedAt = uint64(block.timestamp);
        uint256 nonce = 0; // first

        bytes32 structHash = keccak256(abi.encode(
            SCORE_TYPEHASH,
            user,
            score,
            issuedAt,
            nonce
        ));
        bytes32 digest = _digest(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPK, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(user);
        sc.submitScore{value: 1e15}(score, issuedAt, nonce, sig);

        (uint256 s_, uint256 ts) = sc.getScore(user);
        assertEq(s_, score);
        assertGt(ts, 0);
        assertEq(sc.nonces(user), 1);
    }

    function test_submitScore_revertInvalidSigner() public {
        uint256 score = 50;
        uint64 issuedAt = uint64(block.timestamp);
        uint256 nonce = 0;

        bytes32 structHash = keccak256(abi.encode(
            SCORE_TYPEHASH,
            user,
            score,
            issuedAt,
            nonce
        ));
        bytes32 digest = _digest(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBEEF, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("InvalidSigner()"));
        sc.submitScore{value: 1e15}(score, issuedAt, nonce, sig);
    }

    function test_submitScore_revertInvalidNonce() public {
        uint256 score = 50;
        uint64 issuedAt = uint64(block.timestamp);
        uint256 nonce = 1; // wrong initial nonce

        bytes32 structHash = keccak256(abi.encode(
            SCORE_TYPEHASH,
            user,
            score,
            issuedAt,
            nonce
        ));
        bytes32 digest = _digest(structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPK, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("InvalidNonce(uint256,uint256)", 1, 0));
        sc.submitScore{value: 1e15}(score, issuedAt, nonce, sig);
    }
}
