# Harper AI Test Suite

This directory contains all test files for the Harper AI frontend application.

## Structure

- `unit/` - Unit tests for individual components
- `e2e/` - End-to-end tests using Playwright  
- `e2e/security/` - Security and authentication tests
- `contracts/` - API contract tests
- `visual/` - Visual regression tests
- `accessibility/` - Accessibility (a11y) tests
- `performance/` - Performance benchmarks

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run specific test file
npm run test:e2e auth.spec.ts

# Run in headed mode
npm run test:e2e -- --headed

# Run with UI mode
npm run test:e2e:ui
```

### Coverage Requirements

- Branches: 80%
- Functions: 80%
- Lines: 85%
- Statements: 85%

## CI/CD Integration

Tests run automatically on:
- Every push to main/develop branches
- Every pull request
- Scheduled runs for monitoring

### Workflows

1. **Playwright Tests** - Cross-browser E2E tests
2. **Code Coverage** - Unit test coverage enforcement
3. **Lighthouse CI** - Performance & accessibility audits
4. **Slack Notifications** - Failure alerts

## Writing Tests

### Unit Tests
- Use Jest and React Testing Library
- Mock external dependencies
- Test user behavior, not implementation
- Aim for 100% coverage of critical components

### E2E Tests
- Use Playwright
- Test complete user workflows
- Include existence checks for features
- Handle multiple selectors gracefully

### Security Tests
- Verify auth flows work correctly
- Check for security headers
- Test access control
- Validate input sanitization

## Best Practices

1. **Always check feature existence first**
   ```typescript
   const feature = await page.$('[data-test="feature"]');
   if (!feature) {
     test.fail(true, 'Feature not found - may not be implemented');
     return;
   }
   ```

2. **Use data-test attributes for reliable selectors**
   ```typescript
   await page.click('[data-test="submit-button"]');
   ```

3. **Handle multiple possible selectors**
   ```typescript
   await page.click('button:has-text("Submit"), button[type="submit"]');
   ```

4. **Provide clear failure messages**
   ```typescript
   expect(element, 'Login form not found – feature may be missing').toBeTruthy();
   ```

## Debugging

- Run tests in headed mode: `--headed`
- Use page.pause() for breakpoints
- Check test artifacts in CI runs
- View HTML reports locally