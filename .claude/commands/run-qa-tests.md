# Run QA Testing Suite

Execute comprehensive QA testing for Harper AI before deployment.

## Pre-Test Setup
1. **Build verification**: Run `npm run build` - must succeed
2. **Type checking**: Run `npm run type-check` - zero errors  
3. **Start dev server**: Run `npm run dev`
4. **Open browser**: Navigate to http://localhost:3000

## Authentication Testing
- [ ] **Login page loads** without console errors
- [ ] **Login with admin**: `admin@harperai.com` / `password123`
- [ ] **Login with SDR**: `sdr@harperai.com` / `password123`  
- [ ] **Login with demo**: `demo@harperai.com` / `password123`
- [ ] **Invalid credentials** show proper error message
- [ ] **Redirect to dashboard** after successful login
- [ ] **Logout functionality** works correctly

## Navigation Testing
Test all sidebar navigation links - **ZERO 404 errors allowed**:
- [ ] **Dashboard** - Main metrics page loads
- [ ] **Contacts** - Placeholder page with "Under Construction"
- [ ] **Calling** - Placeholder page with Twilio roadmap
- [ ] **Email** - Placeholder page with email features
- [ ] **Pipeline** - Placeholder page with sales tracking
- [ ] **Calendar** - Placeholder page with scheduling
- [ ] **Reports** - Placeholder page with analytics
- [ ] **Team** - Placeholder page with management
- [ ] **Playbooks** - Placeholder page with scripts
- [ ] **Settings** - Placeholder page with configuration

## Dashboard Functionality
- [ ] **Metrics cards** display without errors
- [ ] **Recent activities** render correctly (no null errors)
- [ ] **Tasks list** shows without breaking
- [ ] **User profile** shows in sidebar
- [ ] **Sidebar collapse/expand** works
- [ ] **No console errors** during navigation

## Browser Console Checks
Required debug output (check browser console):
- [ ] `🔗 Using NEXT_PUBLIC_API_URL: http://localhost:3000`
- [ ] `🏠 Dashboard loaded successfully`
- [ ] `✅ Dashboard auth check passed: { hasToken: true, hasUser: true }`
- [ ] **No "Cannot read properties of null" errors**
- [ ] **No network errors** or failed API calls

## Mobile Responsiveness
- [ ] **Login page** responsive on mobile
- [ ] **Dashboard** layout adapts to mobile
- [ ] **Sidebar** collapses appropriately
- [ ] **Navigation** accessible on mobile

## Error Handling
- [ ] **Invalid routes** show custom 404 page
- [ ] **404 page** has proper navigation back
- [ ] **Auth redirects** work when not logged in
- [ ] **Error boundaries** catch and display errors gracefully

## Production Environment (if testing deployed version)
URL: https://harper-ai-frontend.onrender.com
- [ ] **Same login tests** pass
- [ ] **Console shows production API URL**: `https://harper-ai-frontend.onrender.com`
- [ ] **All navigation links** work
- [ ] **Performance** is acceptable
- [ ] **No console errors** in production

## Pass Criteria
**ALL checkboxes must be checked** before approving for production deployment.

If any test fails:
1. Document the failure with screenshots/console logs
2. Create GitHub issue or fix immediately
3. Re-run full QA suite after fixes
4. Do not deploy until 100% pass rate achieved