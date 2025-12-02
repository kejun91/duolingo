# 🚀 Quick Start Guide

## Initial Setup

1. **Install dependencies:**
   ```powershell
   npm install
   npm run frontend:install
   ```

2. **Build the React frontend:**
   ```powershell
   npm run frontend:build
   ```

3. **Run migrations (if needed):**
   ```powershell
   npm run seedLocalD1
   ```

## Development

Run both servers in separate terminals:

**Terminal 1 - React Dev Server (with HMR):**
```powershell
npm run frontend:dev
```
Visit: http://localhost:5173

**Terminal 2 - Worker API:**
```powershell
npm run dev
```

The Vite dev server will proxy API requests to the Worker automatically.

## Production Build

```powershell
# Build React app
npm run frontend:build

# Deploy to Cloudflare
npm run deploy
```

## What Changed?

✅ **React + Vite** - Modern frontend framework with fast HMR  
✅ **Component-based** - Modular, reusable UI components  
✅ **TypeScript** - Type-safe frontend code  
✅ **Static Assets** - Built files served by Cloudflare Worker  
✅ **Preserved APIs** - All backend endpoints remain the same  

The old server-side rendering (`renderHtml.ts`) is still used for the user history page.
