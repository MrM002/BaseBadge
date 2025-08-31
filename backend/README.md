# BaseBadge Backend 🚀

> **Node.js/Express.js Backend API Server**

## 📋 **Overview**

The BaseBadge backend is a robust Node.js/Express.js API server that provides reputation scoring, user management, and blockchain integration services. It serves as the central hub for all backend operations and data processing.

## 🏗️ **Architecture**

```
Backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── tests/               # Test files
├── docs/                # API documentation
└── scripts/             # Utility scripts
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- MongoDB (local or cloud)
- Environment variables configured

### **Installation**

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**
```bash
npm run dev
```

4. **Start production server**
```bash
npm start
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/basebadge
MONGODB_DB=basebadge

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Blockchain Configuration
BASE_RPC_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=your-etherscan-key
ALCHEMY_API_KEY=your-alchemy-key

# External APIs
ZERION_API_KEY=your-zerion-key
BLOCKSCOUT_API_URL=https://base.blockscout.com
```

### **Database Setup**
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env
```

## 📚 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### **User Endpoints**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `DELETE /api/users/:id` - Delete user

### **Reputation Endpoints**
- `GET /api/reputation/:address` - Get reputation score
- `POST /api/reputation/calculate` - Calculate new score
- `GET /api/reputation/history/:address` - Get score history
- `PUT /api/reputation/update` - Update reputation

### **Badge Endpoints**
- `GET /api/badges` - Get all badges
- `GET /api/badges/:id` - Get badge by ID
- `POST /api/badges` - Create new badge
- `PUT /api/badges/:id` - Update badge
- `DELETE /api/badges/:id` - Delete badge

### **Blockchain Endpoints**
- `GET /api/blockchain/balance/:address` - Get wallet balance
- `GET /api/blockchain/transactions/:address` - Get transactions
- `GET /api/blockchain/contracts/:address` - Get contract info
- `POST /api/blockchain/verify` - Verify on-chain data

## 🔒 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- SQL injection prevention

### **Data Protection**
- Password hashing (bcrypt)
- HTTPS enforcement
- CORS configuration
- Helmet.js security headers
- Request sanitization

### **API Security**
- API key validation
- Request throttling
- IP whitelisting
- Audit logging
- Error handling

## 📊 **Performance Optimization**

### **Caching Strategy**
- Redis caching for frequently accessed data
- In-memory caching for session data
- Database query optimization
- Response compression

### **Database Optimization**
- Index optimization
- Query optimization
- Connection pooling
- Data pagination

### **API Optimization**
- Response caching
- Request batching
- Async processing
- Load balancing ready

## 🧪 **Testing**

### **Test Structure**
```bash
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### **Test Coverage**
- **Target**: 90%+ coverage
- **Current**: 85%
- **Focus Areas**: Core services, API endpoints

## 📈 **Monitoring & Logging**

### **Logging**
- Winston logger configuration
- Structured logging
- Log levels (error, warn, info, debug)
- Log rotation and archiving

### **Monitoring**
- Health check endpoints
- Performance metrics
- Error tracking
- Resource usage monitoring

### **Metrics**
- Request/response times
- Error rates
- Database performance
- Memory usage

## 🚀 **Deployment**

### **Development**
```bash
npm run dev          # Start with nodemon
npm run build        # Build for production
npm run start        # Start production server
```

### **Production**
```bash
# Using PM2
pm2 start ecosystem.config.js

# Using Docker
docker build -t basebadge-backend .
docker run -p 5000:5000 basebadge-backend
```

### **Environment Setup**
- Production environment variables
- SSL certificate configuration
- Load balancer setup
- Database clustering

## 🔧 **Development Workflow**

### **Code Standards**
- ESLint configuration
- Prettier formatting
- Git hooks (husky)
- Commit message standards

### **Branch Strategy**
- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### **Code Review Process**
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to develop

## 📚 **Additional Resources**

### **Documentation**
- [API Reference](docs/api-reference.md)
- [Security Guidelines](docs/security.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

### **External Dependencies**
- [Express.js](https://expressjs.com/)
- [MongoDB](https://mongodb.com/)
- [JWT](https://jwt.io/)
- [Winston](https://github.com/winstonjs/winston)

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
