# Contributing to Worknotes

First off, thanks for taking the time to contribute! 🎉 We're excited to have you on board.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up the Project](#setting-up-the-project)
- [Development Workflow](#development-workflow)
  - [Branch Naming](#branch-naming)
  - [Making Changes](#making-changes)
  - [Testing](#testing)
  - [Committing Changes](#committing-changes)
  - [Pull Requests](#pull-requests)
- [Code Style](#code-style)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [License](#license)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Supabase CLI (for backend development)

### Setting Up the Project

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/worknotes.git
   cd worknotes
   ```
3. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```
4. **Set up environment variables** (see README for details)
5. **Start the development server**:
   ```bash
   npm run dev --workspace=web
   ```

## Development Workflow

### Branch Naming

Use the following prefixes for branch names:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `style/` - Code style/formatting
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Example: `feat/add-dark-mode`

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes following the code style
3. Add tests if applicable
4. Run tests and verify everything works

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests for a specific workspace
npm test --workspace=web
```

### Committing Changes

We use [Conventional Commits](https://www.conventionalcommits.org/). Example commit messages:

```
feat(auth): add password reset functionality
fix(ui): correct button alignment in mobile view
docs: update README with new setup instructions
```

### Pull Requests

1. Push your changes to your fork:
   ```bash
   git push origin your-branch-name
   ```
2. Open a Pull Request against the `main` branch
3. Fill out the PR template with details about your changes
4. Request reviews from maintainers

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Write meaningful commit messages

## Reporting Issues

When creating an issue, please include:

1. A clear title and description
2. Steps to reproduce the issue
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser/OS version if relevant

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Explain why this feature would be valuable
3. Include any relevant examples or mockups

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
