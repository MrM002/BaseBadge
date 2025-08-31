# BaseBadge Smart Contracts 🏗️

> **Solidity Smart Contracts for Decentralized Identity & Reputation System**

## 📋 **Overview**

The BaseBadge onchain system consists of smart contracts deployed on the Base network that provide decentralized identity management, reputation scoring, and badge verification. Built with Solidity and Foundry, these contracts ensure transparency, security, and immutability of user reputation data.

## 🏗️ **Architecture**

```
Onchain/
├── src/                    # Smart contract source files
│   ├── ScoreCheckerUpgradeable.sol      # V1 reputation contract
│   ├── ScoreCheckerUpgradeableV2.sol    # V2 reputation contract
│   └── Counter.sol                      # Test contract
├── script/                 # Deployment scripts
│   ├── DeployScoreCheckerV2.s.sol       # V2 deployment
│   ├── UpgradeToV2.s.sol                # V1 to V2 upgrade
│   └── DeployUpgradeable.s.sol          # General deployment
├── test/                   # Test files
│   ├── ScoreChecker.t.sol               # V1 tests
│   ├── ScoreCheckerV2.t.sol             # V2 tests
│   └── CompileTest.t.sol                # Compilation tests
├── contracts/              # Contract artifacts
├── lib/                    # Dependencies
└── docs/                   # Documentation
```

## 🚀 **Quick Start**

### **Prerequisites**
- Foundry (forge) installed
- Node.js 18+
- Git

### **Installation**

1. **Install Foundry**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Clone and setup**
```bash
cd onchain
forge install
```

3. **Build contracts**
```bash
forge build
```

4. **Run tests**
```bash
forge test
```

5. **Deploy to Base network**
```bash
forge script script/DeployScoreCheckerV2.s.sol --rpc-url $BASE_RPC_URL --broadcast
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Base Network Configuration
BASE_RPC_URL=https://mainnet.base.org
BASE_PRIVATE_KEY=your-private-key
BASE_EXPLORER_URL=https://basescan.org

# Test Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_PRIVATE_KEY=your-test-private-key

# Foundry Configuration
ETHERSCAN_API_KEY=your-etherscan-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key
```

### **Foundry Configuration**
```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false

[profile.default.fuzz]
runs = 1000

[profile.default.invariant]
runs = 1000
depth = 15
fail_on_revert = false

[rpc_endpoints]
base = "${BASE_RPC_URL}"
base_sepolia = "${BASE_SEPOLIA_RPC_URL}"

[etherscan]
base = { key = "${ETHERSCAN_API_KEY}" }
base_sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

## 📚 **Smart Contract Documentation**

### **ScoreCheckerUpgradeableV2.sol**

The main reputation contract that provides upgradeable reputation scoring functionality.

#### **Key Features**
- **Upgradeable**: Uses OpenZeppelin's upgradeable pattern
- **Reputation Scoring**: On-chain reputation calculation
- **Badge Management**: NFT-based badge system
- **Access Control**: Role-based permissions
- **Events**: Comprehensive event logging

#### **Core Functions**
```solidity
// Reputation scoring
function calculateReputation(address user) external returns (uint256 score);

// Badge management
function mintBadge(address user, uint256 badgeId) external;

// Score verification
function verifyScore(address user, uint256 score) external view returns (bool);

// Upgrade functionality
function upgradeTo(address newImplementation) external;
```

#### **State Variables**
```solidity
// Reputation data
mapping(address => ReputationData) public userReputations;

// Badge ownership
mapping(address => uint256[]) public userBadges;

// Access control
mapping(bytes32 => mapping(address => bool)) private _roles;

// Upgrade mechanism
address private _implementation;
```

### **ScoreCheckerUpgradeable.sol**

The V1 contract for backward compatibility and upgrade path.

#### **Compatibility Features**
- **V1 Interface**: Maintains original function signatures
- **Upgrade Path**: Seamless transition to V2
- **Data Migration**: Automatic data transfer
- **Fallback Support**: Handles legacy calls

## 🔐 **Security Features**

### **Access Control**
```solidity
// Role-based access control
modifier onlyRole(bytes32 role) {
    require(hasRole(role, msg.sender), "AccessControl: access denied");
    _;
}

// Role management
function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(role, account);
}

function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(role, account);
}
```

### **Reentrancy Protection**
```solidity
// Reentrancy guard
modifier nonReentrant() {
    require(!_locked, "Reentrant call");
    _locked = true;
    _;
    _locked = false;
}

// State variable for reentrancy protection
bool private _locked;
```

### **Input Validation**
```solidity
// Address validation
function _validateAddress(address addr) internal pure {
    require(addr != address(0), "Invalid address");
}

// Score validation
function _validateScore(uint256 score) internal pure {
    require(score <= MAX_SCORE, "Score exceeds maximum");
    require(score >= MIN_SCORE, "Score below minimum");
}
```

### **Emergency Controls**
```solidity
// Emergency pause
bool public paused;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
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
```

## 🧪 **Testing**

### **Test Structure**
```bash
test/
├── ScoreChecker.t.sol          # V1 contract tests
├── ScoreCheckerV2.t.sol        # V2 contract tests
├── CompileTest.t.sol           # Compilation tests
├── ScoreCheckerEIP712.t.sol    # EIP-712 signature tests
└── fixtures/                   # Test data
```

### **Running Tests**
```bash
# Run all tests
forge test

# Run specific test file
forge test --match-contract ScoreCheckerV2

# Run with verbose output
forge test -vvv

# Run with gas reporting
forge test --gas-report

# Run specific test function
forge test --match-test testCalculateReputation
```

### **Test Examples**
```solidity
// Basic functionality test
function testCalculateReputation() public {
    address user = address(0x123);
    uint256 expectedScore = 85;
    
    // Setup test data
    _setupUserData(user);
    
    // Execute function
    uint256 actualScore = scoreChecker.calculateReputation(user);
    
    // Assert result
    assertEq(actualScore, expectedScore, "Score mismatch");
}

// Upgrade test
function testUpgradeToV2() public {
    address v2Implementation = address(scoreCheckerV2);
    
    // Upgrade contract
    scoreChecker.upgradeTo(v2Implementation);
    
    // Verify upgrade
    assertEq(scoreChecker.implementation(), v2Implementation, "Upgrade failed");
}
```

## 🚀 **Deployment**

### **Deployment Scripts**

#### **DeployScoreCheckerV2.s.sol**
```solidity
// Deploy V2 contract
contract DeployScoreCheckerV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("BASE_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy implementation
        ScoreCheckerUpgradeableV2 implementation = new ScoreCheckerUpgradeableV2();
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                ScoreCheckerUpgradeableV2.initialize.selector
            )
        );
        
        vm.stopBroadcast();
        
        console.log("Implementation deployed at:", address(implementation));
        console.log("Proxy deployed at:", address(proxy));
    }
}
```

#### **UpgradeToV2.s.sol**
```solidity
// Upgrade from V1 to V2
contract UpgradeToV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("BASE_PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        address v2Implementation = vm.envAddress("V2_IMPLEMENTATION");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Upgrade proxy
        ScoreCheckerUpgradeable proxy = ScoreCheckerUpgradeable(proxyAddress);
        proxy.upgradeTo(v2Implementation);
        
        vm.stopBroadcast();
        
        console.log("Upgrade completed successfully");
    }
}
```

### **Deployment Commands**
```bash
# Deploy to Base mainnet
forge script script/DeployScoreCheckerV2.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $BASE_PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy to Base Sepolia testnet
forge script script/DeployScoreCheckerV2.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $BASE_SEPOLIA_PRIVATE_KEY \
  --broadcast \
  --verify

# Verify contract on BaseScan
forge verify-contract \
  --chain-id 8453 \
  --compiler-version 0.8.19 \
  --constructor-args \
  $PROXY_ADDRESS \
  $IMPLEMENTATION_ADDRESS
```

## 📊 **Gas Optimization**

### **Optimization Techniques**
```solidity
// Pack structs efficiently
struct ReputationData {
    uint128 score;        // Pack with timestamp
    uint128 timestamp;    // Both fit in 256 bits
    uint256 badgeCount;
}

// Use events instead of storage for historical data
event ReputationUpdated(
    address indexed user,
    uint256 indexed score,
    uint256 timestamp
);

// Batch operations
function batchUpdateReputations(
    address[] calldata users,
    uint256[] calldata scores
) external {
    require(users.length == scores.length, "Length mismatch");
    
    for (uint256 i = 0; i < users.length; i++) {
        _updateReputation(users[i], scores[i]);
    }
}
```

### **Gas Estimation**
```bash
# Estimate gas for deployment
forge script script/DeployScoreCheckerV2.s.sol \
  --rpc-url $BASE_RPC_URL \
  --estimate-gas

# Estimate gas for specific function
forge estimate \
  --rpc-url $BASE_RPC_URL \
  --contract ScoreCheckerUpgradeableV2 \
  --function calculateReputation \
  --args 0x1234567890123456789012345678901234567890
```

## 🔍 **Verification & Auditing**

### **Contract Verification**
```bash
# Verify on BaseScan
forge verify-contract \
  --chain-id 8453 \
  --compiler-version 0.8.19 \
  --constructor-args \
  $CONTRACT_ADDRESS \
  $CONSTRUCTOR_ARGS

# Verify with flattened source
forge verify-contract \
  --chain-id 8453 \
  --compiler-version 0.8.19 \
  --flatten \
  $CONTRACT_ADDRESS
```

### **Security Audits**
- **Static Analysis**: Slither, Mythril
- **Formal Verification**: Certora, Echidna
- **Manual Review**: Security experts
- **Penetration Testing**: White-hat hackers

### **Audit Tools**
```bash
# Install Slither
pip install slither-analyzer

# Run Slither analysis
slither .

# Install Mythril
pip install mythril

# Run Mythril analysis
myth analyze src/ScoreCheckerUpgradeableV2.sol
```

## 📈 **Monitoring & Analytics**

### **Event Monitoring**
```solidity
// Comprehensive event logging
event ReputationCalculated(
    address indexed user,
    uint256 indexed score,
    uint256 timestamp,
    bytes32 indexed algorithm
);

event BadgeMinted(
    address indexed user,
    uint256 indexed badgeId,
    uint256 timestamp
);

event ContractUpgraded(
    address indexed implementation,
    uint256 timestamp
);
```

### **Analytics Integration**
```typescript
// Event parsing for analytics
interface ReputationEvent {
  user: string;
  score: number;
  timestamp: number;
  algorithm: string;
  blockNumber: number;
  transactionHash: string;
}

// Parse events from blockchain
const parseReputationEvents = async (fromBlock: number) => {
  const events = await contract.queryFilter(
    contract.filters.ReputationCalculated(),
    fromBlock
  );
  
  return events.map(event => ({
    user: event.args.user,
    score: event.args.score.toNumber(),
    timestamp: event.args.timestamp.toNumber(),
    algorithm: event.args.algorithm,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
  }));
};
```

## 🚨 **Emergency Procedures**

### **Emergency Pause**
```solidity
// Emergency pause functionality
function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
    paused = true;
    emit EmergencyPaused(msg.sender, block.timestamp);
}

// Emergency unpause
function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
    paused = false;
    emit EmergencyUnpaused(msg.sender, block.timestamp);
}
```

### **Data Recovery**
```solidity
// Emergency data export
function emergencyExportData(address user) external view returns (bytes memory) {
    require(hasRole(EMERGENCY_ROLE, msg.sender), "Access denied");
    
    ReputationData memory data = userReputations[user];
    return abi.encode(data);
}

// Emergency data import
function emergencyImportData(
    address user,
    bytes calldata data
) external onlyRole(EMERGENCY_ROLE) {
    ReputationData memory importedData = abi.decode(data, (ReputationData));
    userReputations[user] = importedData;
    
    emit EmergencyDataImported(user, block.timestamp);
}
```

## 📚 **Additional Resources**

### **Documentation**
- [Smart Contract Architecture](docs/architecture.md)
- [Security Guidelines](docs/security.md)
- [Deployment Guide](docs/deployment.md)
- [Testing Guide](docs/testing.md)

### **External Dependencies**
- [OpenZeppelin](https://openzeppelin.com/) - Security framework
- [Foundry](https://getfoundry.sh/) - Development framework
- [Base Network](https://base.org/) - L2 network

### **Development Tools**
- [Hardhat](https://hardhat.org/) - Alternative development framework
- [Remix](https://remix.ethereum.org/) - Online IDE
- [Tenderly](https://tenderly.co/) - Debugging and monitoring

## 🤝 **Contributing**

Please read our [Contributing Guide](../docs/contributing.md) before submitting changes.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**For more information, visit our [main documentation](../docs/README.md).**
