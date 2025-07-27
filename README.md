# BaseBadge

**Your Wallet, Your Reputation – Onchain & Beyond**

BaseBadge is a user-centric Web3 platform designed to empower users by providing visibility, control, and gamification over their on-chain identity. It transforms wallet activity into a dynamic reputation system that includes TrustScores, gamified badges, real-time alerts, and secure reputation NFTs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Base Network](https://img.shields.io/badge/Base-Network-orange.svg)](https://base.org/)

<img width="600" height="600" alt="BaseBadge++" src="https://github.com/user-attachments/assets/e8bd49ee-a07f-4774-be0c-a0c1c1163d0f" />

---

## 🚀 Key Features

- **TrustScore System**: Analyze on-chain wallet behavior to assign a reputation score.
- **Gamified Badges**: Users earn badges for positive interactions, achievements, and contributions.
- **Real-Time Alerts**: Notify users of scam NFTs, suspicious approvals, or malicious interactions.
- **Dynamic NFT Profiles**: Mint your Web3 identity as a portable, evolving badge.
- **Social Integration**: Share achievements across social media and boost trust via public visibility.
- **Telegram Bot** (MVP): Lightweight trust-score and alert interaction for mobile users.
- **Appeals & Disputes**: Future plans include the ability to appeal your trust score.
- **Referral & Community Growth**: Invite others and earn social badges.
- **DAO Integration**: Future governance for decentralized reputation scoring.

---

## 🌐 Tech Stack

- **Backend**: Python / FastAPI
- **Blockchain**: Base Network (EVM Compatible)
- **APIs**: Etherscan, Alchemy, Zerion, Blockscout
- **Bot**: Telegram Bot API
- **Smart Contracts**: Solidity + OpenZeppelin (planned)
- **Frontend**: React / Next.js (planned)
- **Database**: PostgreSQL (planned)

---

## 📦 Architecture

```
BaseBadge Backend (FastAPI)
│
├── API Routes (/score/{address}, /wallet/{address})
│
├── Services Layer
│   ├── Trust Engine (Scoring logic)
│   ├── Wallet Data Fetcher
│   └── Alert System
│
├── External APIs
│   ├── Blockscout (Base transactions)
│   ├── Zerion (Portfolio data)
│   ├── Etherscan (Contract data)
│   └── Alchemy (Advanced analytics)
│
└── Telegram Bot (Placeholder)
    └── Trust Score Queries
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- API keys for external services (see `env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/basebadge.git
   cd basebadge
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Run the development server**
   ```bash
   uvicorn backend.backend:app --reload
   ```

5. **Test the API**
   ```bash
   curl http://localhost:8000/score/0x1234567890123456789012345678901234567890
   ```

## 🧭 Roadmap

### ✅ Phase 1: MVP Launch (Current)
- ✅ Backend API with scoring logic
- ✅ Wallet data integration
- 🔄 Telegram bot for TrustScore and alerts
- 🔄 Web dashboard with login + single TrustScore view

### 🚧 Phase 2: Gamification & Sharing
- Badge system with unlockable achievements
- Referral rewards
- Social sharing (Twitter, Discord)

### 🧩 Phase 3: Advanced Modules
- Score dispute system
- Profile dashboard with analytics & charts
- Wallet connect integration
- DAO design & proposal system

### 📱 Phase 4: Growth & Mobile
- Mobile app (React Native)
- Premium AI-powered analytics
- NFT integrations with reputation metadata

<img width="1024" height="1536" alt="RoadMap" src="https://github.com/user-attachments/assets/3de47f90-4fa1-4217-9e45-a53c6b549447" />

---

## 🧠 Learn More

- [What is Wallet Reputation?](https://blog.trava.finance/introduction-to-wallet-reputation-pioneering-feature-in-reputation-tracking-474281641a02)
- [Gamification in Blockchain](https://www.snowball.money/post/why-gamification-is-vital-to-blockchain)
- [Decentralized Identity](https://a16zcrypto.com/posts/article/decentralized-identity-on-chain-reputation/)

---

## 📚 API Documentation

### Endpoints

- `GET /score/{address}` - Get trust score for a wallet address
- `GET /wallet/{address}` - Get detailed wallet data
- `GET /ping` - Health check endpoint

### Example Response
```json
{
  "address": "0x1234...",
  "total_score": 85.5,
  "base_score": 65.2,
  "security_score": 20.3,
  "base": {
    "tx_count": 150,
    "gas_used": 5000000,
    "current_balance": 2.5,
    "past_balance": 1.8,
    "current_streak": 15,
    "max_streak": 45,
    "age_days": 180,
    "base_score": 65.2
  },
  "security": {
    "risky_tokens": 0,
    "risky_contracts": 0,
    "phishing_sites_connected": 0,
    "risky_signs": 0,
    "suspicious_nfts": 0,
    "security_score": 20.3
  }
}
```

## 🤝 Connect with Us

- Devfolio: [Devfolio](https://devfolio.co/projects/basebadge)
- Discord: coming soon
- Telegram: coming soon
- GitHub: you're here!

---

**License**: MIT

BaseBadge is built with ❤️ to make Web3 safer, more transparent, and more fun for everyone.
>>>>>>> a41222f (push in last point for now)
