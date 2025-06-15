# Deployment Guide

This guide covers the deployment process for the Worknotes application across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Web Application](#web-application)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
- [Backend Services](#backend-services)
  - [Supabase](#supabase)
  - [Edge Functions](#edge-functions)
- [Environment Variables](#environment-variables)
- [CI/CD](#cicd)
- [Monitoring](#monitoring)
- [Rollback Procedure](#rollback-procedure)

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase CLI (for backend deployment)
- Accounts on:
  - Netlify/Vercel (for web hosting)
  - Supabase (for backend)
  - GitHub (for source control)

## Environment Setup

### Environment Variables

## Environment Variables Setup

### 1. Netlify (Production Frontend)
Set these in your Netlify project settings (Site settings > Build & deploy > Environment):

| Variable Name | Description |
|--------------|-------------|
| `VITE_APP_NAME` | Your application name |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_POSTHOG_API_KEY` | PostHog API key |
| `VITE_POSTHOG_HOST` | PostHog host URL (e.g., https://us.i.posthog.com) |

### 2. Supabase (Backend & Edge Functions)
Set these in your Supabase project dashboard under Edge Functions > Secrets:

| Variable Name | Description | Required |
|--------------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI completions | Yes |
| `SUPABASE_URL` | Supabase project URL (same as client-side) | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key (same as client-side) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for admin operations | Yes |
| `SUPABASE_DB_URL` | Direct database connection URL | Optional |
| `RESEND_API_KEY` | Resend API key for email services | Optional |

**Note:** The Supabase variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) are automatically available in your Supabase Edge Functions environment. You only need to manually add the external service keys like `GEMINI_API_KEY` and `RESEND_API_KEY`.

### 3. Local Development
Create a `.env` file in the project root with these variables (matching Netlify variables):

```env
# Application
VITE_APP_NAME="Worknotes"
NODE_ENV=development

# Supabase (Client)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# PostHog Analytics
VITE_POSTHOG_API_KEY=your-posthog-api-key
VITE_POSTHOG_HOST=your-posthog-host
```

**Important:** Never commit the `.env` file to version control.

## Web Application

### Netlify

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to your GitHub repository

2. **Build Settings**
   - Base directory: (leave empty)
   - Build command: `cd web && npm install && npm run build`
   - Publish directory: `web/dist`
   - Environment variables: Add all variables from `.env.production`

3. **Deploy**
   - Click "Deploy site"
   - Enable "Auto publish" for automatic deployments

### Vercel

1. **Import Project**
   - Go to [Vercel](https://vercel.com/)
   - Click "Add New" > "Project"
   - Import your GitHub repository

2. **Configure Project**
   - Framework: Vite
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   - Add all variables from `.env.production`
   - Make sure to prefix with `VITE_` for client-side variables

4. **Deploy**
   - Click "Deploy"
   - Enable "Automatically deploy from this branch"

## Backend Services

### Supabase

1. **Create Project**
   - Go to [Supabase](https://app.supabase.com/)
   - Click "New Project"
   - Choose a name, database password, and region
   - Click "Create new project"

2. **Database Setup**
   - Run migrations:
     ```bash
     supabase db push --db-url postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
     ```
   - Enable Row Level Security (RLS) on tables
   - Set up database policies

### Edge Functions

1. **Set Up Gemini API Key**
   - Go to your Supabase project dashboard
   - Navigate to `Edge Functions` > `Secrets`
   - Add a new secret with the key `GEMINI_API_KEY` and your Gemini API key as the value
   - This ensures the key is securely stored and only accessible to your edge functions

2. **Deploy Functions**
   ```bash
   # Navigate to the backend directory
   cd backend
   
   # Deploy all functions
   supabase functions deploy --project-ref your-project-ref
   
   # Or deploy a specific function
   # supabase functions deploy gemini-completion --project-ref your-project-ref
   ```

3. **Verify Deployment**
   - Go to the `Edge Functions` section in Supabase dashboard
   - Check that your functions are listed and active
   - Test the functions using the Supabase dashboard or via API calls

## CI/CD

### GitHub Actions

1. **Create Workflow**
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy
   
   on:
     push:
       branches: [main]
     
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Use Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install Dependencies
           run: |
             npm ci
             cd web && npm ci
             
         - name: Build
           run: npm run build --workspace=web
           
         - name: Deploy to Netlify
           uses: nwtgck/actions-netlify@v2
           with:
             publish-dir: 'web/dist'
             production-deploy: true
           env:
             NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
             NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
   ```

## Monitoring

### Error Tracking
- Set up Sentry or similar service
- Add error boundaries in React components
- Monitor function errors in Supabase logs

### Performance Monitoring
- Use Lighthouse CI
- Set up Web Vitals monitoring
- Monitor API response times

## Rollback Procedure

### Web Application
1. Go to your hosting provider (Netlify/Vercel)
2. Navigate to "Deploys"
3. Find the previous working version
4. Click "Redeploy" or "Rollback"

### Database
1. Use Supabase's point-in-time recovery
2. Or restore from backup:
   ```bash
   supabase db restore 'backup_id'
   ```

### Edge Functions
1. Revert to previous version:
   ```bash
   supabase functions deploy function-name@version
   ```

## Maintenance

- Regularly update dependencies
- Monitor for security vulnerabilities
- Keep documentation up to date
- Review and update environment variables as needed
