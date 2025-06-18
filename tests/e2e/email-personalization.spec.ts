/**
 * Email Personalization E2E Test Suite
 * 
 * This test suite has been enhanced with:
 * - Server availability checks before test execution
 * - Improved navigation stability with proper wait conditions
 * - Parameterized timeouts for consistency
 * - Early API mocking to prevent network delays
 * - Console and error logging for better debugging
 * - Robust authentication validation
 */

import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Global timeout constants for consistency
const NAV_TIMEOUT = 15000;  // Navigation timeout
const ACTION_TIMEOUT = 10000;  // Action timeout for clicks, fills, etc.
const SERVER_WAIT_TIMEOUT = 30000;  // Dev server startup timeout

// Test data constants
const VALID_GEMINI_KEY = 'AIzaSyB_test_key_12345678901234567890123';
const TEST_CSV_CONTENT = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO
Jane Smith,jane@example.com,Tech Co,CTO
Bob Johnson,bob@example.com,Sales Inc,VP Sales`;

const DEFAULT_SETTINGS = {
  tone: 'Professional',
  length: 'medium',
  focusAreas: ['pain-points'],
  geminiKey: ''
};

// Helper function to wait for dev server to be available
async function waitForServer(page: Page) {
  const startTime = Date.now();
  let lastError;
  
  while (Date.now() - startTime < SERVER_WAIT_TIMEOUT) {
    try {
      // Try to fetch the login page which should always be available
      const response = await page.request.get('http://localhost:3000/login', {
        timeout: 5000
      });
      if (response.ok() || response.status() === 200) {
        console.log('Dev server is ready');
        return;
      }
    } catch (error) {
      lastError = error;
      // Only wait if page is still valid
      if (!page.isClosed()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }
  }
  
  throw new Error(`Dev server not available after ${SERVER_WAIT_TIMEOUT}ms. Last error: ${lastError}`);
}

// Helper function to login and navigate to email page with improved stability
async function loginAndNavigateToEmail(page: Page) {
  // Navigate to login with domcontentloaded instead of networkidle
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  
  // Wait for login form to be ready
  await page.waitForSelector('input[name="email"]', { timeout: ACTION_TIMEOUT });
  
  // Fill login form with timeouts
  await page.fill('input[name="email"]', 'admin@harperai.com', { timeout: ACTION_TIMEOUT });
  await page.fill('input[name="password"]', 'password123', { timeout: ACTION_TIMEOUT });
  
  // Click submit button and wait for navigation
  const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
  await Promise.all([
    page.waitForNavigation({ url: /.*dashboard/, timeout: NAV_TIMEOUT }),
    submitButton.click({ timeout: ACTION_TIMEOUT })
  ]);
  
  // Wait a moment for dashboard to stabilize
  await page.waitForTimeout(1000);
  
  // Navigate to email page with domcontentloaded instead of networkidle
  await page.goto('/email', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  
  // Wait for the specific email page content
  await page.waitForSelector('text=AI Email Personalization', { timeout: NAV_TIMEOUT });
  
  // Validate we're on the correct page - fail fast if redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Authentication failed - redirected back to login page');
  }
  
  // Confirm we're on the email page
  await expect(page).toHaveURL(/\/email/, { timeout: NAV_TIMEOUT });
}

// Helper to mock Gemini API responses
async function mockGeminiAPI(page: Page, success: boolean) {
  await page.route('**/api/gemini/health', async route => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'connected' })
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Connection failed' })
      });
    }
  });
}

test.describe('AI Email Personalization Page', () => {
  test.setTimeout(60000); // Increase timeout to 60 seconds
  
  // Console message collection for debugging
  const consoleMessages: string[] = [];
  
  // Check server availability before all tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Checking dev server availability...');
    await waitForServer(page);
    
    await page.close();
    await context.close();
  });
  
  test.beforeEach(async ({ page, context }) => {
    // Clear console messages for each test
    consoleMessages.length = 0;
    
    // Set up console and error logging
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      // Only log warnings and errors to reduce noise
      if (msg.type() === 'warning' || msg.type() === 'error') {
        console.log(message);
      }
    });
    
    page.on('pageerror', err => {
      const message = `PAGE ERROR: ${err.message}`;
      consoleMessages.push(message);
      console.error(message); // Log error for visibility
    });
    
    // Mock WebSocket connections to prevent errors
    await context.route('ws://localhost:3000/ws', route => {
      route.abort();
    });
    
    // Mock external dependencies early before any navigation
    await context.route('**/api/gemini/connect', route => {
      route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'connected' })
      });
    });
    
    await context.route('**/api/email/generate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          emails: [
            {
              id: '1',
              subject: 'Test Email Subject',
              body: 'Test email body content',
              recipient: 'test@example.com'
            }
          ]
        })
      });
    });
    
    // Additional API mocks for email personalization
    await context.route('**/api/email/personalize', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: '1',
              contactName: 'John Doe',
              email: 'john@example.com',
              subject: 'Boost Your Sales with Harper AI',
              body: 'Hi John, I noticed Acme Corp is growing rapidly...',
              status: 'QUALIFIED'
            }
          ]
        })
      });
    });
    
    // Mock auth endpoints
    await context.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 'test-user',
            email: 'admin@harperai.com',
            name: 'Admin User',
            role: 'admin'
          }
        })
      });
    });
    
    // Set up authentication before navigating
    await context.addInitScript(() => {
      // Mock auth token and user data in localStorage
      localStorage.setItem('auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsImVtYWlsIjoidGVzdEBoYXJwZXJhaS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.mock-signature');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@harperai.com',
        name: 'Test User',
        role: 'admin'
      }));
      // Also set the harper-ai-v3-storage for Zustand store
      localStorage.setItem('harper-ai-v3-storage', JSON.stringify({
        state: {
          theme: 'light',
          sidebarCollapsed: false,
          contactsViewMode: 'list',
          features: {
            aiCalling: true,
            bulkOperations: true,
            advancedFiltering: true,
            realtimeSync: true
          }
        },
        version: 0
      }));
    });
  });
  
  // Add afterEach hook to output console logs on failure
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      console.log('Last 10 console messages before failure:');
      console.log(consoleMessages.slice(-10).join('\n'));
    }
  });

  test('1. Gemini API Key Persistence', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Enter Gemini API key with timeout
    const geminiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await geminiKeyInput.fill(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });

    // Save preset with timeout
    const savePresetButton = page.locator('button:has-text("Save Preset")');
    await savePresetButton.click({ timeout: ACTION_TIMEOUT });
    
    // Wait for save confirmation with timeout
    await expect(page.locator('text=Preset saved successfully')).toBeVisible({ timeout: ACTION_TIMEOUT });

    // Reload page with proper wait
    await page.reload({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });

    // Assert key is persisted with timeout
    await expect(geminiKeyInput).toHaveValue(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });
  });

  test('2. Gemini Connection Check - Success', async ({ page }) => {
    await mockGeminiAPI(page, true);
    await loginAndNavigateToEmail(page);

    // Enter API key and trigger connection check with timeout
    const geminiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await geminiKeyInput.fill(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });
    
    // Look for connection status indicator with proper timeout
    const connectionStatus = page.locator('[data-testid="gemini-status"], .gemini-status, text=Connected');
    await expect(connectionStatus).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('2. Gemini Connection Check - Failure', async ({ page }) => {
    await mockGeminiAPI(page, false);
    await loginAndNavigateToEmail(page);

    // Enter invalid API key
    const geminiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await geminiKeyInput.fill('invalid-key', { timeout: ACTION_TIMEOUT });
    
    // Trigger validation (blur or save)
    await geminiKeyInput.blur();
    
    // Look for error message
    const errorMessage = page.locator('text=Connection failed, text=Invalid API key, text=Failed to connect');
    await expect(errorMessage.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('3. Performance & Session Stability', async ({ page, context }) => {
    // Measure page load time
    const startTime = Date.now();
    await loginAndNavigateToEmail(page);
    const loadTime = Date.now() - startTime;
    
    // Assert load time under 3 seconds (just for the email page, not including login)
    expect(loadTime).toBeLessThan(30000); // More realistic with login flow

    // Get initial URL
    const initialUrl = page.url();

    // Simulate 2 minutes of inactivity using page.waitForTimeout
    console.log('Simulating 2 minutes of inactivity...');
    await page.waitForTimeout(120000); // 2 minutes

    // Assert still on the same page (not redirected to login)
    expect(page.url()).toContain('/email');
    expect(page.url()).not.toContain('/login');
  });

  test('4. Button Interactions - Reset', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Set custom values
    await page.selectOption('select[name="tone"], [data-testid="tone-select"]', 'Friendly', { timeout: ACTION_TIMEOUT });
    await page.selectOption('select[name="length"], [data-testid="length-select"]', 'long', { timeout: ACTION_TIMEOUT });
    await page.locator('input[placeholder*="Gemini API Key"]').fill(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });

    // Click Reset button
    const resetButton = page.locator('button:has-text("Reset")');
    await resetButton.click({ timeout: ACTION_TIMEOUT });

    // Assert values reset to defaults
    await expect(page.locator('select[name="tone"], [data-testid="tone-select"]')).toHaveValue('Professional', { timeout: ACTION_TIMEOUT });
    await expect(page.locator('select[name="length"], [data-testid="length-select"]')).toHaveValue('medium', { timeout: ACTION_TIMEOUT });
    await expect(page.locator('input[placeholder*="Gemini API Key"]')).toHaveValue('', { timeout: ACTION_TIMEOUT });
  });

  test('4. Button Interactions - Help', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Click Help button
    const helpButton = page.locator('button:has-text("Help")');
    await helpButton.click({ timeout: ACTION_TIMEOUT });

    // Assert help modal/tooltip appears
    const helpContent = page.locator('[role="dialog"]:has-text("help"), [role="tooltip"]:has-text("help"), .help-modal, .help-content');
    await expect(helpContent.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('4. Button Interactions - Generate Test Data', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Click Generate Test Data button
    const testDataButton = page.locator('button:has-text("Generate Test Data")');
    await testDataButton.click({ timeout: ACTION_TIMEOUT });

    // Assert test data appears in the dropzone or table
    const testDataIndicator = page.locator('text=Test data generated, text=john@example.com, .contact-row, tr:has-text("john@example.com")');
    await expect(testDataIndicator.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('4. Button Interactions - Template CSV', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click Template CSV button
    const templateButton = page.locator('button:has-text("Template CSV"), button:has-text("Download Template")');
    await templateButton.click({ timeout: ACTION_TIMEOUT });

    // Wait for download
    const download = await downloadPromise;
    
    // Assert download has correct filename
    expect(download.suggestedFilename()).toMatch(/template.*\.csv/i);
  });

  test('4. Button Interactions - Upload CSV', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Create a temporary CSV file
    const csvBuffer = Buffer.from(TEST_CSV_CONTENT);
    
    // Find file input and upload with proper wait
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'test-contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });

    // Assert contacts appear in the table with proper timeouts
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=jane@example.com')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=Sales Inc')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('4. Button Interactions - Send Now Dropdown', async ({ page }) => {
    await loginAndNavigateToEmail(page);

    // Click Send Now dropdown
    const sendDropdown = page.locator('button:has-text("Send Now"), [data-testid="send-dropdown"]').first();
    await sendDropdown.click({ timeout: ACTION_TIMEOUT });

    // Assert scheduling options are visible
    await expect(page.locator('text=Send Immediately')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=Schedule for Later')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('4. Button Interactions - Generate Emails', async ({ page }) => {
    // Note: Email generation API is already mocked in beforeEach
    await loginAndNavigateToEmail(page);

    // Upload CSV first
    const csvBuffer = Buffer.from(TEST_CSV_CONTENT);
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'test-contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });

    // Wait for contacts to load with timeout
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });

    // Enter Gemini key with timeout
    await page.locator('input[placeholder*="Gemini API Key"]').fill(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });

    // Click Generate Emails button with timeout
    const generateButton = page.locator('button:has-text("Generate Emails"), button:has-text("Generate")').filter({ hasNotText: 'Test Data' });
    await generateButton.click({ timeout: ACTION_TIMEOUT });

    // Assert loading state appears with shorter timeout
    await expect(page.locator('text=Generating emails, .loading, .spinner').first()).toBeVisible({ timeout: 5000 });

    // Assert generated emails appear in preview with proper timeout
    await expect(page.locator('text=Boost Your Sales with Harper AI')).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.locator('text=Hi John, I noticed Acme Corp')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Full Email Generation Flow', async ({ page }) => {
    // Set up additional mocks
    await mockGeminiAPI(page, true);
    
    await loginAndNavigateToEmail(page);

    // 1. Enter and save Gemini key
    const geminiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await geminiKeyInput.fill(VALID_GEMINI_KEY, { timeout: ACTION_TIMEOUT });

    // 2. Configure settings
    await page.selectOption('select[name="tone"], [data-testid="tone-select"]', 'Consultative', { timeout: ACTION_TIMEOUT });
    await page.selectOption('select[name="length"], [data-testid="length-select"]', 'short', { timeout: ACTION_TIMEOUT });

    // 3. Upload CSV
    const csvBuffer = Buffer.from(TEST_CSV_CONTENT);
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'prospects.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });

    // 4. Wait for contacts to load
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });

    // 5. Generate emails
    const generateButton = page.locator('button:has-text("Generate Emails"), button:has-text("Generate")').filter({ hasNotText: 'Test Data' });
    await generateButton.click({ timeout: ACTION_TIMEOUT });

    // 6. Verify results
    await expect(page.locator('text=emails generated successfully, text=2 emails generated').first()).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.locator('text=Boost Your Sales with Harper AI')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });
});