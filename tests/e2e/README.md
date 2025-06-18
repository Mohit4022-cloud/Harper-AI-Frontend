# E2E Test Suite Documentation

## Email Personalization Tests

The `email-personalization.spec.ts` file contains comprehensive end-to-end tests for the AI Email Personalization feature.

### Test Coverage

1. **Gemini API Key Persistence**
   - Tests saving and persisting API keys across page reloads
   - Verifies preset functionality

2. **Gemini Connection Check**
   - Tests successful and failed API connections
   - Verifies UI feedback for connection status

3. **Performance & Session Stability**
   - Measures page load performance (< 3 seconds)
   - Tests session persistence after 2 minutes of inactivity

4. **Button Interactions**
   - Reset: Verifies settings reset to defaults
   - Help: Tests help modal/tooltip display
   - Generate Test Data: Validates test data generation
   - Template CSV: Tests CSV template download
   - Upload CSV: Validates CSV upload and parsing
   - Send Now: Tests scheduling dropdown
   - Generate Emails: Tests email generation flow

5. **Full Integration Flow**
   - Complete end-to-end test from setup to email generation

### Running the Tests

```bash
# Run all email personalization tests
npx playwright test email-personalization.spec.ts

# Run specific test
npx playwright test email-personalization.spec.ts -g "Gemini API Key Persistence"

# Run with visible browser
npx playwright test email-personalization.spec.ts --headed

# Run with specific browser
npx playwright test email-personalization.spec.ts --project=chromium
```

### Known Issues

- Tests require authentication via login page
- Dev server must be running on http://localhost:3000
- Some tests may timeout if the application is slow to respond

### Test Structure

The tests use:
- Page Object pattern helpers for common actions
- API mocking for external services
- Flexible selectors to handle UI variations
- Proper wait conditions and timeouts