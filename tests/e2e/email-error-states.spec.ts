/**
 * Error State and Edge Case Tests for Email Personalization
 * 
 * This test suite validates error handling and edge cases:
 * - Invalid Gemini API key (401 response)
 * - Malformed CSV upload (missing headers)
 * - Email generation timeout scenarios
 */

import { test, expect, Page } from '@playwright/test';

// Global timeout constants
const NAV_TIMEOUT = 15000;
const ACTION_TIMEOUT = 10000;

// Helper function to login and navigate
async function loginAndNavigateToEmail(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForSelector('input[name="email"]', { timeout: ACTION_TIMEOUT });
  
  await page.fill('input[name="email"]', 'admin@harperai.com', { timeout: ACTION_TIMEOUT });
  await page.fill('input[name="password"]', 'password123', { timeout: ACTION_TIMEOUT });
  
  const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
  await Promise.all([
    page.waitForNavigation({ url: /.*dashboard/, timeout: NAV_TIMEOUT }),
    submitButton.click({ timeout: ACTION_TIMEOUT })
  ]);
  
  await page.waitForTimeout(1000);
  await page.goto('/email', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForSelector('text=AI Email Personalization', { timeout: NAV_TIMEOUT });
}

test.describe('Email Error States and Edge Cases', () => {
  test.setTimeout(60000);
  
  const consoleMessages: string[] = [];
  
  test.beforeEach(async ({ page, context }) => {
    consoleMessages.length = 0;
    
    // Console logging
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'warning' || msg.type() === 'error') {
        console.log(message);
      }
    });
    
    page.on('pageerror', err => {
      const message = `PAGE ERROR: ${err.message}`;
      consoleMessages.push(message);
      console.error(message);
    });
    
    // Mock WebSocket to prevent errors
    await context.route('ws://localhost:3000/ws', route => {
      route.abort();
    });
    
    // Mock auth
    await context.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@harperai.com',
        name: 'Test User',
        role: 'admin'
      }));
    });
  });
  
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      console.log('Last 10 console messages:');
      console.log(consoleMessages.slice(-10).join('\n'));
    }
  });

  test('Invalid Gemini Key - 401 error', async ({ page, context }) => {
    // Mock Gemini connect to return 401
    await context.route('**/api/gemini/connect', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid API key'
        })
      });
    });
    
    await loginAndNavigateToEmail(page);
    
    // Enter invalid API key
    const geminiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await geminiKeyInput.fill('invalid-api-key-12345', { timeout: ACTION_TIMEOUT });
    
    // Try to save or validate
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Connect"), button:has-text("Validate")').first();
    if (await saveButton.isVisible({ timeout: 2000 })) {
      await saveButton.click();
    } else {
      // Trigger validation by blur
      await geminiKeyInput.blur();
    }
    
    // Assert error banner appears
    const errorBanner = page.locator(
      'text=Invalid API key, text=Unauthorized, text=401, [role="alert"], .error-banner, .error-message'
    ).first();
    await expect(errorBanner).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Verify specific error text
    await expect(page.locator('text=/Invalid.*API.*key|Unauthorized|Authentication.*failed/i')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Malformed CSV Upload - missing headers', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Create malformed CSV (missing required headers)
    const malformedCSV = `firstname,lastname,emailaddress
John,Doe,john@example.com
Jane,Smith,jane@example.com`;
    const csvBuffer = Buffer.from(malformedCSV);
    
    // Upload malformed CSV
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'malformed.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Assert upload failure message
    const errorMessage = page.locator(
      'text=/Missing.*required.*headers|Invalid.*CSV.*format|name.*email.*required/i, [role="alert"], .upload-error'
    ).first();
    await expect(errorMessage).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Verify no contacts were loaded
    const contactsTable = page.locator('table, [role="table"], .contacts-table');
    const tableRows = contactsTable.locator('tbody tr, [role="row"]');
    await expect(tableRows).toHaveCount(0, { timeout: ACTION_TIMEOUT });
  });

  test('Email Generation Timeout - 15s delay', async ({ page, context }) => {
    // Mock email generation with 15 second delay
    await context.route('**/api/email/generate', async route => {
      // Wait 15 seconds before responding
      await new Promise(resolve => setTimeout(resolve, 15000));
      route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Gateway Timeout',
          message: 'Email generation timed out'
        })
      });
    });
    
    await loginAndNavigateToEmail(page);
    
    // Upload valid CSV
    const csvContent = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO`;
    const csvBuffer = Buffer.from(csvContent);
    
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Wait for contacts to load
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Enter Gemini key
    await page.locator('input[placeholder*="Gemini API Key"]').fill('valid-key', { timeout: ACTION_TIMEOUT });
    
    // Click generate emails
    const generateButton = page.locator('button:has-text("Generate Emails"), button:has-text("Generate")').filter({ hasNotText: 'Test Data' });
    await generateButton.click({ timeout: ACTION_TIMEOUT });
    
    // Assert spinner appears immediately
    const spinner = page.locator('.spinner, .loading, [data-testid="loading"], text=Generating').first();
    await expect(spinner).toBeVisible({ timeout: 5000 });
    
    // Wait for timeout error (should appear after 15s)
    const timeoutError = page.locator(
      'text=/Timeout|timed.*out|took.*too.*long|Generation.*failed/i, [role="alert"], .timeout-error'
    ).first();
    await expect(timeoutError).toBeVisible({ timeout: 20000 }); // Give extra time for timeout + UI update
  });

  test('Empty CSV Upload', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Create empty CSV (headers only)
    const emptyCSV = `name,email,company,title`;
    const csvBuffer = Buffer.from(emptyCSV);
    
    // Upload empty CSV
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'empty.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Wait for processing
    await page.waitForTimeout(1000);
    
    // Assert warning message
    const warningMessage = page.locator(
      'text=/No.*contacts.*found|Empty.*CSV|No.*data.*rows/i, [role="alert"], .warning-message'
    ).first();
    await expect(warningMessage).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Network Error - API unreachable', async ({ page, context }) => {
    // Mock network error for email generation
    await context.route('**/api/email/personalize', route => {
      route.abort('failed');
    });
    
    await loginAndNavigateToEmail(page);
    
    // Upload CSV and try to generate
    const csvContent = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO`;
    const csvBuffer = Buffer.from(csvContent);
    
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.locator('input[placeholder*="Gemini API Key"]').fill('valid-key', { timeout: ACTION_TIMEOUT });
    
    const generateButton = page.locator('button:has-text("Generate Emails"), button:has-text("Generate")').filter({ hasNotText: 'Test Data' });
    await generateButton.click({ timeout: ACTION_TIMEOUT });
    
    // Assert network error message
    const networkError = page.locator(
      'text=/Network.*error|Connection.*failed|Unable.*to.*reach.*server/i, [role="alert"], .network-error'
    ).first();
    await expect(networkError).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Rate Limit Error - 429 response', async ({ page, context }) => {
    // Mock rate limit error
    await context.route('**/api/email/personalize', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        })
      });
    });
    
    await loginAndNavigateToEmail(page);
    
    // Upload CSV and generate
    const csvContent = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO`;
    const csvBuffer = Buffer.from(csvContent);
    
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await page.locator('input[placeholder*="Gemini API Key"]').fill('valid-key', { timeout: ACTION_TIMEOUT });
    
    const generateButton = page.locator('button:has-text("Generate Emails"), button:has-text("Generate")').filter({ hasNotText: 'Test Data' });
    await generateButton.click({ timeout: ACTION_TIMEOUT });
    
    // Assert rate limit error
    const rateLimitError = page.locator(
      'text=/Rate.*limit|Too.*many.*requests|Try.*again.*later/i, [role="alert"], .rate-limit-error'
    ).first();
    await expect(rateLimitError).toBeVisible({ timeout: ACTION_TIMEOUT });
  });
});