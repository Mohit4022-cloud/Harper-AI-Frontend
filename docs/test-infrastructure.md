# Harper AI Test Infrastructure Documentation

## Overview

This document outlines the comprehensive test infrastructure implemented for the Harper AI frontend application. The test suite covers unit tests, integration tests, end-to-end tests, visual regression, accessibility, performance, and API contract testing.

## Test Structure

```
tests/
├── unit/               # Component unit tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
├── visual/            # Visual regression tests
├── accessibility/     # Accessibility tests
├── contracts/         # API contract tests
└── performance/       # Performance tests
```

## Test Types

### 1. Unit Tests (Jest + React Testing Library)

**Location:** `tests/unit/`

**Coverage:** Individual React components in isolation

**Key Features:**
- 100% branch coverage requirement
- Mocked dependencies
- Fast execution
- Component behavior validation

**Example Components Tested:**
- `EmailForm.spec.tsx` - Form validation, submission, user interactions
- `ContactList.spec.tsx` - List rendering, filtering, sorting, pagination

**Run:** `npm test`

### 2. End-to-End Tests (Playwright)

**Location:** `tests/e2e/`

**Coverage:** Complete user workflows across pages

**Key Features:**
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Authentication flows
- WebSocket mocking
- Network request interception

**Test Suites:**
- `email-personalization.spec.ts` - AI email generation workflow
- `contacts-management.spec.ts` - Contact CRUD operations
- `calling-flow.spec.ts` - AI-powered calling features
- `mobile-responsive.spec.ts` - Mobile device testing

**Run:** `npm run test:e2e`

### 3. Visual Regression Tests

**Location:** `tests/visual/`

**Coverage:** UI consistency across changes

**Key Features:**
- Screenshot comparison
- Multiple viewport sizes
- Theme testing (light/dark)
- Component visual states

**Run:** `npm run test:visual`

### 4. Accessibility Tests

**Location:** `tests/accessibility/`

**Coverage:** WCAG compliance and keyboard navigation

**Key Features:**
- Axe-core integration
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast validation
- ARIA attributes verification

**Run:** `npm run test:a11y`

### 5. API Contract Tests

**Location:** `tests/contracts/`

**Coverage:** Frontend-backend API compatibility

**Key Features:**
- Schema validation with Zod
- Response format verification
- Status code validation
- Error handling testing

**Run:** `npm run test:contracts`

### 6. Performance Testing

**Tool:** Lighthouse CI

**Metrics Tracked:**
- Performance score (target: 90+)
- Accessibility score (target: 90+)
- Best practices score (target: 90+)
- SEO score (target: 80+)

## CI/CD Integration

### GitHub Actions Workflows

1. **Main Test Pipeline** (`.github/workflows/playwright.yml`)
   - Triggers on push/PR
   - Runs all E2E tests
   - Cross-browser matrix
   - Test sharding for speed
   - Artifact upload for failures

2. **Code Coverage** (`.github/workflows/coverage.yml`)
   - Enforces coverage thresholds
   - Uploads to Codecov
   - PR comments with coverage report

3. **Lighthouse CI** (`.github/workflows/lighthouse.yml`)
   - Performance audits
   - Accessibility checks
   - PR comments with scores

4. **Visual Regression** (`.github/workflows/visual-regression.yml`)
   - Screenshot comparisons
   - Approval workflow for changes

5. **Slack Notifications** (`.github/workflows/notify-slack.yml`)
   - Failure notifications
   - Links to failed runs

6. **API Monitoring** (`.github/workflows/api-monitor.yml`)
   - Hourly health checks
   - Performance tracking
   - Automated issue creation

## Local Development

### Pre-commit Hooks (Husky + lint-staged)

Automatically runs on `git commit`:
- ESLint fixes
- Prettier formatting
- TypeScript type checking

### Running Tests Locally

```bash
# Unit tests
npm test                    # Run once
npm run test:watch         # Watch mode

# E2E tests
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive UI

# Specific test suites
npm run test:e2e -- --grep "email"  # Run email tests only
npm run test:e2e -- --project=chromium  # Chrome only

# Visual tests
npm run test:visual        # Run visual regression
npm run test:visual:update # Update snapshots

# Coverage
npm test -- --coverage     # Generate coverage report
```

## Test Configuration

### Jest Configuration (`jest.config.ts`)

```typescript
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85
    }
  }
}
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
{
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 4 : undefined,
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
}
```

## Best Practices

### Writing Unit Tests

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should update form on input', async () => {
     // Arrange
     render(<EmailForm />);
     
     // Act
     await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
     
     // Assert
     expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
   });
   ```

2. **Test User Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state
   - Use accessible queries

3. **Mock External Dependencies**
   ```typescript
   jest.mock('@/lib/api-client', () => ({
     apiClient: { post: jest.fn() }
   }));
   ```

### Writing E2E Tests

1. **Use Page Object Model**
   ```typescript
   class EmailPage {
     constructor(private page: Page) {}
     
     async fillForm(data: FormData) {
       await this.page.fill('[name="subject"]', data.subject);
       await this.page.fill('[name="body"]', data.body);
     }
   }
   ```

2. **Wait for Stability**
   ```typescript
   await page.waitForLoadState('domcontentloaded');
   await expect(element).toBeVisible();
   ```

3. **Handle Flakiness**
   - Use explicit waits
   - Mock external services
   - Retry failed tests

### Writing Visual Tests

1. **Mask Dynamic Content**
   ```typescript
   await page.screenshot({
     mask: [page.locator('.timestamp')],
     animations: 'disabled'
   });
   ```

2. **Test Multiple States**
   - Default state
   - Hover/focus states
   - Error states
   - Loading states

## Debugging Tests

### Unit Tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Use "Jest: Debug" launch configuration
```

### E2E Tests
```bash
# Run with headed browser
npm run test:e2e -- --headed

# Debug specific test
npm run test:e2e -- --debug

# Pause on failure
await page.pause(); // In test code
```

### View Test Reports
- **Coverage:** `open coverage/lcov-report/index.html`
- **Playwright:** `npx playwright show-report`
- **Lighthouse:** Check GitHub Actions artifacts

## Monitoring & Alerts

### API Health Monitoring
- Runs hourly via GitHub Actions
- Monitors key endpoints
- Tracks response times
- Creates GitHub issues for failures
- Sends Slack notifications

### Performance Budgets
- Bundle size limits
- Lighthouse score thresholds
- Response time requirements

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Increase timeouts
   - Add explicit waits
   - Check for race conditions

2. **Screenshot Differences**
   - Update snapshots: `npm run test:visual:update`
   - Check for font rendering differences
   - Mask dynamic content

3. **Coverage Gaps**
   - Run coverage locally first
   - Check branch coverage
   - Add tests for edge cases

## Future Improvements

1. **Mutation Testing** - Verify test quality
2. **Load Testing** - K6 or Artillery integration
3. **Security Testing** - OWASP ZAP integration
4. **Synthetic Monitoring** - Production user flow monitoring
5. **Test Data Management** - Centralized test data factory

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Axe DevTools](https://www.deque.com/axe/devtools/)