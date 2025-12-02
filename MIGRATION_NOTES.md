# Migration Notes

## Behavior Changes

### Before (SSR):
- Entire page reloaded on every interaction
- All data loaded on server and HTML rendered
- JavaScript was inline in HTML
- Full page refresh when changing tabs or filters

### After (React SPA):
- Single page load, then all navigation is client-side
- Data fetched via API calls (JSON)
- JavaScript bundled in separate files
- No page refresh for tab switching or filter updates

## What Stayed the Same

✅ All API endpoints unchanged  
✅ Database schema unchanged  
✅ Cron job logic unchanged  
✅ User tracking behavior unchanged  
✅ Rankings calculation unchanged  
✅ Date filtering logic unchanged  

## Development Workflow Changes

### Old Workflow:
```powershell
npm run dev  # Single command
```

### New Workflow:
```powershell
# Terminal 1
npm run frontend:dev

# Terminal 2  
npm run dev
```

### Deployment:
```powershell
# Old (just deploy)
npm run deploy

# New (build first, then deploy)
npm run frontend:build
npm run deploy
```

## File Organization

### Removed:
- ❌ Most of `src/renderHtml.ts` functions (kept renderUserHistory)

### Added:
- ✅ `frontend/` directory with entire React app
- ✅ `public/` directory with built assets
- ✅ Component files (.tsx, .css)
- ✅ Vite configuration
- ✅ Frontend package.json

### Modified:
- ✏️ `src/index.ts` - Added static file serving and users API
- ✏️ `wrangler.json` - Added assets configuration
- ✏️ `worker-configuration.d.ts` - Added ASSETS binding
- ✏️ Root `package.json` - Added frontend scripts

## Browser Compatibility

The React app uses modern JavaScript features. Supported browsers:
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

If you need IE11 support, additional polyfills would be needed.

## Known Issues

- The frontend build warnings about `npm audit` can be addressed with `npm audit fix` in the frontend directory
- TypeScript errors shown during file creation are normal before `npm install` runs
- The worker dev server doesn't have HMR - restart needed for backend changes

## Rollback Plan

If you need to rollback:

1. **Keep the old code:**
   - Revert `src/index.ts` to remove static file serving
   - Revert `wrangler.json` to remove assets config
   - Restore old `renderHtml.ts` functions
   - Remove `frontend/` directory
   - Remove `public/` directory

2. **Or use git:**
   ```powershell
   git checkout HEAD -- src/index.ts wrangler.json worker-configuration.d.ts
   Remove-Item -Recurse frontend, public
   ```
