# Worknotes Monorepo (v2.0.0+)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A scalable, multi-platform notes and productivity application built with modern web technologies. This monorepo manages all platform-specific codebases and shared resources in a single repository.

> **Note:** This repository was re-architected in June 2025 to adopt a monorepo structure. See [Migration Guide](#migration-guide) for details.

## 📚 Documentation

- [📖 Architecture](docs/development/architecture.md)
- [🚀 Getting Started](#getting-started)
- [🔧 Development Guide](docs/development/local-development.md)
- [☁️ Deployment Guide](docs/deployment/README.md)
- [📚 API Documentation](docs/api/README.md)
- [🔄 Changelog](CHANGELOG.md)
- [🤝 Contributing](CONTRIBUTING.md)

---

## 🏗️ Monorepo Structure

```
worknotes/
├── web/              # Frontend web app (React + Vite + TypeScript)
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Web app dependencies
│
├── backend/         # Backend services
│   └── supabase/     # Supabase Edge Functions
│       ├── functions/  # Serverless functions
│       └── config.toml # Supabase config
│
├── desktop/         # Desktop app (Electron) - Coming Soon
├── mobile/          # Mobile app (Expo) - Coming Soon
├── shared/          # Shared code between platforms
│   ├── types/       # Shared TypeScript types
│   └── utils/       # Shared utilities
│
├── .github/        # GitHub workflows
├── node_modules/    # Shared dependencies (via workspaces)
├── package.json    # Root package.json (workspaces config)
└── README.md       # This file
```

## ✨ Features

- **Monorepo Architecture**: Unified codebase for all platforms
- **Modern Web Stack**: Built with React 18, Vite, and TypeScript
- **Serverless Backend**: Powered by Supabase Edge Functions
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Progressive Web App (PWA) ready
- **Type Safety**: End-to-end TypeScript support

## 🏆 Re-architecture Highlights

- Migrated from a single web app to a scalable monorepo
- Separated concerns between web, backend, and future platforms
- Implemented workspaces for dependency management
- Improved build and development workflows
- Better code sharing between platforms
- Simplified deployment process

---

## 🔒 Security First

Before you begin, please review our [Security Policy](SECURITY.md) for best practices on handling sensitive information.

### Important Security Notes:
- Never commit sensitive information to version control
- Use environment variables for all configuration
- Follow the principle of least privilege
- Report any security vulnerabilities to security@yourdomain.com

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Supabase CLI (for local development)
- Python 3.7+ (for git-filter-repo if cleaning history)


### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/worknotes.git
cd worknotes

# Install git hooks
npm install husky --save-dev
npm run prepare

# Install git-filter-repo (for history cleaning if needed)
pip install git-filter-repo
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Web App Development

```bash
# Start development server
npm run dev --workspace=web

# Build for production
npm run build --workspace=web

# Preview production build locally
npm run preview --workspace=web
```

### 3. Backend Development

```bash
# Start local Supabase stack
cd backend
supabase start

# Serve functions locally
supabase functions serve --workdir ./backend

# Deploy a function
supabase functions deploy <function-name> --workdir ./backend
```

## 🔧 Environment Setup

### Web App
Create a `.env` file in the `web` directory with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=your-posthog-host
```

### Backend
Create a `.env` file in the `backend` directory with:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for a specific workspace
npm test --workspace=web
```

## 🚀 Deployment

### Web App
Deploy the web app to Netlify, Vercel, or any static hosting service.

### Supabase Functions
Deploy functions using the Supabase CLI:

```bash
cd backend
supabase functions deploy <function-name> --workdir ./backend
```

## 📦 Workspace Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all workspaces in dev mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run format` | Format code across workspaces |

## 🔄 Migration Guide

### From v1.x to v2.0.0

1. **New Project Structure**: The codebase has been reorganized into a monorepo
2. **Updated Dependencies**: All dependencies have been updated to their latest versions
3. **Environment Variables**: Moved to workspace-specific `.env` files
4. **Build System**: Now using Vite instead of Create React App

### Breaking Changes

- Moved all web app code to `/web` directory
- Supabase functions moved to `/backend/supabase/functions`
- Environment variables now use Vite's `VITE_` prefix for client-side usage

## 🔄 Cleaning Git History

If you've accidentally committed sensitive information, follow these steps:

1. Install required tools:
   ```bash
   pip install git-filter-repo
   ```

2. Run the cleanup script:
   ```bash
   ./scripts/clean-git-history.sh
   ```

3. Force push the changes:
   ```bash
   git push origin --force --all
   ```

4. Notify your team about the force push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
  ```
- **Environment:**
  - Place backend secrets in `backend/supabase/.env` if needed.

### 4. Desktop / Mobile / Shared
- **Desktop:** Placeholder scripts for Electron app
- **Mobile:** Placeholder scripts for Expo app
- **Shared:** TypeScript build/watch scripts for shared code

---

## Scripts Overview

- Run any script in a workspace:
  ```sh
  npm run <script> --workspace=<package>
  # Example: npm run build --workspace=shared
  ```

---

## Contributing
- All packages are managed via npm workspaces.
- Add new packages by creating a folder and adding it to the `workspaces` array in the root `package.json`.
- For backend/Supabase development, always use the `--workdir ./backend` flag.

---

## CI/CD & Deployment
- **Netlify:**
  - Build command: `npm run build --workspace=web`
  - Publish directory: `web/dist`
- **Supabase:**
  - Use `--workdir ./backend` for CLI commands.
- **GitHub Actions:**
  - Add workflows under `.github/workflows/` as needed.

---

## Technologies Used
- React, Vite, TypeScript, shadcn-ui, Tailwind CSS (Web)
- Supabase Edge Functions (Backend)
- Electron (Desktop, planned)
- Expo (Mobile, planned)

---

## Maintainers
- [Your Name]

---

## License
MIT
