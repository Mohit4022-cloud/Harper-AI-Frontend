# Harper AI Deployment Guide

## 🚀 Render Deployment Configuration

### Current Deployment
- **Live URL**: https://harper-ai-frontend.onrender.com
- **Repository**: https://github.com/Mohit4022-cloud/Harper-AI-Frontend

### 🔧 Required Environment Variables in Render

Go to **Render Dashboard** → **Harper AI Frontend Service** → **Environment** and add:

```env
NEXT_PUBLIC_API_URL=https://harper-ai-frontend.onrender.com
```

⚠️ **Critical**: This must be set exactly as shown above for the login to work properly.

### 🐛 Debugging Production Issues

#### Check API URL in Browser Console
Open browser console on https://harper-ai-frontend.onrender.com and run:
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

**Expected Output:**
```
🔗 Using NEXT_PUBLIC_API_URL: https://harper-ai-frontend.onrender.com
```

**If you see `undefined` or `localhost`:**
1. Environment variable is not set in Render
2. Build happened before environment variable was set
3. Need to trigger a new deployment

#### Force Rebuild
If environment variable is set but not working:
```bash
git commit --allow-empty -m "Force rebuild"
git push origin main
```

### 📝 Login Credentials
- `admin@harperai.com` / any password 6+ characters
- `sdr@harperai.com` / any password 6+ characters  
- `demo@harperai.com` / any password 6+ characters

### 🔍 Common Issues

| Issue | Solution |
|-------|----------|
| Network Error on login | Set `NEXT_PUBLIC_API_URL` in Render |
| 404/502 on forgot-password | Already fixed - pages exist |
| Localhost calls in production | Environment variable not picked up during build |

### 📈 Monitoring Deployment
- **Render Logs**: Check build and runtime logs in Render dashboard
- **Browser Console**: Look for debug output on login attempts
- **Network Tab**: Verify API calls go to correct URL

## 🏠 Local Development

Keep your local `.env.local` as:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

This ensures local development works while production uses the correct Render URL.