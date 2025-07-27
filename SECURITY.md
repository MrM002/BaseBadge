# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

### 🚨 Important: Do NOT open public issues for security vulnerabilities

If you discover a security vulnerability in BaseBadge, please follow these steps:

1. **Email us directly**: [security@basebadge.com](mailto:security@basebadge.com)
2. **Include detailed information**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to expect

- **Response time**: We aim to respond within 48 hours
- **Acknowledgment**: You'll receive confirmation of receipt
- **Updates**: We'll keep you informed of our progress
- **Credit**: Contributors will be credited in security advisories

## Security Best Practices

### For Contributors

1. **Never commit secrets**:
   - API keys
   - Private keys
   - Database credentials
   - Environment variables with sensitive data

2. **Use environment variables**:
   ```python
   # ✅ Good
   api_key = os.getenv("API_KEY")
   
   # ❌ Bad
   api_key = "hardcoded_secret_key"
   ```

3. **Validate inputs**:
   - Always validate user inputs
   - Use Pydantic models for API validation
   - Sanitize data before processing

4. **Follow OWASP guidelines**:
   - Input validation
   - Output encoding
   - Authentication and authorization
   - Secure communication

### For Users

1. **Environment setup**:
   - Copy `env.example` to `.env`
   - Never share your `.env` file
   - Use strong, unique API keys

2. **API key management**:
   - Rotate keys regularly
   - Use different keys for different environments
   - Monitor API usage

3. **Network security**:
   - Use HTTPS in production
   - Implement rate limiting
   - Monitor for suspicious activity

## Security Features

### Current Implementations

- ✅ Environment variable configuration
- ✅ Input validation with Pydantic
- ✅ API key management
- ✅ Secure API endpoints

### Planned Features

- 🔄 Rate limiting
- 🔄 API authentication
- 🔄 Request logging
- 🔄 Security headers
- 🔄 CORS configuration

## Security Contacts

- **Security Team**: [security@basebadge.com](mailto:security@basebadge.com)
- **Project Maintainers**: [maintainers@basebadge.com](mailto:maintainers@basebadge.com)

## Acknowledgments

We thank security researchers and contributors who help us maintain the security of BaseBadge. Your efforts help make Web3 safer for everyone.

---

**Note**: This security policy is a living document and will be updated as the project evolves. 