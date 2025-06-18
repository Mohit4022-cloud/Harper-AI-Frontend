# Phase 5 Deployment Setup v4 - Performance & Session Improvements

This document outlines the changes made to stabilize app performance, extend session timeout, and fix CSRF issues.

## 1. Extended Inactivity Logout to 30 Minutes

### Files Changed:
- **`src/lib/session.ts`** (NEW) - Session configuration with 30-minute timeout and rolling sessions
- **`src/app/api/auth/refresh-session/route.ts`** (NEW) - Endpoint to refresh session on activity
- **`src/components/SessionMonitor.tsx`** (NEW) - Client-side session activity tracker
- **`src/app/(dashboard)/layout.tsx`** - Added SessionMonitor component

### Key Features:
- 30-minute inactivity timeout (was 5 minutes)
- Rolling sessions - timer resets on each authenticated request
- Client-side activity tracking (mouse, keyboard, scroll events)
- Warning toast when session is about to expire (5 minutes before)
- Automatic session refresh on user activity

## 2. Smooth Page Transitions

### Files Changed:
- **`src/components/providers/PageTransitionProvider.tsx`** (NEW) - Handles smooth transitions
- **`src/app/layout.tsx`** - Added PageTransitionProvider to root layout

### Key Features:
- Prevents blank white screen during navigation
- Subtle progress bar at top during transitions
- 300ms transition time with opacity effects
- Lightweight loading indicator

## 3. Performance Optimization

### Files Changed:
- **`next.config.ts`** - Added performance configurations
- **`vercel.json`** (NEW) - Deployment optimization settings

### Key Features:
- Enabled scroll restoration
- Static page generation timeout increased to 120s
- Clean URLs (no trailing slash)
- Edge caching for static assets
- Compression enabled
- 60-second timeout for serverless functions

## 4. Fixed CSRF on Voice Connections

### Files Changed:
- **`src/lib/api-client.ts`** - Added CSRF token to all state-changing requests
- **`src/lib/api.ts`** - Added CSRF token to axios interceptor
- **`tests/e2e/voice-csrf.spec.ts`** (NEW) - E2E test for CSRF validation

### Key Features:
- Automatically includes `x-csrf-token` header on POST/PUT/DELETE requests
- Reads CSRF token from cookies
- Voice connection endpoints now properly authenticated
- Test coverage for CSRF protection

## 5. Additional Improvements

### Middleware Session Handling:
- **`src/lib/middleware/session.ts`** (NEW) - Middleware for rolling session updates

### Deployment Configuration:
- **`render.yaml`** - Added 60-second timeout configuration

## Testing the Changes

### Local Testing:
```bash
npm run dev
```

1. **Session Timeout**: Login and wait 30 minutes without activity - should logout
2. **Session Refresh**: Use the app actively - session should stay alive
3. **Page Transitions**: Navigate between pages - no blank screens
4. **Voice CSRF**: Test calling features - should work without CSRF errors

### E2E Test:
```bash
npm run test:e2e voice-csrf.spec.ts
```

## Environment Variables

No new environment variables required. The session configuration uses existing JWT settings.

## Migration Notes

1. Users will need to re-login after deployment due to session cookie changes
2. CSRF tokens are now required for all API mutations
3. Performance improvements should reduce page load times

## Monitoring

Monitor the following after deployment:
- Session timeout complaints (should decrease)
- Page transition smoothness
- Voice connection success rate
- API response times

## Rollback Plan

If issues arise:
1. Revert the session timeout in `src/lib/session.ts` to previous value
2. Remove CSRF token headers from API clients if causing issues
3. Disable PageTransitionProvider if causing rendering issues