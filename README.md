# Harper AI - Modern SDR Platform

A comprehensive, production-ready front-end application for Harper AI, a modern Sales Development Representative (SDR) platform that combines Gong-inspired UI design patterns with advanced calling capabilities through Twilio and AI-powered voice processing via Eleven Labs.

## 🚀 Features

### Phase 1 (Core MVP) - ✅ Completed
- ✅ **Authentication System** - JWT-based auth with OAuth support
- ✅ **Modern Dashboard** - Comprehensive metrics and activity overview
- ✅ **Contact Management** - CRM functionality with lead scoring
- ✅ **Calling Interface** - Browser-based WebRTC calling with Twilio
- ✅ **Team Management** - User roles and permissions
- ✅ **Responsive Design** - Mobile-first, accessible UI components

### Phase 2 (Enhanced Features) - 🚧 In Progress
- 🚧 **Email Automation** - Templates, sequences, and tracking
- 🚧 **Analytics Dashboard** - Performance metrics and reports
- 🚧 **Voice Processing** - Real-time transcription with Eleven Labs
- 🚧 **Pipeline Management** - Deal tracking and forecasting

### Phase 3 (Enterprise Features) - 📋 Planned
- 📋 **SSO Integration** - SAML 2.0 and OIDC support
- 📋 **Advanced Reporting** - Custom report builder
- 📋 **Gong Integration** - Conversation intelligence
- 📋 **API Access** - REST API for integrations

## 🛠 Technology Stack

### Core Framework
- **Framework**: Next.js 14 with React 18+
- **Language**: TypeScript 5.x with strict mode
- **Styling**: Tailwind CSS v3.4
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **State Management**: Zustand for global state
- **Build Tool**: Next.js built-in with Turbopack

### Key Libraries
- **Authentication**: Custom JWT with OAuth 2.0 support
- **API Client**: Axios with interceptors
- **Forms**: React Hook Form with Zod validation
- **Tables**: TanStack Table (React Table v8)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **WebRTC**: Twilio Voice SDK
- **Real-time**: Socket.io for live updates

## 📁 Project Structure

```
harper-ai/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Main application routes
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── features/         # Feature-specific components
│   │   └── layouts/          # Layout components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   ├── services/             # API services
│   ├── stores/               # Zustand stores
│   └── types/                # TypeScript types
├── public/                   # Static assets
└── tests/                    # Test files
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harper-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual configuration
   ```

4. **Set up the database**
   ```bash
   # Run database migrations (when backend is implemented)
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## 🎨 Design System

### Color Scheme
- **Primary**: Purple (#8B5CF6) - Bold, professional
- **Secondary**: Pink (#EC4899) - Energetic, engaging
- **Typography**: Inter font family with clear hierarchy
- **Theme**: Dark/Light mode with system-aware defaults

### Component Library
All UI components are built using Shadcn/ui and Radix UI primitives, ensuring:
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Screen Reader**: Compatible with assistive technologies
- ✅ **Responsive**: Mobile-first design approach

## 🔧 Configuration

### Environment Variables
Key environment variables you need to configure:

```env
# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# Twilio (for calling)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Eleven Labs (for voice processing)
ELEVENLABS_API_KEY=your-api-key

# Database
DATABASE_URL=your-database-url
```

### Feature Flags
Control feature availability:

```env
NEXT_PUBLIC_ENABLE_CALLING=true
NEXT_PUBLIC_ENABLE_RECORDING=true
NEXT_PUBLIC_ENABLE_TRANSCRIPTION=true
NEXT_PUBLIC_ENABLE_AI_COACHING=true
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Docker
```bash
# Build Docker image
docker build -t harper-ai .

# Run container
docker run -p 3000:3000 harper-ai
```

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📊 Performance

### Performance Targets
- ✅ **First Contentful Paint**: < 1.8s
- ✅ **Time to Interactive**: < 3.5s
- ✅ **Cumulative Layout Shift**: < 0.1
- ✅ **Bundle Size**: < 500KB initial load

### Optimization Features
- Code splitting for routes
- Image optimization with Next.js
- Component memoization
- Virtual scrolling for large lists
- Proper caching strategies

## 🔐 Security

### Security Features
- Input validation on all forms
- XSS prevention with proper escaping
- CSRF protection
- Secure cookie configuration
- Content Security Policy headers
- Rate limiting on API calls

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- OAuth 2.0 support (Google, Microsoft)
- Two-factor authentication (2FA)
- Session management with refresh tokens

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run the test suite
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier for code formatting
- Conventional commit messages
- Component documentation with Storybook

## 📚 Documentation

- **API Documentation**: Available at `/docs/api`
- **Component Library**: Run `pnpm storybook`
- **User Guide**: Available at `/docs/user-guide`
- **Architecture**: See `/docs/architecture.md`

## 🆘 Support

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/yourorg/harper-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/harper-ai/discussions)
- **Documentation**: [docs.harperai.com](https://docs.harperai.com)

### Common Issues
- **Build Errors**: Check Node.js version (18+)
- **Database Connection**: Verify DATABASE_URL
- **Twilio Issues**: Check API credentials

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for the excellent component library
- **Radix UI** for accessible primitives
- **Tailwind CSS** for utility-first styling
- **Next.js** team for the amazing framework
- **Twilio** for WebRTC capabilities
- **Eleven Labs** for AI voice processing

---

**Built with ❤️ by the Harper AI Team**