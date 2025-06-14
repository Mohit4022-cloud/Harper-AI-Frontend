# Harper AI - SDR Platform

Harper AI is a modern Sales Development Representative (SDR) platform built with Next.js 14+, designed for cost-effective sales automation and call management.

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start development server on localhost:3000
npm run build           # Build production bundle
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode

# Deployment
git push origin main    # Auto-deploys to https://harper-ai-frontend.onrender.com
```

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: Next.js 15.3+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State**: Zustand with persistence
- **Auth**: JWT with mock authentication
- **API**: Next.js API routes
- **Deployment**: Render (auto-deploy from main branch)
- **Integrations**: Twilio Voice SDK, Eleven Labs (planned)

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # Shadcn/ui components
├── lib/                  # Utilities and configurations
├── services/             # API service layers
├── stores/               # Zustand state stores
└── types/                # TypeScript type definitions
```

## 🎨 Code Style Guidelines

### IMPORTANT: Follow these patterns strictly

- **Use ES modules** (import/export), not CommonJS (require)
- **Destructure imports** when possible: `import { Button } from '@/components/ui/button'`
- **Use TypeScript strict mode** - all props and variables must be typed
- **Prefer server components** unless client interactivity is needed (`'use client'`)
- **Use Tailwind classes** instead of custom CSS
- **Follow Shadcn/ui patterns** for component composition
- **Use optional chaining** (`?.`) for null safety
- **Add debug logging** with console.log for production debugging

### Component Patterns
```tsx
// ✅ Good: Server component by default
export default function Page() {
  return <div>Static content</div>
}

// ✅ Good: Client component when needed
'use client'
import { useState } from 'react'
export default function InteractivePage() {
  const [state, setState] = useState('')
  return <button onClick={() => setState('clicked')}>Click me</button>
}

// ✅ Good: Safe property access
{activity?.contact || 'Unknown Contact'}

// ❌ Bad: Unsafe property access
{activity.contact}
```

## 🧪 Testing Strategy

### Test Credentials
```
admin@harperai.com / password123 (or any 6+ chars)
sdr@harperai.com / password123
demo@harperai.com / password123
```

### 🚀 Development Bypass (Skip Login)
**Local Development**: http://localhost:3000/dev-login
**Render Production**: https://harper-ai-frontend.onrender.com/dev-login?render_bypass=true

- One-click login as any test user
- Works in development mode automatically
- Requires special parameter (?render_bypass=true) in production
- Also accessible from login page "Skip Login (Dev Bypass)" link in dev mode

### Manual Testing Checklist
- [ ] Login works without network errors
- [ ] All navigation links work (no 404s)
- [ ] Dashboard loads without console errors
- [ ] Null safety - no "Cannot read properties of null" errors
- [ ] Mobile responsive design

### Expected Console Output
```
🔗 Using NEXT_PUBLIC_API_URL: https://harper-ai-frontend.onrender.com
🏠 Dashboard loaded successfully
✅ Dashboard auth check passed: { hasToken: true, hasUser: true }
```

## 🔄 Development Workflow

### YOU MUST follow this workflow:

1. **Always run type-check** when making code changes: `npm run type-check`
2. **Test locally first** before pushing to avoid deployment failures
3. **Use feature branches** for new features or bug fixes
4. **Add placeholder pages** for missing routes (use "🚧 Under Construction" pattern)
5. **Add debug logging** for production troubleshooting

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes  
- `nav-bugfixes-ui-polish` - Current navigation fixes branch

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes, then:
npm run type-check       # IMPORTANT: Always type-check
npm run build           # Verify build works
git add .
git commit -m "feat: descriptive message"
git push origin feature/new-feature

# Create PR when ready
```

## 🚀 Deployment

### Environment Variables
**CRITICAL**: `NEXT_PUBLIC_API_URL` must be set correctly:
- **Local**: `http://localhost:3000`
- **Render**: `https://harper-ai-frontend.onrender.com`

### Deployment Process
1. **Main branch** auto-deploys to: https://harper-ai-frontend.onrender.com
2. **Environment variables** are managed in Render dashboard
3. **Build logs** available in Render dashboard for debugging
4. **Always test locally** before merging to main

### Render Service Details
- **Service ID**: `srv-d16asoemcj7s73buu5cg`
- **Region**: Oregon
- **Plan**: Free tier
- **Auto-deploy**: Enabled from main branch

## 🐛 Common Issues & Solutions

### "Cannot read properties of null"
- **Cause**: Unsafe property access
- **Fix**: Use optional chaining `activity?.type` instead of `activity.type`

### Network Error on Login
- **Cause**: Wrong API URL environment variable
- **Fix**: Verify `NEXT_PUBLIC_API_URL` in Render dashboard

### 404 on Navigation
- **Cause**: Missing page routes
- **Fix**: Create placeholder pages in `src/app/(dashboard)/[route]/page.tsx`

### Build Failures
- **Cause**: TypeScript errors
- **Fix**: Run `npm run type-check` locally and fix all errors

## 📁 Current Pages Status

### ✅ Implemented
- `/` - Landing page
- `/login` - Authentication
- `/register` - User registration  
- `/forgot-password` - Password reset
- `/dashboard` - Main dashboard with metrics
- `/contacts` - Contact management with full CRUD
- `/calling` - AI-powered calling with CSV upload
- `/email` - Email personalization with contact selection
- `/pipeline` - Sales pipeline (placeholder)
- `/calendar` - Calendar with event management
- `/reports` - Analytics dashboard
- `/team` - Team management (placeholder)
- `/playbooks` - Sales scripts (placeholder)
- `/settings` - Account settings with theme, profile, notifications

### 🚧 Placeholder Pattern
All placeholder pages use this UX pattern:
- Professional "Under Construction" message
- Feature roadmap showing what's coming
- Back navigation button
- Consistent Harper AI branding

## 🎯 Key Files to Know

- **`src/lib/mockData.ts`** - Mock users and test data
- **`src/stores/authStore.ts`** - Authentication state management
- **`src/components/layouts/Sidebar.tsx`** - Main navigation
- **`src/lib/api.ts`** - Environment-aware API configuration
- **`src/types/index.ts`** - All TypeScript type definitions
- **`DEPLOYMENT.md`** - Detailed deployment instructions

## 🚨 Safety & Debug Features

- **Null safety**: All data rendering uses `?.` operators
- **Debug logging**: Console output for production troubleshooting
- **Global 404**: Professional fallback page with navigation
- **Auth protection**: Dashboard routes require valid authentication
- **Error boundaries**: Graceful error handling throughout app
- **Theme persistence**: Dark/light mode saved to localStorage
- **Contact unification**: Single source of truth for all contact data

## 💡 User Preferences

### Claude Code Assistant Settings
- **Minimal code output**: Don't show full code blocks, just progress updates
- **Concise responses**: Keep explanations brief and action-focused
- **Progress updates**: Regular status updates on what's being done

## 💡 Next Steps / TODO

- [ ] Implement real authentication (replace mock system)
- [ ] Add Twilio Voice SDK integration
- [ ] Add email campaign functionality
- [ ] Implement sales pipeline tracking
- [ ] Add comprehensive test suite
- [ ] Backend API integration
- [ ] Real-time features with WebSockets
- [ ] Advanced AI features (lead scoring, enrichment)

---

**Remember**: This is a pilot project focused on cost-effectiveness. Always prioritize working features over perfect implementation.