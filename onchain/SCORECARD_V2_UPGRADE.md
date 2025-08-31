# ScoreCard V2 Upgrade Guide

## Overview

This document describes the upgrade from ScoreChecker V1 to V2, which introduces complete scorecard data storage onchain. The new version stores all Base Metrics, Security Analysis, and other scorecard components directly on the blockchain.

## What's New in V2

### 1. Complete Scorecard Data Structure

The new `UserScoreCard` struct includes:

```solidity
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
```

### 2. New Functions

- `submitScoreCard()` - Submit complete scorecard data
- `getScoreCard()` - Retrieve complete scorecard data
- Enhanced EIP-712 signature verification for scorecard data

### 3. Backward Compatibility

- All V1 functions remain functional
- Legacy `UserData` structure is maintained
- Existing data is preserved during upgrades

## Deployment Options

### Option 1: Fresh Deployment (Recommended for new projects)

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# Deploy to Base Sepolia
forge script script/DeployScoreCheckerV2.s.sol:DeployScoreCheckerV2 \
    --rpc-url $BASE_SEPOLIA_RPC \
    --broadcast \
    --verify
```

### Option 2: Upgrade Existing Contract

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export PROXY_ADDRESS="existing_proxy_address"
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# Upgrade to V2
forge script script/UpgradeToV2.s.sol:UpgradeToV2 \
    --rpc-url $BASE_SEPOLIA_RPC \
    --broadcast \
    --verify
```

## Testing

### Run Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-contract ScoreCheckerV2Test

# Run with verbose output
forge test -vvv
```

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Generate coverage report with HTML output
forge coverage --report html
```

## Usage Examples

### Frontend Integration

```typescript
// Example of calling submitScoreCard
const submitScoreCard = async (scoreData: ScoreCardData) => {
    const signature = await createScoreCardSignature(scoreData);
    
    const tx = await contract.submitScoreCard(
        scoreData.totalScore,
        scoreData.baseScore,
        scoreData.securityScore,
        scoreData.numberOfTransactions,
        scoreData.currentStreak,
        scoreData.maxStreak,
        scoreData.currentBalance,
        scoreData.avgBalanceLastMonth,
        scoreData.gasPaid,
        scoreData.suspiciousTokens,
        scoreData.suspiciousContracts,
        scoreData.dangerousInteractions,
        scoreData.suspiciousOilCompanies,
        scoreData.issuedAt,
        scoreData.nonce,
        signature,
        { value: await contract.checkFee() }
    );
    
    return await tx.wait();
};

// Example of retrieving scorecard data
const getScoreCard = async (userAddress: string) => {
    const scorecard = await contract.getScoreCard(userAddress);
    
    return {
        totalScore: scorecard.totalScore,
        baseScore: scorecard.baseScore,
        securityScore: scorecard.securityScore,
        numberOfTransactions: scorecard.numberOfTransactions,
        currentStreak: scorecard.currentStreak,
        maxStreak: scorecard.maxStreak,
        currentBalance: scorecard.currentBalance,
        avgBalanceLastMonth: scorecard.avgBalanceLastMonth,
        gasPaid: scorecard.gasPaid,
        suspiciousTokens: scorecard.suspiciousTokens,
        suspiciousContracts: scorecard.suspiciousContracts,
        dangerousInteractions: scorecard.dangerousInteractions,
        suspiciousOilCompanies: scorecard.suspiciousOilCompanies,
        lastCheckTime: scorecard.lastCheckTime,
        lastIssuedAt: scorecard.lastIssuedAt
    };
};
```

### Backend Integration

```python
# Example of creating EIP-712 signature for scorecard
def create_scorecard_signature(scorecard_data, private_key):
    # Define the EIP-712 domain
    domain = {
        'name': 'BaseBadgeScore',
        'version': '2',
        'chainId': 84532,  # Base Sepolia
        'verifyingContract': contract_address
    }
    
    # Define the scorecard types
    types = {
        'ScoreCard': [
            {'name': 'user', 'type': 'address'},
            {'name': 'totalScore', 'type': 'uint256'},
            {'name': 'baseScore', 'type': 'uint256'},
            {'name': 'securityScore', 'type': 'uint256'},
            {'name': 'numberOfTransactions', 'type': 'uint256'},
            {'name': 'currentStreak', 'type': 'uint256'},
            {'name': 'maxStreak', 'type': 'uint256'},
            {'name': 'currentBalance', 'type': 'uint256'},
            {'name': 'avgBalanceLastMonth', 'type': 'uint256'},
            {'name': 'gasPaid', 'type': 'uint256'},
            {'name': 'suspiciousTokens', 'type': 'uint256'},
            {'name': 'suspiciousContracts', 'type': 'uint256'},
            {'name': 'dangerousInteractions', 'type': 'uint256'},
            {'name': 'suspiciousOilCompanies', 'type': 'uint256'},
            {'name': 'issuedAt', 'type': 'uint256'},
            {'name': 'nonce', 'type': 'uint256'}
        ]
    }
    
    # Create the message
    message = {
        'user': user_address,
        'totalScore': scorecard_data['totalScore'],
        'baseScore': scorecard_data['baseScore'],
        'securityScore': scorecard_data['securityScore'],
        'numberOfTransactions': scorecard_data['numberOfTransactions'],
        'currentStreak': scorecard_data['currentStreak'],
        'maxStreak': scorecard_data['maxStreak'],
        'currentBalance': scorecard_data['currentBalance'],
        'avgBalanceLastMonth': scorecard_data['avgBalanceLastMonth'],
        'gasPaid': scorecard_data['gasPaid'],
        'suspiciousTokens': scorecard_data['suspiciousTokens'],
        'suspiciousContracts': scorecard_data['suspiciousContracts'],
        'dangerousInteractions': scorecard_data['dangerousInteractions'],
        'suspiciousOilCompanies': scorecard_data['suspiciousOilCompanies'],
        'issuedAt': scorecard_data['issuedAt'],
        'nonce': scorecard_data['nonce']
    }
    
    # Sign the message
    signable_message = encode_structured_data(domain, types, message)
    signature = private_key.sign_msg(signable_message)
    
    return signature
```

## Gas Optimization

### Struct Packing

The `UserScoreCard` struct is optimized for gas efficiency:

- `uint128` for scores and balances (sufficient for most use cases)
- `uint64` for timestamps and transaction counts
- `uint32` for smaller metrics like streaks and counts

### Storage Layout

```solidity
// Slot 0: totalScore (16 bytes) + baseScore (16 bytes)
// Slot 1: securityScore (16 bytes) + numberOfTransactions (8 bytes) + currentStreak (4 bytes) + maxStreak (4 bytes)
// Slot 2: currentBalance (16 bytes) + avgBalanceLastMonth (16 bytes)
// Slot 3: gasPaid (16 bytes) + suspiciousTokens (4 bytes) + suspiciousContracts (4 bytes) + dangerousInteractions (4 bytes) + suspiciousOilCompanies (4 bytes)
// Slot 4: lastCheckTime (8 bytes) + lastIssuedAt (8 bytes)
```

## Security Considerations

### 1. Access Control

- Only the owner can upgrade the contract
- Only the owner can change the authorized signer
- Only the owner can withdraw fees

### 2. Signature Verification

- EIP-712 compliant signatures
- Configurable signature age limits
- Nonce-based replay protection

### 3. Rate Limiting

- Configurable minimum intervals between submissions
- Prevents spam and abuse

## Migration Guide

### From V1 to V2

1. **Deploy V2 Implementation**: Use the upgrade script to deploy the new implementation
2. **Update Frontend**: Modify frontend code to use new `submitScoreCard` function
3. **Update Backend**: Modify backend signature creation to include all scorecard data
4. **Test Thoroughly**: Ensure all functionality works as expected
5. **Monitor**: Watch for any issues during the transition

### Data Migration

- Existing V1 data is automatically preserved
- New submissions will populate both V1 and V2 data structures
- Gradual migration is possible

## Mainnet Deployment Checklist

### Pre-Deployment

- [ ] Complete testing on Base Sepolia
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Documentation updated
- [ ] Team training completed

### Deployment

- [ ] Deploy to Base Mainnet
- [ ] Verify contract on BaseScan
- [ ] Initialize with production parameters
- [ ] Test all functions on mainnet
- [ ] Monitor for issues

### Post-Deployment

- [ ] Update frontend to use mainnet contract
- [ ] Update backend to use mainnet contract
- [ ] Monitor gas usage and performance
- [ ] Collect user feedback
- [ ] Plan future upgrades

## Support

For questions or issues:

1. Check the test files for usage examples
2. Review the contract code and comments
3. Open an issue in the project repository
4. Contact the development team

## License

MIT License - see LICENSE file for details.
