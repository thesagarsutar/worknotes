# Local Development Guide

This guide will help you set up a local development environment for Worknotes.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- Supabase CLI (for backend development)
- A code editor (VS Code recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/worknotes.git
cd worknotes
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Set Up Environment Variables

Create the following `.env` files with the appropriate values:

#### Web App (web/.env)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=your-posthog-host
```

#### Backend (backend/.env)
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Start Development Servers

#### Web App
```bash
# Start the development server
npm run dev --workspace=web
```

The web app will be available at `http://localhost:3000`

#### Backend (Supabase)
```bash
# Start Supabase services
cd backend
supabase start

# In a separate terminal, serve functions
supabase functions serve
```

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific workspace
npm test --workspace=web

# Run tests in watch mode
npm test --workspace=web -- --watch
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check TypeScript types
npm run typecheck --workspace=web
```

### Working with Database

1. Access the Supabase dashboard:
   ```bash
   supabase db reset
   ```
2. Make schema changes in `supabase/migrations/`
3. Create a new migration:
   ```bash
   supabase migration new migration_name
   ```

## Debugging

### Web App
- Use React DevTools and Redux DevTools extensions
- Check browser console for errors
- Use `console.log()` or debugger statements

### Backend
- Check Supabase logs:
  ```bash
  supabase logs
  ```
- Use `console.log()` in functions
- Check Deno console output

## Troubleshooting

### Common Issues

1. **Dependency Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

2. **Supabase Not Starting**
   - Ensure Docker is running
   - Try `supabase stop` then `supabase start`

3. **Port Conflicts**
   - Check for other services using ports 3000, 54321, etc.
   - Update ports in `supabase/config.toml` if needed

## IDE Setup

### VS Code Extensions
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Supabase
- Deno

### Recommended Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

- Read the [Architecture Overview](./architecture.md)
- Check out the [API Documentation](../api/README.md)
- Review the [Deployment Guide](../deployment/README.md)
