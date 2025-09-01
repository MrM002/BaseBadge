// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ScoreCheckerUpgradeable (UUPS)
 * @dev Upgradeable contract for verifying and storing user scores with EIP-712 signatures
 */
contract ScoreCheckerUpgradeable is
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    EIP712Upgradeable,
    UUPSUpgradeable
{
    // --- Constants ---
    // Default signature age; configurable via setter with upper-bound
    uint256 public constant DEFAULT_MAX_SIG_AGE = 10 minutes;
    uint256 public constant MAX_SCORE = 1_000_000;
    uint256 public constant MIN_ISSUED_AT = 1640995200; // Jan 1, 2022
    uint256 public constant MAX_INTERVAL = 1 days;

    // --- Immutable ---
    uint256 public immutable MAX_FEE;

    // --- Storage ---
    uint256 public checkFee;
    uint256 public minInterval; // seconds (rate limit)
    address public authorizedSigner;
    uint256 public maxSigAge; // seconds (signature freshness window)

    struct UserData {
        uint128 score;
        uint64 lastCheckTime;
        uint64 lastIssuedAt;
    }
    mapping(address => UserData) public userData;
    mapping(address => uint256) public nonces;

    // --- Events ---
    event ScoreChecked(address indexed user, uint256 score, uint256 fee, uint256 timestamp);
    event FeeUpdated(uint256 newFee);
    event MinIntervalUpdated(uint256 seconds_);
    event SignerUpdated(address signer);
    event Withdraw(address indexed to, uint256 amount);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    event MaxSigAgeUpdated(uint256 seconds_);

    // --- Custom Errors ---
    error InvalidFee(uint256 provided, uint256 required_);
    error TooFrequent(uint256 timeRemaining);
    error ZeroAddress();
    error InvalidSigner();
    error StaleSignature(uint256 age, uint256 maxAge);
    error NonMonotonicIssuedAt(uint256 provided, uint256 current);
    error ScoreTooHigh(uint256 provided, uint256 maximum);
    error IssuedAtTooOld(uint256 provided, uint256 minimum);
    error InvalidNonce(uint256 provided, uint256 expected);
    error IntervalTooLong(uint256 provided, uint256 maximum);

    // --- EIP-712 ---
    // keccak256("Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)")
    bytes32 private constant SCORE_TYPEHASH = keccak256(
        "Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)"
    );

    // --- Storage Gap for future upgrades ---
    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(uint256 _maxFee) {
        if (_maxFee == 0) revert ZeroAddress();
        MAX_FEE = _maxFee;
        _disableInitializers();
    }

    function initialize(
        uint256 _checkFee,
        address _signer,
        address _owner
    ) public initializer {
        if (_signer == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();
        if (_checkFee > MAX_FEE) revert InvalidFee(_checkFee, MAX_FEE);

        __Ownable2Step_init();
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __EIP712_init("BaseBadgeScore", "1");
        __UUPSUpgradeable_init();

        checkFee = _checkFee;
        authorizedSigner = _signer;
        minInterval = 30; // default 30s
        maxSigAge = DEFAULT_MAX_SIG_AGE;

        emit SignerUpdated(_signer);
        emit FeeUpdated(_checkFee);
    }

    // --- Admin ---
    function setAuthorizedSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        authorizedSigner = _signer;
        emit SignerUpdated(_signer);
    }

    function setCheckFee(uint256 _newFee) external onlyOwner {
        if (_newFee > MAX_FEE) revert InvalidFee(_newFee, MAX_FEE);
        checkFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setMinInterval(uint256 _seconds) external onlyOwner {
        if (_seconds > MAX_INTERVAL) revert IntervalTooLong(_seconds, MAX_INTERVAL);
        minInterval = _seconds;
        emit MinIntervalUpdated(_seconds);
    }

    function setMaxSigAge(uint256 _seconds) external onlyOwner {
        // clamp to sane upper-bound for safety
        require(_seconds > 0 && _seconds <= 1 days, "InvalidMaxSigAge");
        maxSigAge = _seconds;
        emit MaxSigAgeUpdated(_seconds);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function emergencyPause() external onlyOwner { _pause(); }

    // --- User Flow ---
    function submitScore(
        uint256 score,
        uint256 issuedAt,
        uint256 nonce,
        bytes calldata signature
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        if (msg.value != checkFee) revert InvalidFee(msg.value, checkFee);
        if (score > MAX_SCORE) revert ScoreTooHigh(score, MAX_SCORE);
        if (issuedAt < MIN_ISSUED_AT) revert IssuedAtTooOld(issuedAt, MIN_ISSUED_AT);
        if (nonce != nonces[msg.sender]) revert InvalidNonce(nonce, nonces[msg.sender]);

        // verify signature
        bytes32 structHash = keccak256(abi.encode(
            SCORE_TYPEHASH,
            msg.sender,
            score,
            issuedAt,
            nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != authorizedSigner) revert InvalidSigner();

        UserData memory user = userData[msg.sender];

        if (issuedAt <= user.lastIssuedAt) {
            revert NonMonotonicIssuedAt(issuedAt, user.lastIssuedAt);
        }

        uint256 interval = minInterval;
        if (interval > 0 && user.lastCheckTime != 0) {
            uint256 timeSince = block.timestamp - user.lastCheckTime;
            if (timeSince < interval) {
                revert TooFrequent(interval - timeSince);
            }
        }

        if (block.timestamp < issuedAt) revert StaleSignature(0, maxSigAge);
        uint256 signatureAge = block.timestamp - issuedAt;
        if (signatureAge > maxSigAge) revert StaleSignature(signatureAge, maxSigAge);

        userData[msg.sender] = UserData({
            score: uint128(score),
            lastCheckTime: uint64(block.timestamp),
            lastIssuedAt: uint64(issuedAt)
        });
        nonces[msg.sender]++;

        emit ScoreChecked(msg.sender, score, msg.value, block.timestamp);
        return score;
    }

    // --- Funds ---
    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool ok, ) = to.call{value: balance}("");
        require(ok, "Transfer failed");
        emit Withdraw(to, balance);
    }

    function emergencyWithdraw(address payable to) external onlyOwner whenPaused nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool ok, ) = to.call{value: balance}("");
        require(ok, "Transfer failed");
        emit EmergencyWithdraw(to, balance);
    }

    // --- Views ---
    function getScore(address user) external view returns (uint256 score, uint256 timestamp) {
        UserData memory d = userData[user];
        return (uint256(d.score), uint256(d.lastCheckTime));
    }

    function getUserData(address user) external view returns (
        uint256 score,
        uint256 lastCheckTime,
        uint256 lastIssuedAt,
        uint256 nonce
    ) {
        UserData memory d = userData[user];
        return (uint256(d.score), uint256(d.lastCheckTime), uint256(d.lastIssuedAt), nonces[user]);
    }

    function canSubmitScore(address user) external view returns (bool canSubmit, uint256 timeRemaining) {
        if (minInterval == 0) return (true, 0);
        UserData memory d = userData[user];
        if (d.lastCheckTime == 0) return (true, 0);
        uint256 timeSince = block.timestamp - d.lastCheckTime;
        if (timeSince >= minInterval) return (true, 0);
        return (false, minInterval - timeSince);
    }

    // --- UUPS ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Safety ---
    receive() external payable { revert("Direct ETH not allowed"); }
    fallback() external payable { revert("No fallback"); }
}


