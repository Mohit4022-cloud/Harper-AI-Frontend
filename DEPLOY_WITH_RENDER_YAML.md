# Deploy Harper AI with render.yaml

## Benefits of render.yaml
- ✅ **Infrastructure as Code** - Version controlled deployment config
- ✅ **Consistent Deployments** - Same settings every time
- ✅ **Automatic Database** - PostgreSQL database created automatically
- ✅ **Environment Variables** - Managed in code, not dashboard
- ✅ **Health Checks** - Built-in monitoring at `/api/health`

## Current Configuration

### Web Service
- **Name**: `harper-ai-frontend`
- **Environment**: Node.js
- **Plan**: Free tier
- **Build**: `npm ci && npx prisma generate && npm run build`
- **Start**: `npm start`
- **Health Check**: `/api/health`
- **Auto-deploy**: Enabled from `main` branch

### Database
- **Name**: `harper-ai-db`
- **Type**: PostgreSQL
- **Plan**: Free tier
- **Connection**: Automatically linked via `DATABASE_URL`

### Environment Variables
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://harper-ai-frontend-1.onrender.com`
- `DATABASE_URL` (auto-generated from database)
- `JWT_SECRET` (auto-generated)
- `NEXT_PUBLIC_APP_VERSION=1.1.0`

## Deployment Steps

### Option 1: Update Existing Service
1. Go to your existing Render service settings
2. Scroll to "Build & Deploy"
3. Check "Use render.yaml"
4. Save settings
5. Trigger manual deploy

### Option 2: Create New Service (Recommended)
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `Mohit4022-cloud/Harper-AI-Frontend`
4. **Important**: Select "I have a render.yaml file"
5. Choose branch: `main`
6. Click "Create Web Service"
7. Render will automatically:
   - Create the PostgreSQL database
   - Set up environment variables
   - Build and deploy the app

### Option 3: Use Render CLI
```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy using render.yaml
render deploy
```

## Verification Steps

After deployment, verify:

1. **Service Status**: Should show "Live" in dashboard
2. **Database**: `harper-ai-db` should be created and connected
3. **Health Check**: Visit `/api/health` - should return:
   ```json
   {
     "success": true,
     "status": "healthy",
     "version": "1.1.0",
     "environment": "production"
   }
   ```
4. **Contact Management**: Visit `/contacts` - should load the new UI
5. **Database Connection**: APIs should work without errors

## Build Logs to Look For

Successful deployment should show:
```
✓ Installing dependencies with npm ci
✓ Generating Prisma Client
✓ Building Next.js application
✓ Creating optimized production build
✓ Starting server on port 10000
✓ Health check passed at /api/health
```

## Environment Variables Management

With render.yaml, you can:
- **Add new variables** by editing the file and pushing
- **Update values** in the Render dashboard (overrides file)
- **Use secrets** with `generateValue: true`
- **Reference other services** with `fromService`

## Troubleshooting

### If Build Fails:
1. Check build logs for specific errors
2. Verify all dependencies in package.json
3. Ensure Prisma schema is valid
4. Check Node.js version compatibility

### If Database Connection Fails:
1. Verify DATABASE_URL is set correctly
2. Check if database was created
3. Run `npx prisma db push` in build command if needed

### If Health Check Fails:
1. Verify `/api/health` endpoint exists
2. Check if app is listening on correct port
3. Ensure no startup errors in logs

## Next Steps

1. **Push render.yaml**: Commit and push the file
2. **Update Render service**: Enable "Use render.yaml"
3. **Monitor deployment**: Watch build logs
4. **Test features**: Verify contact management works
5. **Update DNS**: Point custom domain if needed

## Contact Management Features Ready

Once deployed, you'll have:
- ✅ Prisma ORM with PostgreSQL
- ✅ 5M+ contact support with virtual scrolling
- ✅ Advanced search and filtering
- ✅ Import/Export CSV/JSON
- ✅ Bulk operations (update, delete, tag)
- ✅ Lead scoring system (0-100)
- ✅ Activity tracking
- ✅ Professional UI with Shadcn/ui components