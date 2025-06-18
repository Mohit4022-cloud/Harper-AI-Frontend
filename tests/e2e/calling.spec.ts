/**
 * E2E Tests for Calling Page
 * 
 * This test suite validates the AI-powered calling functionality.
 * - Polls dev server before tests
 * - Mocks call initiation and status APIs
 * - Tests call flow from start to connected state
 */

import { test, expect, Page } from '@playwright/test';

// Global timeout constants
const NAV_TIMEOUT = 15000;
const ACTION_TIMEOUT = 10000;
const SERVER_WAIT_TIMEOUT = 30000;

// Helper function to wait for dev server
async function waitForServer(page: Page) {
  const startTime = Date.now();
  let lastError;
  
  while (Date.now() - startTime < SERVER_WAIT_TIMEOUT) {
    try {
      const response = await page.request.get('http://localhost:3000/login', {
        timeout: 5000
      });
      if (response.ok()) {
        console.log('Dev server is ready');
        return;
      }
    } catch (error) {
      lastError = error;
      if (!page.isClosed()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }
  }
  
  throw new Error(`Dev server not available after ${SERVER_WAIT_TIMEOUT}ms. Last error: ${lastError}`);
}

// Helper function to login and navigate
async function loginAndNavigateToCalling(page: Page) {
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
  await page.goto('/calling', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForSelector('h1', { timeout: NAV_TIMEOUT });
}

test.describe('Calling Page', () => {
  test.setTimeout(60000);
  
  const consoleMessages: string[] = [];
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Checking dev server for calling tests...');
    await waitForServer(page);
    
    await page.close();
    await context.close();
  });
  
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
    
    // Mock call initiation API
    await context.route('**/api/call/initiate', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          callId: 'test-call-123',
          status: 'initiating',
          message: 'Call initiated successfully'
        })
      });
    });
    
    // Mock call status API
    await context.route('**/api/call/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          callId: 'test-call-123',
          status: 'connected',
          duration: '00:00:15',
          participant: {
            name: 'John Doe',
            phone: '+1234567890'
          }
        })
      });
    });
    
    // Mock Twilio token endpoint
    await context.route('**/api/twilio/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-twilio-token',
          identity: 'test-user'
        })
      });
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

  test('Calling page - displays start call button', async ({ page }) => {
    await loginAndNavigateToCalling(page);
    
    // Assert page title
    await expect(page.locator('h1')).toContainText(/Calling|Call|AI.*Call/i, { timeout: ACTION_TIMEOUT });
    
    // Assert start call button exists
    const startCallButton = page.locator('button:has-text("Start Call"), button:has-text("Make Call"), button:has-text("Call")').first();
    await expect(startCallButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Start call flow - initiating to connected', async ({ page }) => {
    await loginAndNavigateToCalling(page);
    
    // Enter phone number
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="Phone"]').first();
    await phoneInput.fill('+1234567890', { timeout: ACTION_TIMEOUT });
    
    // Click start call button
    const startCallButton = page.locator('button:has-text("Start Call"), button:has-text("Make Call"), button:has-text("Call")').first();
    await startCallButton.click({ timeout: ACTION_TIMEOUT });
    
    // Verify spinner/loading state appears
    const spinner = page.locator('.spinner, .loading, [data-testid="loading"], text=Connecting').first();
    await expect(spinner).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Wait for connected state
    await page.waitForTimeout(2000); // Simulate connection time
    
    // Verify connected UI
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Call controls - mute/unmute', async ({ page }) => {
    await loginAndNavigateToCalling(page);
    
    // Start a call first
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]').first();
    await phoneInput.fill('+1234567890', { timeout: ACTION_TIMEOUT });
    
    const startCallButton = page.locator('button:has-text("Start Call"), button:has-text("Call")').first();
    await startCallButton.click({ timeout: ACTION_TIMEOUT });
    
    // Wait for connected state
    await page.waitForSelector('text=Connected', { timeout: ACTION_TIMEOUT });
    
    // Find mute button
    const muteButton = page.locator('button:has-text("Mute"), button[aria-label*="mute"], button[data-testid="mute"]').first();
    await expect(muteButton).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Click mute
    await muteButton.click({ timeout: ACTION_TIMEOUT });
    
    // Verify muted state
    await expect(page.locator('text=Muted, button:has-text("Unmute")')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Call controls - end call', async ({ page, context }) => {
    // Mock end call API
    await context.route('**/api/call/end', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          callId: 'test-call-123',
          status: 'ended',
          duration: '00:02:30'
        })
      });
    });
    
    await loginAndNavigateToCalling(page);
    
    // Start a call
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]').first();
    await phoneInput.fill('+1234567890', { timeout: ACTION_TIMEOUT });
    
    const startCallButton = page.locator('button:has-text("Start Call"), button:has-text("Call")').first();
    await startCallButton.click({ timeout: ACTION_TIMEOUT });
    
    // Wait for connected state
    await page.waitForSelector('text=Connected', { timeout: ACTION_TIMEOUT });
    
    // Find end call button
    const endCallButton = page.locator('button:has-text("End Call"), button:has-text("Hang Up"), button[aria-label*="end"]').first();
    await expect(endCallButton).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Click end call
    await endCallButton.click({ timeout: ACTION_TIMEOUT });
    
    // Verify call ended
    await expect(page.locator('text=Call ended, text=ended')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Call history - displays recent calls', async ({ page, context }) => {
    // Mock call history API
    await context.route('**/api/calls/history', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          calls: [
            {
              id: '1',
              phone: '+1234567890',
              duration: '00:05:23',
              date: new Date().toISOString(),
              status: 'completed'
            },
            {
              id: '2',
              phone: '+0987654321',
              duration: '00:02:15',
              date: new Date().toISOString(),
              status: 'completed'
            }
          ]
        })
      });
    });
    
    await loginAndNavigateToCalling(page);
    
    // Look for call history section
    const historySection = page.locator('text=Recent Calls, text=Call History, text=History').first();
    await expect(historySection).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Verify call history entries
    await expect(page.locator('text=+1234567890')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=00:05:23')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Upload contacts for calling', async ({ page }) => {
    await loginAndNavigateToCalling(page);
    
    // Create test CSV
    const csvContent = `name,phone
John Doe,+1234567890
Jane Smith,+0987654321`;
    const csvBuffer = Buffer.from(csvContent);
    
    // Find file input
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'call-list.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Verify contacts loaded
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=+1234567890')).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Verify call buttons for each contact
    const callButtons = page.locator('button:has-text("Call")');
    await expect(callButtons).toHaveCount(2, { timeout: ACTION_TIMEOUT });
  });
});