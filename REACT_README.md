# Duolingo Progress Tracker - React Frontend

This project has been refactored to use a React frontend with Vite.

## Setup

### First Time Setup

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   npm run frontend:install
   ```

3. **Build the frontend:**
   ```bash
   npm run frontend:build
   ```

## Development

### Running Locally

You'll need two terminals:

**Terminal 1 - Frontend (React + Vite):**
```bash
npm run frontend:dev
```
This runs the Vite dev server at `http://localhost:5173` with hot module replacement.

**Terminal 2 - Backend (Cloudflare Worker):**
```bash
npm run dev
```
This runs the Cloudflare Worker at `http://localhost:8787`.

For development, you can use the Vite dev server (Terminal 1) which will proxy API calls to the Worker.

### Building for Production

```bash
npm run frontend:build
```

This builds the React app and outputs static files to the `public/` directory, which the Cloudflare Worker will serve.

## Deployment

```bash
npm run frontend:build
npm run deploy
```

The build command compiles the React app, and deploy pushes everything to Cloudflare.

## Project Structure

```
duolingo/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML template
│   ├── vite.config.ts       # Vite configuration
│   └── package.json         # Frontend dependencies
├── src/                      # Cloudflare Worker
│   ├── index.ts             # Worker entry + API routes
│   └── renderHtml.ts        # Legacy SSR (kept for user history)
├── public/                   # Built frontend (generated)
├── migrations/              # D1 database migrations
└── wrangler.json            # Cloudflare Worker config
```

## API Endpoints

All API endpoints are served by the Cloudflare Worker:

- `POST /api/add-user` - Add a new user
- `POST /api/untrack-user` - Hide user from leaderboard
- `POST /api/retrack-user` - Show user in leaderboard again
- `GET /api/users?tracked=1` - Get tracked users
- `GET /api/users?tracked=0` - Get untracked users
- `GET /api/rankings?startDate=...&endDate=...&streakMin=...` - Get rankings
- `GET /api/user-history?userId=...` - Get user history (SSR)

## Changes from Original

**Before:**
- Server-side rendered HTML
- All rendering in `renderHtml.ts`
- Inline JavaScript

**After:**
- React SPA (Single Page Application)
- Component-based architecture
- Modern development with Vite
- Type-safe with TypeScript
- Hot module replacement for fast development
- Static build output served by Worker
