# BaseBadge Deployment Guide

> **Last Updated: August 30, 2025**

This guide provides instructions for deploying the BaseBadge application to production environments.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Git
- Docker (optional)
- Access to deployment environment (AWS, Vercel, etc.)
- Base Network RPC access

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MrM002/BaseBadge.git
cd BaseBadge
```

### 2. Environment Variables

Create environment files for each component:

#### Backend (.env)

```
# Server Configuration
PORT=8081
NODE_ENV=production

# Base Network Configuration
BASE_RPC_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=your-etherscan-key
CHAIN_ID=8453

# Contract Addresses
SCORE_CHECKER_V2_ADDRESS=your-contract
SCORE_CHECKER_V2_IMPLEMENTATION=your-imp

# Security
AUTHORIZED_SIGNER_PRIVATE_KEY=your-private-key
AUTHORIZED_SIGNER_ADDRESS=0xBC17B9198B04521C824A0B99Db452214f773835B
```

#### Frontend (.env.local)

```
# API Configuration
NEXT_PUBLIC_API_URL=https://api.basebadge.com

# Web3 Configuration
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_SCORE_CHECKER_ADDRESS=0x461203d7137FdFA30907288656dBEB0f64408Fb9
```

## Backend Deployment

### Option 1: Standard Deployment

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Start the server:
   ```bash
   python -m uvicorn backend.backend:app --host 0.0.0.0 --port 8081
   ```

### Option 2: Docker Deployment

1. Build the Docker image:
   ```bash
   cd backend
   docker build -t basebadge-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 8081:8081 --env-file .env basebadge-backend
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   cd frontend
   vercel --prod
   ```

### Option 2: Standard Build

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## Smart Contract Deployment

Smart contracts are already deployed to the Base Network. If you need to deploy updated contracts:

1. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Deploy contracts:
   ```bash
   cd onchain
   forge script script/DeployScoreCheckerV2.s.sol --rpc-url $BASE_RPC_URL --private-key $PRIVATE_KEY --broadcast
   ```

## Post-Deployment Verification

### Backend Verification

1. Check API health:
   ```bash
   curl https://api.basebadge.com/stats
   ```

2. Verify on-chain data access:
   ```bash
   curl https://api.basebadge.com/onchain/score?address=0x1234...
   ```

### Frontend Verification

1. Access the frontend application
2. Connect wallet
3. View dashboard
4. Check score card functionality

### Smart Contract Verification

1. Verify contract on Base Explorer:
   ```bash
   forge verify-contract --chain-id 8453 --compiler-version 0.8.20 $CONTRACT_ADDRESS src/ScoreCheckerUpgradeableV2.sol:ScoreCheckerUpgradeable
   ```

## Monitoring and Maintenance

### Monitoring

- Set up application monitoring (e.g., Datadog, New Relic)
- Configure error alerting
- Monitor RPC endpoint availability
- Track contract interactions

### Maintenance

- Regular dependency updates
- Security patches
- Performance optimization
- Database backups

## Troubleshooting

### Common Issues

1. **RPC Connection Issues**
   - Check Base Network status
   - Verify RPC URL configuration
   - Consider using fallback RPC providers

2. **Contract Interaction Failures**
   - Verify contract addresses
   - Check ABI compatibility
   - Ensure proper signature generation

3. **API Errors**
   - Check server logs
   - Verify environment variables
   - Test API endpoints directly

## Security Considerations

- Regularly rotate API keys
- Monitor for suspicious activity
- Keep dependencies updated
- Follow security best practices

## Backup and Recovery

- Implement regular database backups
- Document recovery procedures
- Test recovery process

## Support

For deployment assistance, contact:
- Technical Support: 0x0mr0m0@gmail.com
- Development Team: 0x0mr0m0@gmail.com
