# Contributing to Nightlife Navigator

Thank you for your interest in contributing to Nightlife Navigator! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Security](#security)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/nightlife-navigator.git`
3. Add the upstream repository: `git remote add upstream https://github.com/original-owner/nightlife-navigator.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- React Native development environment

### Installation
```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

## Making Changes

### Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Performance: `perf/description`
- Security: `security/description`

### Commit Messages
Follow the conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add biometric authentication
fix(profile): resolve avatar upload issue
docs(api): update authentication documentation
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run security tests
npm run test:security
```

### Test Requirements
- All new features must have unit tests
- Bug fixes must include regression tests
- Maintain test coverage above 80%
- All tests must pass before submitting

### Writing Tests
```javascript
// Example test structure
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Test implementation
  });

  afterEach(() => {
    // Cleanup
  });
});
```

## Submitting Changes

### Pull Request Process
1. Update your branch with the latest changes: `git pull upstream main`
2. Run tests and ensure they pass
3. Update documentation if needed
4. Create a pull request with a clear title and description
5. Fill out the pull request template completely
6. Wait for code review and address feedback

### Pull Request Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed

## Code Style

### JavaScript/TypeScript
- Use ES6+ features
- Prefer const/let over var
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow React best practices

### React Native
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines
- Optimize for performance

### File Structure
```
src/
├── components/         # Reusable UI components
├── screens/           # Screen components
├── services/          # API and business logic
├── utils/             # Utility functions
├── contexts/          # React contexts
├── hooks/             # Custom hooks
├── types/             # TypeScript types
└── __tests__/         # Test files
```

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile`)
- Files: camelCase (e.g., `userProfile.js`)
- Functions: camelCase (e.g., `getUserData`)
- Constants: UPPER_CASE (e.g., `API_BASE_URL`)

## Security

### Security Guidelines
- Never commit sensitive data (API keys, passwords)
- Use secure storage for sensitive information
- Validate all user inputs
- Implement proper authentication and authorization
- Follow OWASP security guidelines

### Security Testing
```bash
# Run security audit
npm audit

# Run security tests
npm run test:security

# Check for vulnerabilities
npm run security:check
```

### Reporting Security Issues
Please report security vulnerabilities privately to security@nightlife-navigator.com

## Documentation

### Code Documentation
- Add JSDoc comments for all functions
- Include type information
- Provide usage examples
- Document complex logic

### API Documentation
- Document all API endpoints
- Include request/response examples
- Specify authentication requirements
- Update OpenAPI/Swagger specifications

## Performance

### Performance Guidelines
- Optimize images and assets
- Implement lazy loading
- Minimize bundle size
- Use proper caching strategies
- Profile and monitor performance

### Performance Testing
```bash
# Run performance tests
npm run test:performance

# Analyze bundle size
npm run analyze:bundle

# Run lighthouse audit
npm run lighthouse
```

## Accessibility

### Accessibility Guidelines
- Follow WCAG 2.1 AA standards
- Provide proper semantic markup
- Include alternative text for images
- Ensure keyboard navigation support
- Test with screen readers

### Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Check accessibility compliance
npm run a11y:check
```

## Release Process

### Versioning
We use semantic versioning (SemVer):
- Major version: Breaking changes
- Minor version: New features
- Patch version: Bug fixes

### Release Steps
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to staging
5. Run acceptance tests
6. Deploy to production

## Getting Help

### Resources
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Project Wiki](https://github.com/project/wiki)

### Support Channels
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and general discussion
- Slack: #nightlife-navigator channel
- Email: support@nightlife-navigator.com

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor acknowledgments

Thank you for contributing to Nightlife Navigator! 🎉