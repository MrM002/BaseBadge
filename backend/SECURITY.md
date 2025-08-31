# Backend Security Documentation 🔒

> **Security Guidelines, Best Practices & Implementation Details**

## 🛡️ **Security Overview**

The BaseBadge backend implements a comprehensive security framework to protect user data, prevent unauthorized access, and ensure system integrity. This document outlines our security measures, best practices, and implementation details.

## 🔐 **Authentication & Authorization**

### **JWT Implementation**
```javascript
// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256',
  issuer: 'basebadge',
  audience: 'basebadge-users'
};

// Token Generation
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    jwtConfig.secret,
    { 
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
};
```

### **Password Security**
```javascript
// Password Hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password Validation
const validatePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Password Requirements
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};
```

### **Role-Based Access Control (RBAC)**
```javascript
// User Roles
const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Permission Levels
const PERMISSIONS = {
  READ_PROFILE: 'read_profile',
  UPDATE_PROFILE: 'update_profile',
  DELETE_PROFILE: 'delete_profile',
  MANAGE_USERS: 'manage_users',
  MANAGE_SYSTEM: 'manage_system'
};

// Authorization Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
```

## 🚫 **Input Validation & Sanitization**

### **Request Validation**
```javascript
// Joi Schema Validation
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required()
});

// Validation Middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    next();
  };
};
```

### **SQL Injection Prevention**
```javascript
// Parameterized Queries
const getUserById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  const [rows] = await db.execute(query, [id]);
  return rows[0];
};

// Input Sanitization
const sanitizeInput = (input) => {
  return validator.escape(validator.trim(input));
};
```

### **XSS Prevention**
```javascript
// Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.basebadge.xyz"]
  }
}));

// XSS Protection Headers
app.use(helmet.xssFilter());
```

## 🌐 **API Security**

### **Rate Limiting**
```javascript
// Rate Limiter Configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to all routes
app.use(rateLimiter);

// Stricter limits for auth routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts'
});

app.use('/api/auth', authRateLimiter);
```

### **CORS Configuration**
```javascript
// CORS Settings
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### **API Key Authentication**
```javascript
// API Key Validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Apply to protected routes
app.use('/api/admin', validateApiKey);
```

## 🔒 **Data Protection**

### **Encryption**
```javascript
// Data Encryption
const encryptData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
};

// Data Decryption
const decryptData = (encryptedData) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

### **Sensitive Data Handling**
```javascript
// PII Data Masking
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

const maskPhone = (phone) => {
  return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
};

// Secure Data Logging
const secureLog = (message, data) => {
  const sanitizedData = {
    ...data,
    email: maskEmail(data.email),
    phone: maskPhone(data.phone),
    password: '[REDACTED]'
  };
  
  logger.info(message, sanitizedData);
};
```

## 🚨 **Security Monitoring**

### **Audit Logging**
```javascript
// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Audit Logging Middleware
const auditLog = (action, resource) => {
  return (req, res, next) => {
    const auditEntry = new AuditLog({
      userId: req.user?.id,
      action,
      resource,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    auditEntry.save();
    next();
  };
};
```

### **Security Headers**
```javascript
// Security Headers Configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.basebadge.xyz"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## 🔍 **Vulnerability Management**

### **Security Scanning**
```bash
# Dependency Vulnerability Scanning
npm audit

# Code Security Scanning
npm run security:scan

# Container Security Scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image basebadge-backend:latest
```

### **Security Testing**
```javascript
// Security Test Examples
describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/users')
      .send({ username: maliciousInput });
    
    expect(response.status).toBe(400);
  });
  
  test('should prevent XSS attacks', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/users')
      .send({ bio: maliciousInput });
    
    expect(response.body.bio).not.toContain('<script>');
  });
});
```

## 📋 **Security Checklist**

### **Development Phase**
- [ ] Input validation implemented
- [ ] Output sanitization configured
- [ ] Authentication system tested
- [ ] Authorization rules verified
- [ ] Security headers configured
- [ ] CORS settings reviewed
- [ ] Rate limiting implemented
- [ ] Error handling secured

### **Testing Phase**
- [ ] Security tests written
- [ ] Vulnerability scanning completed
- [ ] Penetration testing performed
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing completed

### **Deployment Phase**
- [ ] Environment variables secured
- [ ] SSL certificates configured
- [ ] Firewall rules applied
- [ ] Monitoring configured
- [ ] Backup systems tested
- [ ] Incident response plan ready

## 🚨 **Incident Response**

### **Security Incident Types**
1. **Data Breach** - Unauthorized access to user data
2. **Authentication Bypass** - Circumvention of auth systems
3. **API Abuse** - Excessive or malicious API usage
4. **DDoS Attack** - Distributed denial of service
5. **Malware Infection** - Malicious software detection

### **Response Procedures**
1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation**
   - Analyze logs and data
   - Identify root cause
   - Assess impact scope

3. **Remediation**
   - Fix vulnerabilities
   - Restore systems
   - Implement preventive measures

4. **Communication**
   - Notify stakeholders
   - Update users if necessary
   - Document lessons learned

## 📚 **Security Resources**

### **Documentation**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)

### **Tools**
- [Helmet.js](https://helmetjs.github.io/) - Security middleware
- [Joi](https://joi.dev/) - Schema validation
- [bcrypt](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [Winston](https://github.com/winstonjs/winston) - Logging

### **Training**
- Security awareness training for developers
- Regular security workshops
- Code review best practices
- Incident response drills

---

**This security documentation is regularly updated to reflect current threats and best practices.**
