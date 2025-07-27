# Contributing to BaseBadge

Thank you for your interest in contributing to BaseBadge! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Git
- API keys for external services (see `env.example`)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/basebadge.git
   cd basebadge
   ```

2. **Set up environment**
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

## 📝 How to Contribute

### 1. Reporting Issues
- Use the GitHub issue tracker
- Provide clear description of the problem
- Include steps to reproduce
- Add relevant logs or error messages

### 2. Suggesting Features
- Open a feature request issue
- Describe the use case and benefits
- Consider implementation complexity

### 3. Code Contributions

#### Pull Request Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

#### Code Style Guidelines
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings for functions and classes
- Keep functions small and focused
- Write tests for new functionality

### 4. Documentation
- Update README.md if needed
- Add docstrings to new functions
- Update API documentation

## 🧪 Testing

### Running Tests
```bash
cd backend
python -m pytest tests/
```

### Writing Tests
- Create test files in `tests/` directory
- Use descriptive test names
- Test both success and failure cases
- Mock external API calls

## 🔒 Security

### Reporting Security Issues
- **DO NOT** open a public issue for security vulnerabilities
- Email security issues to: [security@basebadge.com](mailto:security@basebadge.com)
- Include detailed description and steps to reproduce

### Security Guidelines
- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OWASP security guidelines

## 📋 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Respect different viewpoints

### Enforcement
- Unacceptable behavior will not be tolerated
- Violations may result in temporary or permanent ban
- Report violations to project maintainers

## 🏷️ License

By contributing to BaseBadge, you agree that your contributions will be licensed under the MIT License.

## 🙏 Acknowledgments

- Thank you for contributing to BaseBadge!
- Your contributions help make Web3 safer and more transparent
- We appreciate your time and effort

---

**Note**: This is a work in progress. Guidelines may be updated as the project evolves. 