# Contributing to Jemea Bot

Thank you for your interest in contributing to Jemea Bot! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [contact@jemeabot.com](mailto:contact@jemeabot.com).

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a new branch** for your feature or bugfix
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MySQL 8.0 or higher
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/jemea-bot.git
   cd jemea-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Start the bot** (in a separate terminal)
   ```bash
   npm run bot
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes** - Fix issues and bugs
- **New features** - Add new functionality
- **Documentation** - Improve documentation
- **Tests** - Add or improve test coverage
- **Performance** - Optimize existing code
- **Security** - Fix security vulnerabilities

### Before You Start

1. **Check existing issues** - Look for existing issues or discussions
2. **Create an issue** - For significant changes, create an issue first
3. **Discuss changes** - Get feedback before implementing major changes
4. **Check the roadmap** - See what's planned for future releases

## Pull Request Process

### Before Submitting

1. **Run tests** - Ensure all tests pass
   ```bash
   npm test
   ```

2. **Run linting** - Fix any linting issues
   ```bash
   npm run lint
   npm run lint:fix
   ```

3. **Type checking** - Ensure TypeScript compiles without errors
   ```bash
   npm run type-check
   ```

4. **Build check** - Ensure the project builds successfully
   ```bash
   npm run build
   ```

### Pull Request Template

When creating a pull request, please include:

- **Clear title** - Descriptive title of the changes
- **Description** - Detailed description of what was changed and why
- **Type** - Bug fix, feature, documentation, etc.
- **Testing** - How the changes were tested
- **Screenshots** - For UI changes
- **Breaking changes** - Any breaking changes and migration steps

### Review Process

1. **Automated checks** - CI/CD pipeline runs automatically
2. **Code review** - At least one maintainer reviews the code
3. **Testing** - Changes are tested in staging environment
4. **Approval** - Maintainer approves the changes
5. **Merge** - Changes are merged to the main branch

## Issue Guidelines

### Bug Reports

When reporting bugs, please include:

- **Clear title** - Brief description of the issue
- **Description** - Detailed description of the problem
- **Steps to reproduce** - Exact steps to reproduce the issue
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment** - OS, Node.js version, browser, etc.
- **Screenshots** - If applicable
- **Logs** - Relevant error logs

### Feature Requests

When requesting features, please include:

- **Clear title** - Brief description of the feature
- **Description** - Detailed description of the feature
- **Use case** - Why this feature would be useful
- **Proposed solution** - How you think it should work
- **Alternatives** - Other solutions you've considered
- **Additional context** - Any other relevant information

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing code style
- Use strict type checking
- Add proper type annotations
- Use interfaces for object shapes

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### File Organization

- Follow the existing directory structure
- Use descriptive file names
- Group related functionality together
- Keep components in appropriate directories

### Git Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(auth): add user authentication
fix(bot): resolve message sending error
docs(readme): update installation instructions
```

## Testing

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Aim for high test coverage
- Use descriptive test names
- Test both success and error cases

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Test implementation
    });
    
    it('should handle error case', () => {
      // Error test implementation
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=userService.test.ts
```

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Document complex algorithms and business logic
- Keep comments up to date with code changes
- Use clear and concise language

### README Updates

- Update README.md for significant changes
- Add new features to the features list
- Update installation instructions if needed
- Add new environment variables to documentation

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes and messages
- Keep API documentation current

## Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** - Incompatible API changes
- **MINOR** - New functionality in a backwards compatible manner
- **PATCH** - Backwards compatible bug fixes

### Release Steps

1. **Update version** in package.json
2. **Update CHANGELOG.md** with new features and fixes
3. **Create release branch** from main
4. **Run full test suite** and ensure all tests pass
5. **Create pull request** for release
6. **Merge to main** after approval
7. **Create GitHub release** with release notes
8. **Deploy to production** using CI/CD pipeline

## Getting Help

If you need help or have questions:

1. **Check documentation** - Read the README and code comments
2. **Search issues** - Look for similar issues or discussions
3. **Create an issue** - Ask questions or report problems
4. **Join discussions** - Participate in community discussions
5. **Contact maintainers** - Reach out to project maintainers

## Recognition

Contributors will be recognized in:

- **CONTRIBUTORS.md** - List of all contributors
- **Release notes** - Mentioned in relevant releases
- **GitHub contributors** - Automatic recognition on GitHub

## Thank You

Thank you for contributing to Jemea Bot! Your contributions help make this project better for everyone.

---

For more information, please visit our [GitHub repository](https://github.com/your-username/jemea-bot) or contact us at [contact@jemeabot.com](mailto:contact@jemeabot.com).
