# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-02

### Added
- Rate limiting middleware to protect API from abuse
  - General rate limit: 60 requests per minute (1 req/sec average) for all endpoints
  - Strict rate limit: 10 requests per minute for PDF processing endpoint
  - Rate limit headers in responses (`RateLimit-*`)
  - Health check endpoint exempted from rate limiting
  - Clear error messages when limits are exceeded

### Security
- Enhanced API protection against DoS attacks and abuse

## [1.0.1] - 2025-08-02

### Fixed
- Minor bug fixes and improvements

## [1.0.0] - 2025-08-02

### Added
- Initial release of ISDOC PDF API
- PDF upload and ISDOC data extraction functionality
- Bearer token authentication
- Health check endpoint
- Docker containerization
- Comprehensive test coverage
- CI/CD pipeline with GitHub Actions
- MIT License
