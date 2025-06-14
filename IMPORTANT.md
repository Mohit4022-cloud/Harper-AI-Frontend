# IMPORTANT: Harper AI Credentials & Links

⚠️ **CONFIDENTIAL**: This file contains sensitive information. Do not commit to version control.

## 🔐 Authentication & Test Credentials

### Mock User Accounts
```
admin@harperai.com / password123      (Admin role)
sdr@harperai.com / password123        (SDR role)  
demo@harperai.com / password123       (Demo role)
```

### Development Bypass URLs
- **Local**: http://localhost:3000/dev-login
- **Production**: https://harper-ai-frontend.onrender.com/dev-login?render_bypass=true

## 🌐 Live URLs

### Production Deployment
- **Main App**: https://harper-ai-frontend.onrender.com
- **GitHub Repository**: https://github.com/Mohit4022-cloud/Harper-AI-Frontend
- **Render Dashboard**: https://dashboard.render.com/web/srv-d16asoemcj7s73buu5cg

### Development URLs
- **Local Dev**: http://localhost:3000
- **Network Access**: http://10.2.87.240:3000 (your local network IP)

## 🔧 API Configuration

### Environment Variables
```bash
# Production (set in Render dashboard)
NEXT_PUBLIC_API_URL=https://harper-ai-frontend.onrender.com

# Local Development (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000

# JWT Secret (generate a secure one for production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### API Endpoints
All API routes are prefixed with `/api/`:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset

#### Dashboard & Data
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/contacts` - Contact list
- `GET /api/calls` - Call history
- `GET /api/analytics` - Analytics data

## 🚀 Deployment Information

### Render Service Details
- **Service ID**: srv-d16asoemcj7s73buu5cg
- **Region**: Oregon (US West)
- **Plan**: Free tier
- **Auto-deploy**: Enabled from main branch
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### GitHub Integration
- **Repository**: Harper-AI-Frontend
- **Owner**: Mohit4022-cloud
- **Default Branch**: main
- **Feature Branch**: nav-bugfixes-ui-polish (for testing)

## 🔑 Third-Party Service Placeholders

### Twilio (Voice SDK) - Not Yet Integrated
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Eleven Labs (Voice Synthesis) - Planned
```
ELEVEN_LABS_API_KEY=your-eleven-labs-api-key
```

### Future AI Services - Planned
```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## 🛠️ Development Commands

### Quick Commands
```bash
# Start development
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Run tests
npm run test

# Deploy to Render (auto via GitHub push)
git push origin main
```

### Claude Code Commands
```bash
/project:fix-build            # Fix TypeScript/build errors
/project:add-page            # Create new pages
/project:deploy-to-render    # Deployment workflow
/project:debug-auth-issues   # Auth troubleshooting
/project:run-qa-tests        # QA checklist
/project:create-component    # Component creation
```

## 📊 Monitoring & Logs

### Render Logs
Access deployment logs at: https://dashboard.render.com/web/srv-d16asoemcj7s73buu5cg/logs

### Debug Output
Production console shows:
- `🔗 Using NEXT_PUBLIC_API_URL: [URL]`
- `🏠 Dashboard loaded successfully`
- `✅ Dashboard auth check passed`

## 🔒 Security Notes

1. **JWT Tokens**: Currently using HS256 algorithm with 7-day expiry
2. **Password Requirements**: Minimum 6 characters (increase for production)
3. **CORS**: Configured for same-origin requests only
4. **Rate Limiting**: Not yet implemented (add for production)
5. **API Keys**: All sensitive keys should be stored in environment variables

## 📱 Contact Information

### Development Team
- **GitHub**: @Mohit4022-cloud
- **Project**: Harper AI - Modern SDR Platform

### Support Resources
- **Documentation**: See README.md and CLAUDE.md
- **Issues**: https://github.com/Mohit4022-cloud/Harper-AI-Frontend/issues
- **Claude Code Help**: https://github.com/anthropics/claude-code/issues

## ⚡ Quick Access Links

### Most Used During Development
1. **Skip Login (Local)**: http://localhost:3000/dev-login
2. **Skip Login (Prod)**: https://harper-ai-frontend.onrender.com/dev-login?render_bypass=true
3. **Dashboard**: https://harper-ai-frontend.onrender.com/dashboard
4. **GitHub Repo**: https://github.com/Mohit4022-cloud/Harper-AI-Frontend
5. **Render Logs**: https://dashboard.render.com/web/srv-d16asoemcj7s73buu5cg/logs

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: Development/Pilot Phase