# Security Configuration Guide

## Production Deployment Checklist

### ✅ Environment Variables
- [ ] Generate a secure JWT_SECRET (minimum 32 characters)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set NODE_ENV to "production"
- [ ] Configure all required API keys in Render dashboard
- [ ] Never commit sensitive values to version control

### ✅ Authentication & Authorization
- [ ] JWT tokens expire after 7 days (configurable)
- [ ] Refresh tokens expire after 30 days
- [ ] All API endpoints require authentication except public ones
- [ ] Admin endpoints have additional role-based checks

### ✅ Rate Limiting
- Default: 100 requests per minute per IP
- Auth endpoints: 5 attempts per 15 minutes
- Configurable via environment variables

### ✅ Security Headers
All responses include:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### ✅ Debug & Development Features
- Dev login page (`/dev-login`) only works in development
- Debug endpoints require authentication in production
- Console logging is minimized in production

### ✅ Data Protection
- Passwords are never returned in API responses
- Sensitive data is excluded from logs
- CORS is configured for allowed origins only

## Security Best Practices

### 1. Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
```

### 2. Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups
- Principle of least privilege for DB users

### 3. API Security
- Input validation with Zod schemas
- SQL injection prevention (using Prisma ORM)
- XSS protection via React's built-in escaping
- CSRF protection for state-changing operations

### 4. Monitoring & Logging
- Log security events (failed logins, etc.)
- Monitor rate limit violations
- Track API usage patterns
- Set up alerts for suspicious activity

## Incident Response

If you suspect a security breach:
1. Rotate all secrets immediately
2. Review access logs
3. Check for unauthorized API usage
4. Update dependencies
5. Notify affected users if necessary

## Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Audit user permissions
- [ ] Test backup restoration
- [ ] Review security headers

## Contact

For security concerns, contact: security@harperai.com