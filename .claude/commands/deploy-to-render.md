# Deploy to Render

Deploy the current changes to the Harper AI production environment on Render.

Follow these steps:

1. **Pre-deployment checks**:
   - Run `npm run type-check` - ensure no TypeScript errors
   - Run `npm run build` - ensure successful build
   - Run `npm run dev` - test locally that app starts and login works
   - Verify all navigation links work without 404 errors

2. **Commit and push**:
   - Stage changes: `git add .`
   - Create descriptive commit message following project conventions
   - Push to current branch: `git push origin [current-branch]`

3. **Merge to main** (if on feature branch):
   - Switch to main: `git checkout main`
   - Merge feature branch: `git merge [feature-branch]`
   - Push to main: `git push origin main`

4. **Monitor deployment**:
   - Render auto-deploys from main branch
   - Check deployment logs in Render dashboard if needed
   - Verify live site works: https://harper-ai-frontend.onrender.com

5. **Post-deployment verification**:
   - Test login with: `admin@harperai.com` / `password123`
   - Verify console shows: `🔗 Using NEXT_PUBLIC_API_URL: https://harper-ai-frontend.onrender.com`
   - Test all navigation links work
   - Check for any console errors

**CRITICAL**: Always test locally before deploying to avoid production downtime.