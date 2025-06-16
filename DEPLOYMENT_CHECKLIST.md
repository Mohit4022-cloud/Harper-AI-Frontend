# Render Deployment Checklist

## Pre-Deployment Verification ✅

### 1. Build Success
- [x] TypeScript builds without errors
- [x] ESLint passes (warnings acceptable)
- [x] All dependencies installed correctly
- [x] Static pages generate successfully

### 2. Environment Variables
Ensure these are set in Render dashboard:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your production URL
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `SENTRY_DSN` - From your Sentry project
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL
- [ ] `JWT_SECRET` - For WebSocket authentication
- [ ] `REDIS_URL` - If using Redis for sessions/caching

### 3. Database Setup
- [ ] PostgreSQL database created on Render
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed data if needed: `npx prisma db seed`

### 4. Render Configuration
- [x] `render.yaml` file configured
- [x] Build command: `npm ci && npm run build`
- [x] Start command: `npm start`
- [x] Node version specified: 18.19.0

## Deployment Steps

1. **Push to GitHub** ✅
   ```bash
   git push origin main
   ```

2. **Monitor Deployment**
   - Visit: https://dashboard.render.com/
   - Check service logs for build progress
   - Wait for "Live" status

3. **Post-Deployment Verification**
   - [ ] Homepage loads
   - [ ] API health check: `/api/health`
   - [ ] Database connection works
   - [ ] WebSocket connection establishes
   - [ ] Authentication flow works

## Common Issues & Solutions

### Build Failures
- Check environment variables are set
- Verify Node version matches local
- Check for missing dependencies

### Runtime Errors
- Check Sentry dashboard for errors
- Review Render logs
- Verify database connection

### Performance Issues
- Enable auto-scaling if needed
- Check memory usage
- Review API response times

## Monitoring

1. **Render Dashboard**
   - CPU and memory usage
   - Request counts
   - Error rates

2. **Sentry**
   - JavaScript errors
   - API errors
   - Performance metrics

3. **Application Metrics**
   - `/api/cron/metrics` endpoint
   - Real-time dashboard at `/dashboard`

## Rollback Plan

If issues occur:
1. Click "Rollback" in Render dashboard
2. Or redeploy previous commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

## Support Resources

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Community Forum: https://community.render.com