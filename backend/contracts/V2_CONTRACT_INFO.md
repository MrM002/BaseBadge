# ScoreChecker V2 Contract Information

## Production Contract (Base Mainnet)
- **Address**: `0x461203d7137FdFA30907288656dBEB0f64408Fb9`
- **Implementation**: `0x97AE9F69f01D2BAe2Fd8F9F3B0B9603ca792f6b7`
- **Chain ID**: 8453
- **Network**: Base Mainnet

## Key Functions for Reading On-Chain Data

### `getScore(address user)` 
Returns `(uint256 score, uint256 timestamp)`
- Simple score retrieval for a user address

### `getScoreCard(address user)`
Returns detailed score card with 15 values:
1. totalScore
2. baseScore
3. securityScore
4. numberOfTransactions
5. currentStreak
6. maxStreak
7. currentBalance
8. avgBalanceLastMonth
9. gasPaid
10. suspiciousTokens
11. suspiciousContracts
12. dangerousInteractions
13. suspiciousNfts (index 12, not OilCompanies)
14. lastCheckTime
15. lastIssuedAt

## Important Notes
- Always use V2 contract for reading/writing scores
- All score data must come from on-chain after a transaction
- No fallback to backend calculations for production data
