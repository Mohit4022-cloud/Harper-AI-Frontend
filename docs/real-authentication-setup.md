# Real Authentication Setup Guide

This guide explains how to switch from mock authentication to real database-backed authentication using bcrypt and Prisma.

## Overview

The Harper AI frontend now supports real authentication with:
- Bcrypt password hashing
- Prisma ORM for database operations
- JWT token generation
- Secure session management

## Prerequisites

1. PostgreSQL database (local or cloud)
2. Node.js 18+ installed
3. Environment variables configured

## Setup Steps

### 1. Configure Database

Create a `.env` file if it doesn't exist:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in your `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/harper_ai"
```

For cloud databases (e.g., Supabase, Neon, Railway):
```env
DATABASE_URL="postgresql://user:pass@host.com:5432/dbname?sslmode=require"
```

### 2. Run Database Setup

Execute the setup script:

```bash
./scripts/setup-database.sh
```

This will:
- Generate Prisma Client
- Run database migrations
- Seed initial data (admin, demo users)

### 3. Switch to Real Authentication

Run the switch script:

```bash
./scripts/switch-to-real-auth.sh
```

This replaces mock auth routes with real implementations.

### 4. Test Credentials

After setup, you can login with:

| Email | Password | Role |
|-------|----------|------|
| admin@harperai.com | admin123! | Admin |
| demo@harperai.com | demo123! | User |
| sdr@harperai.com | demo123! | SDR |

## Architecture

### Authentication Flow

1. **Registration** (`/api/auth/register`)
   - Validates email uniqueness
   - Checks password strength
   - Hashes password with bcrypt
   - Creates user in database
   - Returns JWT tokens

2. **Login** (`/api/auth/login`)
   - Finds user by email
   - Compares password with bcrypt
   - Updates last login timestamp
   - Returns JWT tokens

3. **Token Management**
   - Access token: 1 hour expiry
   - Refresh token: 7 days expiry
   - Tokens stored in httpOnly cookies

### Security Features

- **Password Requirements**:
  - Minimum 8 characters
  - Uppercase and lowercase letters
  - Numbers and special characters
  - Strength validation

- **Rate Limiting**:
  - 5 login attempts per 15 minutes
  - 20 registration attempts per hour

- **CSRF Protection**:
  - Token validation on state changes
  - SameSite cookie configuration

## Database Schema

Key tables for authentication:

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  password    String
  name        String
  role        String    @default("user")
  isActive    Boolean   @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify credentials

2. **Migration Errors**
   - Run `npx prisma migrate reset` to start fresh
   - Check for schema conflicts

3. **Login Not Working**
   - Ensure you ran the switch script
   - Check server logs for errors
   - Verify database has seeded users

### Rollback to Mock Auth

If needed, revert to mock authentication:

```bash
cp src/app/api/auth/login/route.mock.ts src/app/api/auth/login/route.ts
cp src/app/api/auth/register/route.mock.ts src/app/api/auth/register/route.ts
```

## Production Deployment

For production:

1. Use a managed database (Supabase, Neon, etc.)
2. Set strong JWT secrets
3. Enable SSL for database connections
4. Configure proper CORS origins
5. Use Redis for distributed rate limiting

## Next Steps

1. Implement password reset flow
2. Add 2FA support
3. Set up email verification
4. Configure OAuth providers
5. Add audit logging

## API Endpoints

### POST /api/auth/register
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

### POST /api/auth/login
```typescript
{
  email: string;
  password: string;
}
```

Both return:
```typescript
{
  user: User;
  token: string;
  refreshToken: string;
}
```