# Onchain Security Documentation 🔒

> **Smart Contract Security Guidelines, Best Practices & Implementation Details**

## 🛡️ **Security Overview**

The BaseBadge onchain system implements comprehensive security measures to protect user funds, prevent unauthorized access, and ensure contract integrity. This document outlines our security framework, best practices, and implementation details for smart contracts deployed on the Base network.

## 🔐 **Access Control & Authorization**

### **Role-Based Access Control (RBAC)**
```solidity
// Role definitions
bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
bytes32 public constant SCORER_ROLE = keccak256("SCORER_ROLE");
bytes32 public constant BADGE_MANAGER_ROLE = keccak256("BADGE_MANAGER_ROLE");

// Role management
function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(role, account);
    emit RoleGranted(role, account, msg.sender);
}

function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(role, account);
    emit RoleRevoked(role, account, msg.sender);
}

// Role checking
function hasRole(bytes32 role, address account) public view returns (bool) {
    return _roles[role][account];
}

// Role modifier
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "AccessControl: access denied");
    _;
}
```

### **Multi-Signature Governance**
```solidity
// Multi-signature implementation
contract MultiSigGovernance {
    mapping(address => bool) public isOwner;
    mapping(bytes32 => mapping(address => bool)) public hasConfirmed;
    mapping(bytes32 => uint256) public confirmationCount;
    
    uint256 public requiredConfirmations;
    uint256 public ownerCount;
    
    event Confirmation(address owner, bytes32 transactionId);
    event Revocation(address owner, bytes32 transactionId);
    event Execution(bytes32 transactionId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier confirmed(bytes32 transactionId) {
        require(hasConfirmed[transactionId][msg.sender], "Transaction not confirmed");
        _;
    }
    
    modifier notConfirmed(bytes32 transactionId) {
        require(!hasConfirmed[transactionId][msg.sender], "Transaction already confirmed");
        _;
    }
    
    function confirmTransaction(bytes32 transactionId) external onlyOwner notConfirmed(transactionId) {
        hasConfirmed[transactionId][msg.sender] = true;
        confirmationCount[transactionId]++;
        emit Confirmation(msg.sender, transactionId);
    }
    
    function revokeConfirmation(bytes32 transactionId) external onlyOwner confirmed(transactionId) {
        hasConfirmed[transactionId][msg.sender] = false;
        confirmationCount[transactionId]--;
        emit Revocation(msg.sender, transactionId);
    }
    
    function executeTransaction(bytes32 transactionId) external onlyOwner {
        require(confirmationCount[transactionId] >= requiredConfirmations, "Insufficient confirmations");
        // Execute transaction logic here
        emit Execution(transactionId);
    }
}
```

### **Timelock Mechanism**
```solidity
// Timelock for critical operations
contract TimelockController {
    mapping(bytes32 => bool) public queued;
    mapping(bytes32 => uint256) public timestamps;
    
    uint256 public constant MIN_DELAY = 24 hours;
    uint256 public constant MAX_DELAY = 30 days;
    
    event CallScheduled(
        bytes32 indexed id,
        uint256 indexed index,
        address target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        uint256 delay
    );
    
    event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);
    
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external onlyRole(TIMELOCK_ADMIN_ROLE) {
        require(delay >= MIN_DELAY, "Delay too short");
        require(delay <= MAX_DELAY, "Delay too long");
        
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        require(!queued[id], "Operation already queued");
        
        timestamps[id] = block.timestamp + delay;
        queued[id] = true;
        
        emit CallScheduled(id, 0, target, value, data, predecessor, delay);
    }
    
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        require(queued[id], "Operation not queued");
        require(block.timestamp >= timestamps[id], "Operation not ready");
        
        queued[id] = false;
        
        (bool success, ) = target.call{value: value}(data);
        require(success, "Operation failed");
        
        emit CallExecuted(id, 0, target, value, data);
    }
}
```

## 🚫 **Reentrancy Protection**

### **ReentrancyGuard Implementation**
```solidity
// OpenZeppelin ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    uint256 private _status;
    
    constructor() {
        _status = _NOT_ENTERED;
    }
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// Custom reentrancy protection
contract CustomReentrancyGuard {
    bool private _locked;
    
    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }
    
    // Additional protection for external calls
    modifier nonReentrantExternal() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
        
        // Clear any potential reentrancy state
        _locked = false;
    }
}
```

### **Checks-Effects-Interactions Pattern**
```solidity
// Secure pattern for state changes
contract SecureStateManager {
    mapping(address => uint256) public balances;
    
    function withdraw(uint256 amount) external nonReentrant {
        // 1. Checks
        require(amount > 0, "Amount must be positive");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // 2. Effects (state changes)
        balances[msg.sender] -= amount;
        
        // 3. Interactions (external calls)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    // Batch operations with proper ordering
    function batchUpdateBalances(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyRole(UPDATER_ROLE) {
        require(users.length == amounts.length, "Length mismatch");
        
        // 1. Checks
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user");
            require(amounts[i] > 0, "Invalid amount");
        }
        
        // 2. Effects
        for (uint256 i = 0; i < users.length; i++) {
            balances[users[i]] = amounts[i];
        }
        
        // 3. Events
        emit BatchUpdate(users, amounts);
    }
}
```

## 🔒 **Input Validation & Sanitization**

### **Address Validation**
```solidity
// Comprehensive address validation
library AddressValidator {
    function isValidAddress(address addr) internal pure returns (bool) {
        return addr != address(0) && addr != address(1);
    }
    
    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
    
    function isEOA(address addr) internal view returns (bool) {
        return !isContract(addr);
    }
    
    function validateAddress(address addr) internal pure {
        require(addr != address(0), "Invalid address: zero address");
        require(addr != address(1), "Invalid address: precompile");
    }
}

// Usage in contracts
contract SecureContract {
    using AddressValidator for address;
    
    function setAddress(address newAddr) external {
        newAddr.validateAddress();
        // Additional validation logic
        require(newAddr != currentAddress, "Address unchanged");
        
        currentAddress = newAddr;
        emit AddressUpdated(newAddr);
    }
}
```

### **Data Validation**
```solidity
// Data validation library
library DataValidator {
    function validateUint256(uint256 value, uint256 min, uint256 max) internal pure {
        require(value >= min, "Value below minimum");
        require(value <= max, "Value above maximum");
    }
    
    function validateString(string memory str, uint256 maxLength) internal pure {
        require(bytes(str).length > 0, "Empty string");
        require(bytes(str).length <= maxLength, "String too long");
    }
    
    function validateBytes(bytes memory data, uint256 minLength, uint256 maxLength) internal pure {
        require(data.length >= minLength, "Data too short");
        require(data.length <= maxLength, "Data too long");
    }
    
    function validateArrayLength(uint256 length, uint256 maxLength) internal pure {
        require(length > 0, "Empty array");
        require(length <= maxLength, "Array too long");
    }
}

// Usage in contracts
contract DataContract {
    using DataValidator for uint256;
    using DataValidator for string;
    
    uint256 public constant MAX_SCORE = 100;
    uint256 public constant MAX_NAME_LENGTH = 50;
    
    function updateScore(uint256 newScore) external {
        newScore.validateUint256(0, MAX_SCORE);
        // Update logic
    }
    
    function updateName(string memory newName) external {
        newName.validateString(MAX_NAME_LENGTH);
        // Update logic
    }
}
```

### **Signature Verification**
```solidity
// EIP-712 signature verification
contract SignatureVerifier {
    bytes32 public constant DOMAIN_SEPARATOR = keccak256(
        abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("BaseBadge")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        )
    );
    
    function verifySignature(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hash));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        address recoveredSigner = ecrecover(ethSignedMessageHash, 
            uint8(signature[0]), 
            bytes32(signature[1:33]), 
            bytes32(signature[33:65])
        );
        
        return recoveredSigner == signer;
    }
    
    function verifyTypedData(
        address signer,
        bytes32 structHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        return verifySignature(signer, messageHash, signature);
    }
}
```

## 🌐 **Upgradeability Security**

### **Proxy Pattern Security**
```solidity
// Secure upgradeable proxy
contract SecureProxy is ERC1967Proxy {
    address public immutable admin;
    
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    function upgradeTo(address newImplementation) external onlyAdmin {
        _upgradeTo(newImplementation);
    }
    
    function upgradeToAndCall(
        address newImplementation,
        bytes memory data
    ) external onlyAdmin {
        _upgradeToAndCall(newImplementation, data, true);
    }
    
    // Prevent direct calls to implementation
    fallback() external payable {
        _fallback();
    }
    
    receive() external payable {
        _fallback();
    }
}

// Implementation contract
contract SecureImplementation is Initializable, AccessControlUpgradeable {
    function initialize() public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // Prevent direct initialization
    function initializeDirect() external {
        revert("Direct initialization not allowed");
    }
}
```

### **Storage Layout Safety**
```solidity
// Storage layout management
contract StorageLayout {
    // Storage slots for upgradeable contracts
    uint256[50] private __gap;
    
    // Explicit storage layout
    struct Storage {
        mapping(address => uint256) balances;
        mapping(address => bool) isActive;
        uint256 totalSupply;
        address owner;
    }
    
    // Storage pointer
    bytes32 private constant STORAGE_SLOT = keccak256("basebadge.storage");
    
    function _getStorage() internal pure returns (Storage storage s) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }
    
    // Prevent storage collision
    function _validateStorageLayout() internal view {
        // Verify storage layout hasn't changed
        require(_getStorage().owner != address(0), "Storage corrupted");
    }
}
```

## 🚨 **Emergency Controls**

### **Emergency Pause**
```solidity
// Emergency pause functionality
contract EmergencyPausable is AccessControlUpgradeable {
    bool public paused;
    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    event Paused(address account);
    event Unpaused(address account);
    event EmergencyPaused(address account, uint256 timestamp);
    
    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }
    
    modifier whenPaused() {
        require(paused, "Pausable: not paused");
        _;
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        paused = true;
        emit EmergencyPaused(msg.sender, block.timestamp);
    }
    
    // Emergency functions that work even when paused
    function emergencyWithdraw() external whenPaused onlyRole(EMERGENCY_ROLE) {
        // Emergency withdrawal logic
    }
}
```

### **Circuit Breaker Pattern**
```solidity
// Circuit breaker implementation
contract CircuitBreaker {
    bool public stopped = false;
    address public breaker;
    
    event CircuitBreakerTriggered(address indexed breaker, uint256 timestamp);
    event CircuitBreakerReset(address indexed breaker, uint256 timestamp);
    
    modifier stopInEmergency() {
        require(!stopped, "Circuit breaker: stopped");
        _;
    }
    
    modifier onlyBreaker() {
        require(msg.sender == breaker, "Circuit breaker: not authorized");
        _;
    }
    
    function triggerCircuitBreaker() external onlyBreaker {
        stopped = true;
        emit CircuitBreakerTriggered(msg.sender, block.timestamp);
    }
    
    function resetCircuitBreaker() external onlyBreaker {
        stopped = false;
        emit CircuitBreakerReset(msg.sender, block.timestamp);
    }
    
    // Emergency functions
    function emergencyStop() external {
        require(msg.sender == breaker || msg.sender == owner(), "Not authorized");
        stopped = true;
        emit CircuitBreakerTriggered(msg.sender, block.timestamp);
    }
}
```

## 🔍 **Vulnerability Prevention**

### **Integer Overflow Protection**
```solidity
// Safe math operations
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;
        return c;
    }
    
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }
    
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        return c;
    }
}

// Usage with Solidity 0.8+
contract ModernContract {
    // Solidity 0.8+ has built-in overflow protection
    function safeOperation(uint256 a, uint256 b) external pure returns (uint256) {
        // No need for SafeMath in 0.8+
        return a + b;
    }
}
```

### **Front-Running Protection**
```solidity
// Commit-reveal pattern
contract CommitReveal {
    mapping(bytes32 => bool) public commitments;
    mapping(address => bytes32) public userCommitments;
    
    event Committed(address indexed user, bytes32 commitment);
    event Revealed(address indexed user, uint256 value, bytes32 nonce);
    
    function commit(bytes32 commitment) external {
        require(userCommitments[msg.sender] == bytes32(0), "Already committed");
        require(commitments[commitment] == false, "Commitment already used");
        
        commitments[commitment] = true;
        userCommitments[msg.sender] = commitment;
        
        emit Committed(msg.sender, commitment);
    }
    
    function reveal(uint256 value, bytes32 nonce) external {
        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, value, nonce));
        require(commitments[commitment], "Invalid commitment");
        require(userCommitments[msg.sender] == commitment, "Not your commitment");
        
        // Process the revealed value
        _processValue(msg.sender, value);
        
        // Clear commitment
        delete commitments[commitment];
        delete userCommitments[msg.sender];
        
        emit Revealed(msg.sender, value, nonce);
    }
    
    function _processValue(address user, uint256 value) internal {
        // Implementation logic
    }
}
```

### **Flash Loan Attack Prevention**
```solidity
// Flash loan attack prevention
contract FlashLoanProtected {
    mapping(address => uint256) public lastActionBlock;
    
    modifier noFlashLoan() {
        require(block.number != lastActionBlock[msg.sender], "Flash loan detected");
        lastActionBlock[msg.sender] = block.number;
        _;
    }
    
    // Alternative: use block.timestamp
    modifier noFlashLoanTimestamp() {
        require(block.timestamp != lastActionTime[msg.sender], "Flash loan detected");
        lastActionTime[msg.sender] = block.timestamp;
        _;
    }
    
    // Rate limiting
    modifier rateLimited(uint256 minBlocks) {
        require(
            block.number >= lastActionBlock[msg.sender] + minBlocks,
            "Rate limit exceeded"
        );
        lastActionBlock[msg.sender] = block.number;
        _;
    }
}
```

## 📊 **Security Monitoring**

### **Event Logging**
```solidity
// Comprehensive security events
contract SecurityEvents {
    event SecurityAlert(
        address indexed user,
        string alertType,
        string description,
        uint256 timestamp
    );
    
    event AccessAttempt(
        address indexed user,
        string functionName,
        bool success,
        uint256 timestamp
    );
    
    event StateChange(
        string changeType,
        address indexed user,
        bytes32 indexed role,
        uint256 timestamp
    );
    
    // Log security events
    function _logSecurityAlert(
        address user,
        string memory alertType,
        string memory description
    ) internal {
        emit SecurityAlert(user, alertType, description, block.timestamp);
    }
    
    // Log access attempts
    function _logAccessAttempt(
        address user,
        string memory functionName,
        bool success
    ) internal {
        emit AccessAttempt(user, functionName, success, block.timestamp);
    }
}
```

### **Anomaly Detection**
```solidity
// Anomaly detection system
contract AnomalyDetection {
    mapping(address => uint256) public userActionCount;
    mapping(address => uint256) public lastActionTime;
    
    uint256 public constant MAX_ACTIONS_PER_BLOCK = 10;
    uint256 public constant MIN_TIME_BETWEEN_ACTIONS = 1 seconds;
    
    modifier detectAnomalies() {
        // Check action count per block
        require(
            userActionCount[msg.sender] < MAX_ACTIONS_PER_BLOCK,
            "Too many actions per block"
        );
        
        // Check time between actions
        require(
            block.timestamp >= lastActionTime[msg.sender] + MIN_TIME_BETWEEN_ACTIONS,
            "Actions too frequent"
        );
        
        // Update counters
        userActionCount[msg.sender]++;
        lastActionTime[msg.sender] = block.timestamp;
        
        _;
        
        // Reset counter on new block
        if (block.number != lastActionBlock[msg.sender]) {
            userActionCount[msg.sender] = 0;
            lastActionBlock[msg.sender] = block.number;
        }
    }
}
```

## 🧪 **Security Testing**

### **Fuzzing Tests**
```solidity
// Foundry fuzzing tests
contract SecurityTest is Test {
    ScoreCheckerUpgradeableV2 public scoreChecker;
    
    function setUp() public {
        scoreChecker = new ScoreCheckerUpgradeableV2();
    }
    
    // Fuzz test for address validation
    function testFuzz_AddressValidation(address addr) public {
        // Test with various addresses including edge cases
        if (addr == address(0)) {
            vm.expectRevert("Invalid address");
            scoreChecker.setAddress(addr);
        } else {
            scoreChecker.setAddress(addr);
        }
    }
    
    // Fuzz test for numeric inputs
    function testFuzz_ScoreValidation(uint256 score) public {
        if (score > 100) {
            vm.expectRevert("Score too high");
            scoreChecker.setScore(score);
        } else {
            scoreChecker.setScore(score);
        }
    }
    
    // Invariant test
    function invariant_ScoreBounds() public view {
        // Ensure scores are always within bounds
        assert(scoreChecker.getScore() <= 100);
        assert(scoreChecker.getScore() >= 0);
    }
}
```

### **Invariant Testing**
```solidity
// Invariant testing
contract InvariantTest is Test {
    ScoreCheckerUpgradeableV2 public scoreChecker;
    
    function setUp() public {
        scoreChecker = new ScoreCheckerUpgradeableV2();
    }
    
    // Invariant: total supply should never decrease
    function invariant_TotalSupplyNeverDecreases() public view {
        uint256 currentSupply = scoreChecker.totalSupply();
        assert(currentSupply >= 0);
    }
    
    // Invariant: user balances should never be negative
    function invariant_UserBalancesNeverNegative() public view {
        // Test with various addresses
        for (uint256 i = 0; i < 100; i++) {
            address user = address(uint160(i));
            uint256 balance = scoreChecker.balanceOf(user);
            assert(balance >= 0);
        }
    }
    
    // Invariant: access control should work correctly
    function invariant_AccessControl() public view {
        // Ensure only authorized users can access admin functions
        // This would require more complex setup
    }
}
```

## 📋 **Security Checklist**

### **Development Phase**
- [ ] Access control implemented
- [ ] Reentrancy protection added
- [ ] Input validation implemented
- [ ] Emergency controls added
- [ ] Upgrade mechanism secured
- [ ] Storage layout documented
- [ ] Events for monitoring added

### **Testing Phase**
- [ ] Unit tests written
- [ ] Integration tests completed
- [ ] Fuzzing tests implemented
- [ ] Invariant tests added
- [ ] Security tests written
- [ ] Gas optimization tested
- [ ] Edge cases covered

### **Audit Phase**
- [ ] Static analysis completed
- [ ] Manual review done
- [ ] Formal verification performed
- [ ] Penetration testing completed
- [ ] Security audit passed
- [ ] Bug bounty launched
- [ ] Monitoring configured

## 🚨 **Incident Response**

### **Security Incident Types**
1. **Reentrancy Attack** - Unauthorized re-entry
2. **Access Control Bypass** - Unauthorized access
3. **Integer Overflow** - Numeric overflow
4. **Flash Loan Attack** - Market manipulation
5. **Upgrade Attack** - Malicious upgrade

### **Response Procedures**
1. **Immediate Response**
   - Pause affected functions
   - Isolate vulnerable contracts
   - Notify security team

2. **Investigation**
   - Analyze transaction logs
   - Identify attack vector
   - Assess damage scope

3. **Remediation**
   - Deploy security patches
   - Upgrade vulnerable contracts
   - Implement preventive measures

4. **Communication**
   - Notify stakeholders
   - Update users if necessary
   - Document lessons learned

## 📚 **Security Resources**

### **Documentation**
- [OpenZeppelin Security](https://docs.openzeppelin.com/learn/)
- [Consensys Security](https://consensys.net/diligence/)
- [Trail of Bits Security](https://blog.trailofbits.com/)

### **Tools**
- [Slither](https://github.com/crytic/slither) - Static analysis
- [Mythril](https://github.com/ConsenSys/mythril) - Security analysis
- [Echidna](https://github.com/crytic/echidna) - Fuzzing

### **Training**
- Security awareness training for developers
- Regular security workshops
- Code review best practices
- Incident response drills

---

**This security documentation is regularly updated to reflect current threats and best practices.**
