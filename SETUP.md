# 🚀 Harper AI - Local Development Setup

## ✅ Quick Start (TL;DR)

```bash
# 1. Install dependencies (already done)
npm install

# 2. Start the development server
npm run dev

# 3. Open your browser
open http://localhost:3000

# 4. Login with demo credentials:
#    Email: demo@harperai.com
#    Password: password123 (or any 6+ char password)
```

## 🔧 Detailed Setup

### 1. Server Status Check

Your server should show:
```
▲ Next.js 14.2.15 (turbo)
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 725ms
```

### 2. Test API Endpoints

```bash
# Test login API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@harperai.com","password":"password123"}'

# Should return user data and JWT token
```

### 3. Demo User Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@harperai.com | any 6+ chars | org_admin |
| sdr@harperai.com | any 6+ chars | sdr |
| demo@harperai.com | any 6+ chars | sdr |

## 🎯 What's Working

✅ **Authentication System**
- JWT-based login/logout
- Role-based access control
- Persistent auth state with Zustand

✅ **Dashboard**
- Metrics display (mock data)
- Activity feed
- Task management
- Team leaderboard

✅ **Calling Interface**
- Dialer UI (not connected to Twilio yet)
- Call controls (mute, hold, end)
- Call history tracking

✅ **Navigation & Layout**
- Responsive sidebar
- Professional styling
- Dark/light mode ready

## 🔧 API Endpoints Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/dashboard/metrics` | Dashboard metrics |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Create contact |

## 🚧 Next Steps for Production

### Immediate (To get calling working):
1. Add Twilio credentials to `.env.local`
2. Test Twilio Voice SDK integration
3. Implement real-time WebRTC calling

### Backend (For production):
1. Replace mock data with real database
2. Add user registration flow
3. Implement contact CRUD operations
4. Add email automation features

### Deployment:
1. Set up Vercel/Render deployment
2. Configure production environment variables
3. Set up monitoring and analytics

## 🐛 Troubleshooting

### Server won't start?
```bash
# Kill any existing processes
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### Can't access localhost:3000?
1. Check if server shows "Ready" message
2. Try http://127.0.0.1:3000 instead
3. Check firewall/antivirus blocking port 3000

### API errors?
1. Check browser dev tools console
2. Verify `.env.local` exists
3. Check server logs for errors

## 📁 Project Structure

```
harper-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login page
│   │   ├── (dashboard)/      # Main app pages
│   │   └── api/              # API routes (working!)
│   ├── components/
│   │   ├── ui/               # Base UI components
│   │   ├── features/         # Feature components
│   │   └── layouts/          # Layout components
│   ├── lib/                  # Utilities & helpers
│   ├── services/             # API client code
│   ├── stores/               # Zustand state stores
│   └── types/                # TypeScript definitions
├── .env.local                # Local environment config
└── package.json              # Dependencies
```

## 💡 Development Tips

1. **Hot Reload**: Changes auto-refresh in browser
2. **TypeScript**: Strict mode enabled for better code quality
3. **Tailwind**: Use utility classes for styling
4. **API Testing**: Use browser dev tools or Postman
5. **State Management**: Use Zustand stores for global state

---

**🎉 You're all set! Harper AI should be running at http://localhost:3000**