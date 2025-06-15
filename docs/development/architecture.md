# Architecture Overview

This document provides an overview of the Worknotes application architecture.

## Monorepo Structure

```
worknotes/
├── web/              # Frontend application
├── backend/          # Backend services and functions
├── shared/           # Shared code between platforms
├── desktop/          # Desktop app (future)
└── mobile/           # Mobile app (future)
```

## Frontend Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context + Hooks
- **Styling**: CSS Modules with PostCSS
- **UI Components**: Shadcn/ui + Radix UI

### Key Directories
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/pages/` - Page components
- `src/lib/` - Utilities and helpers
- `src/integrations/` - Third-party integrations

## Backend Architecture

### Tech Stack
- **Runtime**: Supabase Edge Functions (Deno)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

### Key Directories
- `functions/` - Serverless functions
  - `auth/` - Authentication related functions
  - `api/` - REST API endpoints
  - `workers/` - Background jobs

## Data Flow

1. **Authentication**
   - User authenticates via Supabase Auth
   - JWT token is stored in secure HTTP-only cookies
   - Token is included in API requests

2. **API Requests**
   - Frontend makes requests to Supabase Edge Functions
   - Functions validate JWT and process requests
   - Data is stored in Supabase PostgreSQL

3. **Real-time Updates**
   - Supabase Realtime provides live updates
   - Client subscribes to database changes
   - UI updates automatically when data changes

## Security Considerations

- All API endpoints require authentication
- Row Level Security (RLS) is enabled on database tables
- Sensitive data is encrypted at rest
- Rate limiting on authentication endpoints
- CORS is properly configured

## Performance

- Code splitting with dynamic imports
- Lazy loading of routes
- Optimized database queries
- Caching where appropriate
- Image optimization

## Testing Strategy

- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for critical user flows
- End-to-end tests for core functionality

## Error Handling

- Consistent error responses from API
- Client-side error boundaries
- Logging and monitoring
- User-friendly error messages

## Local Development

See [Local Development Guide](./local-development.md) for setting up your development environment.
