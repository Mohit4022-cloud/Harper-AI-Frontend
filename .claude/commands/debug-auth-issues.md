# Debug Authentication Issues

Diagnose and fix authentication-related problems in Harper AI.

Follow these steps:

1. **Check environment variables**:
   - Verify `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
   - Local should be: `http://localhost:3000`
   - Production should be: `https://harper-ai-frontend.onrender.com`

2. **Test API endpoints**:
   - Check `/src/app/api/auth/login/route.ts` exists and is working
   - Verify mock data in `/src/lib/mockData.ts` 
   - Test login with valid credentials: `admin@harperai.com` / `password123`

3. **Check browser console**:
   - Look for API URL debug output: `🔗 Using NEXT_PUBLIC_API_URL: ...`
   - Check auth state logging: `✅ Dashboard auth check passed`
   - Look for any network errors or 404s

4. **Verify auth store**:
   - Check `/src/stores/authStore.ts` for proper state management
   - Ensure Zustand persistence is working
   - Verify token storage in localStorage

5. **Test auth flow**:
   - Try logging out and back in
   - Check redirect behavior from protected routes
   - Verify dashboard shows user information correctly

6. **Check for common issues**:
   - Network errors: API URL misconfiguration
   - 404 errors: Missing API routes
   - Null property errors: Add `?.` operators
   - Redirect loops: Check auth logic in dashboard layout

**Debug Commands**:
```bash
npm run dev          # Start local server
npm run typecheck    # Check for TypeScript errors
npm run build        # Verify production build works
```

**Test URLs**:
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard