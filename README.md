# BaseBadge 🏆

> **Decentralized Identity & Reputation System on Base Network**

BaseBadge is a comprehensive decentralized identity and reputation management system built on the Base network. It provides users with verifiable credentials, reputation scoring, and social identity features through blockchain technology.

> [!IMPORTANT] Judging Note (Sep 9–13, 2025, CEST)
> During a security-hardening rollout (JWT authentication, nonce management, and rate limiting), **basebadge.com** briefly showed errors/partial functionality.  
> The app has been **stable since Sep 14, 2025** and is currently live at **v0.8.5**.  
> If you visited during that window, please consider a quick re-check now that everything is stable.  
> I can provide deploy logs, timestamps, and commit IDs upon request.
> Contact: **0x0mr0m0@gmail.com** · Site: https://basebadge.com

## 🌟 **Features**

### **Core Features**
- **Decentralized Identity Management** - Self-sovereign identity on Base network
- **Reputation Scoring System** - On-chain reputation with multiple metrics
- **Badge System** - Verifiable credentials and achievements
- **Social Identity** - Connect with other users and build reputation
- **Base Network Integration** - Built on Coinbase's Base L2

### **Advanced Features**
- **Multi-chain Support** - Extensible to other networks
- **API Integration** - RESTful APIs for developers
- **Real-time Updates** - Live dashboard with automatic updates
- **Mobile Responsive** - Works on all devices

### **Coming Soon** 🚧
- **Farcaster Integration** - Social identity on Farcaster network
- **Baseapp Mini App** - Mobile-first experience
- **Advanced Analytics** - Detailed reputation insights
- **Community Features** - Group reputation and governance

## 🏗️ **Architecture**

```
BaseBadge/
├── frontend/          # React.js frontend application
├── backend/           # Node.js/Express backend API
├── onchain/           # Solidity smart contracts
└── docs/             # Project documentation
```

### **Technology Stack**
- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB
- **Blockchain**: Solidity, Foundry, Base Network
- **Infrastructure**: Docker, AWS (planned)

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git
- MetaMask or other Web3 wallet

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/MrM002/BaseBadge.git
cd BaseBadge
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev

# Deploy contracts (in new terminal)
cd onchain && forge build
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Smart Contracts: Deployed on Base network

## 📖 **Documentation**


See our [Documentation Index](DOCUMENTATION_INDEX.md) for complete documentation.

### **Security & Development**
- [Security Policy](SECURITY.md) - Project security policy
- [Contributing Guide](docs/contributing.md) - Guidelines for contributing
- [Security Guidelines](docs/security.md) - Security best practices


## 🔒 **Security**

BaseBadge prioritizes security and follows industry best practices:
- **Smart Contract Audits** - Regular security audits
- **Open Source** - Transparent and verifiable code
- **Multi-signature Wallets** - Secure fund management
- **Regular Updates** - Security patches and improvements

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 **Contact & Community**

- **GitHub**: [MrM002/BaseBadge](https://github.com/MrM002/BaseBadge)
- **Issues & Bugs**: Submit via [GitHub Issues](https://github.com/MrM002/BaseBadge/issues)
- **Security Concerns**: Use [GitHub Security Advisories](https://github.com/MrM002/BaseBadge/security/advisories/new)
 

## 📊 **Project Status**

- **Frontend**: ✅ Production Ready
- **Backend**: ✅ Production Ready  
- **Smart Contracts**: ✅ Production Ready
- **Farcaster Integration**: 🚧 In Development
- **Baseapp Mini App**: 🚧 In Development
- **Advanced Analytics**: 📋 Planned

## 🙏 **Acknowledgments**

- Base Network team for the excellent L2 solution
- Farcaster community for social identity inspiration
- All contributors and community members

---

**Built with ❤️ on Base Network**
