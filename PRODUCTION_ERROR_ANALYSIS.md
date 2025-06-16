# Production Error Analysis

## 1. Dashboard 500 Error

### Root Cause
The middleware at `src/middleware.ts` is checking for `NEXTAUTH_SECRET` and returning a 500 error when it's not configured in production.

**Location**: `src/middleware.ts:42-44`
```typescript
if (!secret) {
  console.error('NEXTAUTH_SECRET is not configured')
  return new NextResponse('Server Configuration Error', { status: 500 })
}
```

### Solution
1. **Immediate Fix**: Ensure the following environment variables are set in production:
   ```bash
   NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"
   DATABASE_URL="<your-production-database-url>"
   DIRECT_URL="<your-production-database-direct-url>"
   NEXTAUTH_URL="https://app.harperai.com"
   ```

2. **Improved Error Handling**: Update the middleware to provide more specific error responses:
   ```typescript
   // Instead of generic 500 error
   if (!secret) {
     console.error('NEXTAUTH_SECRET is not configured')
     return NextResponse.redirect(new URL('/auth/error?error=Configuration', request.url))
   }
   ```

### Additional Issues Found
- The `.env.production` file is missing critical authentication and database variables
- No database connection error handling in the auth flow

## 2. TypeError: Cannot read properties of null (reading 'type') in inpage.js

### Analysis
This error is from a browser extension (likely MetaMask) and is NOT an application error.

### Current Handling
The Sentry configuration already filters out browser extension errors:
- Lines 71-73 in `sentry.client.config.ts` check for extension URLs and return null
- Lines 54-62 deny URLs from browser extensions

### Recommendation
No action needed - this error is correctly filtered and should not appear in production Sentry logs.

## 3. Recommended Production Checklist

### Environment Variables
Ensure all these are set in production:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct database connection (for migrations)
- [ ] `NEXTAUTH_SECRET` - Authentication secret key
- [ ] `NEXTAUTH_URL` - Production URL (https://app.harperai.com)
- [ ] `SENTRY_DSN` - Error tracking
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Client-side error tracking

### Database
- [ ] Ensure database is accessible from production environment
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify connection pooling is configured

### Monitoring
- [ ] Set up alerts for 500 errors
- [ ] Monitor authentication failures
- [ ] Track database connection errors

## 4. Quick Fixes

### Fix 1: Update Middleware Error Handling
```typescript
// In src/middleware.ts
export async function middleware(request: NextRequest) {
  // ... existing code ...
  
  if (isProtectedPath) {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not configured')
      // Redirect to error page instead of 500
      return NextResponse.redirect(new URL('/auth/error?error=ServerConfiguration', request.url))
    }
    
    try {
      const token = await getToken({ 
        req: request,
        secret
      })
      
      if (!token) {
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
        return NextResponse.redirect(signInUrl)
      }
    } catch (error) {
      console.error('Auth token verification failed:', error)
      return NextResponse.redirect(new URL('/auth/error?error=TokenVerification', request.url))
    }
  }
  
  // ... rest of middleware
}
```

### Fix 2: Add Database Connection Check
```typescript
// In src/lib/prisma.ts
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
```

### Fix 3: Create Error Page
Create `src/app/auth/error/page.tsx` to handle auth errors gracefully instead of showing 500 errors.

## 5. Deployment Commands

```bash
# Set production environment variables
export DATABASE_URL="your-database-url"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://app.harperai.com"

# Run database migrations
npx prisma migrate deploy

# Build and start
npm run build
npm start
```