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
 * @title ScoreCheckerUpgradeableV2 (UUPS)
 * @dev Upgradeable contract for verifying and storing complete user scorecard data with EIP-712 signatures
 * @dev This version stores all Base Metrics, Security Analysis, and other scorecard components onchain
 */
contract ScoreCheckerUpgradeableV2 is
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

    // --- Complete Scorecard Data Structure ---
    struct UserScoreCard {
        // Core scores
        uint128 totalScore;
        uint128 baseScore;
        uint128 securityScore;
        
        // Transaction data
        uint64 numberOfTransactions;
        uint32 currentStreak;
        uint32 maxStreak;
        
        // Balance data (in wei, scaled down for storage)
        uint128 currentBalance;
        uint128 avgBalanceLastMonth;
        uint128 gasPaid;
        
        // Security metrics
        uint32 suspiciousTokens;
        uint32 suspiciousContracts;
        uint32 dangerousInteractions;
        uint32 suspiciousOilCompanies;
        
        // Metadata
        uint64 lastCheckTime;
        uint64 lastIssuedAt;
    }

    // Legacy UserData for backward compatibility
    struct UserData {
        uint128 score;
        uint64 lastCheckTime;
        uint64 lastIssuedAt;
    }

    mapping(address => UserScoreCard) public userScoreCards;
    mapping(address => UserData) public userData; // Legacy mapping for backward compatibility
    mapping(address => uint256) public nonces;

    // --- Events ---
    event ScoreCardUpdated(address indexed user, uint256 totalScore, uint256 fee, uint256 timestamp);
    event ScoreChecked(address indexed user, uint256 score, uint256 fee, uint256 timestamp); // Legacy event
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
    error SoulboundToken();
    error InvalidTokenId(uint256 tokenId);

    // --- EIP-712 Typehashes ---
    // Legacy typehash for backward compatibility
    bytes32 private constant SCORE_TYPEHASH = keccak256(
        "Score(address user,uint256 score,uint256 issuedAt,uint256 nonce)"
    );
    
    // New typehash for complete scorecard
    bytes32 private constant SCORECARD_TYPEHASH = keccak256(
        "ScoreCard(address user,uint256 totalScore,uint256 baseScore,uint256 securityScore,uint256 numberOfTransactions,uint256 currentStreak,uint256 maxStreak,uint256 currentBalance,uint256 avgBalanceLastMonth,uint256 gasPaid,uint256 suspiciousTokens,uint256 suspiciousContracts,uint256 dangerousInteractions,uint256 suspiciousOilCompanies,uint256 issuedAt,uint256 nonce)"
    );

    // --- Storage Gap for future upgrades ---
    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(uint256 _maxFee) {
        if (_maxFee == 0) revert("MaxFee cannot be zero");
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
        __Pausable_init();
        __ReentrancyGuard_init();
        __EIP712_init("BaseBadgeScore", "1"); // Keep version "1" for compatibility
        __UUPSUpgradeable_init();

        checkFee = _checkFee;
        authorizedSigner = _signer;
        minInterval = 30; // default 30s
        maxSigAge = DEFAULT_MAX_SIG_AGE;

        // Transfer ownership to the specified owner
        _transferOwnership(_owner);

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

    // --- New Complete Scorecard Submission ---
    function submitScoreCard(
        uint256 totalScore,
        uint256 baseScore,
        uint256 securityScore,
        uint256 numberOfTransactions,
        uint256 currentStreak,
        uint256 maxStreak,
        uint256 currentBalance,
        uint256 avgBalanceLastMonth,
        uint256 gasPaid,
        uint256 suspiciousTokens,
        uint256 suspiciousContracts,
        uint256 dangerousInteractions,
        uint256 suspiciousOilCompanies,
        uint64 issuedAt,
        uint256 nonce,
        bytes calldata signature
    ) external payable nonReentrant whenNotPaused returns (bool) {
        if (msg.value != checkFee) revert InvalidFee(msg.value, checkFee);
        if (totalScore > MAX_SCORE) revert ScoreTooHigh(totalScore, MAX_SCORE);
        if (baseScore > MAX_SCORE) revert ScoreTooHigh(baseScore, MAX_SCORE);
        if (securityScore > MAX_SCORE) revert ScoreTooHigh(securityScore, MAX_SCORE);
        if (issuedAt < MIN_ISSUED_AT) revert IssuedAtTooOld(issuedAt, MIN_ISSUED_AT);
        if (nonce != nonces[msg.sender]) revert InvalidNonce(nonce, nonces[msg.sender]);

        // Verify signature for complete scorecard
        bytes32 structHash = keccak256(abi.encode(
            SCORECARD_TYPEHASH,
            msg.sender,
            totalScore,
            baseScore,
            securityScore,
            numberOfTransactions,
            currentStreak,
            maxStreak,
            currentBalance,
            avgBalanceLastMonth,
            gasPaid,
            suspiciousTokens,
            suspiciousContracts,
            dangerousInteractions,
            suspiciousOilCompanies,
            issuedAt,
            nonce
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != authorizedSigner) revert InvalidSigner();

        UserScoreCard memory userCard = userScoreCards[msg.sender];

        if (issuedAt <= userCard.lastIssuedAt) {
            revert NonMonotonicIssuedAt(issuedAt, userCard.lastIssuedAt);
        }

        uint256 interval = minInterval;
        if (interval > 0 && userCard.lastCheckTime != 0) {
            uint256 timeSince = block.timestamp - userCard.lastCheckTime;
            if (timeSince < interval) {
                revert TooFrequent(interval - timeSince);
            }
        }

        if (block.timestamp < issuedAt) revert StaleSignature(0, maxSigAge);
        uint256 signatureAge = block.timestamp - issuedAt;
        if (signatureAge > maxSigAge) revert StaleSignature(signatureAge, maxSigAge);

        // Store complete scorecard
        userScoreCards[msg.sender] = UserScoreCard({
            totalScore: uint128(totalScore),
            baseScore: uint128(baseScore),
            securityScore: uint128(securityScore),
            numberOfTransactions: uint64(numberOfTransactions),
            currentStreak: uint32(currentStreak),
            maxStreak: uint32(maxStreak),
            currentBalance: uint128(currentBalance),
            avgBalanceLastMonth: uint128(avgBalanceLastMonth),
            gasPaid: uint128(gasPaid),
            suspiciousTokens: uint32(suspiciousTokens),
            suspiciousContracts: uint32(suspiciousContracts),
            dangerousInteractions: uint32(dangerousInteractions),
            suspiciousOilCompanies: uint32(suspiciousOilCompanies),
            lastCheckTime: uint64(block.timestamp),
            lastIssuedAt: uint64(issuedAt)
        });

        // Also update legacy userData for backward compatibility
        userData[msg.sender] = UserData({
            score: uint128(totalScore),
            lastCheckTime: uint64(block.timestamp),
            lastIssuedAt: uint64(issuedAt)
        });

        nonces[msg.sender]++;
        emit ScoreCardUpdated(msg.sender, totalScore, msg.value, block.timestamp);
        return true;
    }

    // --- Legacy Score Submission (for backward compatibility) ---
    function submitScore(
        uint256 score,
        uint64 issuedAt,
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
    // Legacy view functions for backward compatibility
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

    // New view functions for complete scorecard
    function getScoreCard(address user) external view returns (
        uint256 totalScore,
        uint256 baseScore,
        uint256 securityScore,
        uint256 numberOfTransactions,
        uint256 currentStreak,
        uint256 maxStreak,
        uint256 currentBalance,
        uint256 avgBalanceLastMonth,
        uint256 gasPaid,
        uint256 suspiciousTokens,
        uint256 suspiciousContracts,
        uint256 dangerousInteractions,
        uint256 suspiciousOilCompanies,
        uint256 lastCheckTime,
        uint256 lastIssuedAt
    ) {
        UserScoreCard memory card = userScoreCards[user];
        return (
            uint256(card.totalScore),
            uint256(card.baseScore),
            uint256(card.securityScore),
            uint256(card.numberOfTransactions),
            uint256(card.currentStreak),
            uint256(card.maxStreak),
            uint256(card.currentBalance),
            uint256(card.avgBalanceLastMonth),
            uint256(card.gasPaid),
            uint256(card.suspiciousTokens),
            uint256(card.suspiciousContracts),
            uint256(card.dangerousInteractions),
            uint256(card.suspiciousOilCompanies),
            uint256(card.lastCheckTime),
            uint256(card.lastIssuedAt)
        );
    }

    function canSubmitScore(address user) external view returns (bool canSubmit, uint256 timeRemaining) {
        if (minInterval == 0) return (true, 0);
        UserData memory d = userData[user];
        if (d.lastCheckTime == 0) return (true, 0);
        uint256 timeSince = block.timestamp - d.lastCheckTime;
        if (timeSince >= minInterval) return (true, 0);
        return (false, minInterval - timeSince);
    }
    
    // Public function for testing EIP-712 signatures
    function hashTypedDataV4(bytes32 structHash) external view returns (bytes32) {
        return _hashTypedDataV4(structHash);
    }

    // --- UUPS ---
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // --- Safety ---
    receive() external payable { revert("Direct ETH not allowed"); }
    fallback() external payable { revert("No fallback"); }
}
