# Changelog

All notable changes to BaseBadge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- FastAPI backend with scoring endpoints
- Wallet data integration with external APIs
- Environment variable configuration
- Basic documentation and setup guides

### Changed
- Moved API keys to environment variables for security
- Updated all comments to English
- Improved code structure and organization

### Security
- Removed hardcoded API keys from source code
- Added comprehensive .gitignore file
- Implemented environment variable configuration
- Added security policy and guidelines

## [0.1.0] - 2024-12-19

### Added
- Initial release of BaseBadge backend
- Core scoring algorithm implementation
- Integration with Blockscout API for transaction data
- Integration with Zerion API for portfolio data
- Basic FastAPI endpoints for wallet scoring
- Pydantic models for data validation
- Placeholder implementations for Telegram bot and alerts
- Comprehensive documentation and setup guides

### Technical Details
- Python 3.8+ compatibility
- FastAPI framework for REST API
- Pydantic for data validation
- Environment variable configuration
- Modular architecture for easy extension

### Documentation
- README.md with project overview and setup instructions
- API documentation with example responses
- Contributing guidelines
- Security policy
- Environment configuration guide

---

## Version History

- **0.1.0**: Initial release with core functionality
- **Unreleased**: Security improvements and documentation updates

## Notes

- This project is actively developed for the Onchain Summer competition
- All API keys are now managed through environment variables
- Security is a top priority for all future releases
- Community contributions are welcome and encouraged 