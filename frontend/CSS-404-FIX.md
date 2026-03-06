# CSS 404 Error Fix

## Problem
You're encountering this error:
```
GET http://localhost:3000/_next/static/css/app/layout.css?v=1772701091627 net::ERR_ABORTED 404 (Not Found)
```

This happens when Next.js cache gets corrupted and CSS files aren't generated properly.

## Quick Solutions

### Option 1: Use npm script (Recommended)
```bash
npm run dev:clean
```
This automatically cleans the cache and starts the dev server.

### Option 2: Use cleanup scripts
**PowerShell:**
```powershell
.\clean-cache.ps1
npm run dev
```

**Command Prompt:**
```cmd
clean-cache.bat
npm run dev
```

### Option 3: Manual cleanup
```bash
npm run clean
npm run dev
```

### Option 4: Deep clean (if issues persist)
```bash
npm run clean:all
npm run dev
```

## Available npm Scripts

- `npm run dev` - Start development server
- `npm run dev:clean` - Clean cache and start dev server
- `npm run clean` - Remove .next folder only
- `npm run clean:all` - Remove .next and node_modules cache
- `npm run build` - Create production build

## Prevention

The `next.config.js` has been updated with better cache handling:
- Unique build IDs to prevent cache collisions
- Improved dev indicators

## When to Use Each Option

1. **Regular CSS 404 errors**: Use `npm run dev:clean`
2. **Persistent issues**: Use `npm run clean:all`
3. **Building for production**: Always run `npm run build` fresh
4. **After pulling changes**: Run `npm run clean` before starting dev

## Technical Details

The issue occurs because:
1. Next.js caches build artifacts in `.next/`
2. CSS modules are generated during the build process
3. When the cache gets corrupted, CSS files aren't generated properly
4. The browser requests CSS files that don't exist

Our fix:
- Clears the corrupted cache
- Generates fresh build artifacts
- Uses unique build IDs to prevent future cache conflicts
