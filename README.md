# Worknotes Monorepo

A scalable, multi-platform notes and productivity application. This repository uses a monorepo structure to manage web, backend, desktop, mobile, and shared codebases.

---

## Monorepo Structure

```
worknotes/
├── web/        # Frontend web app (React, Vite)
├── backend/    # Supabase Edge Functions and backend logic
├── desktop/    # Desktop app (Electron)
├── mobile/     # Mobile app (Expo/Future)
├── shared/     # Shared logic, types, utilities
├── package.json  # npm workspaces config
└── README.md
```

---

## Getting Started

### 1. Install dependencies (from repo root):
```sh
npm install
```

### 2. Web App (Frontend)
- **Start dev server:**
  ```sh
  npm run dev --workspace=web
  ```
- **Build for production:**
  ```sh
  npm run build --workspace=web
  ```
- **Environment:**
  - Place your web environment variables in `web/.env` (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### 3. Backend (Supabase Functions)
- **Start local Supabase dev environment:**
  ```sh
  npm run dev --workspace=backend
  # or
  supabase functions serve --workdir ./backend
  ```
- **Deploy a function:**
  ```sh
  supabase functions deploy <function-name> --workdir ./backend
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
