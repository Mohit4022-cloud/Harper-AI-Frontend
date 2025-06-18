/**
 * Visual Regression Testing for Email Personalization Page
 * 
 * This test captures visual snapshots of the email page to detect UI regressions.
 * - Locks viewport to 1440x900 for consistency
 * - Stores baseline images in tests/e2e/visual/__screenshots__
 * - Focuses on the AI Email Personalization region
 */

import { test, expect } from '@playwright/test';

// Set consistent viewport for visual tests
test.use({
  viewport: { width: 1440, height: 900 },
});

// Helper function to login and navigate
async function loginAndNavigateToEmail(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', 'admin@harperai.com');
  await page.fill('input[name="password"]', 'password123');
  
  const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
  await Promise.all([
    page.waitForNavigation({ url: /.*dashboard/ }),
    submitButton.click()
  ]);
  
  await page.waitForTimeout(1000);
  await page.goto('/email', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=AI Email Personalization', { timeout: 15000 });
}

test.describe('Email Page Visual Regression', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock APIs to ensure consistent data
    await context.route('**/api/gemini/connect', route => {
      route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'connected' })
      });
    });
    
    // Set auth in localStorage
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

  test('Email personalization page - full page snapshot', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('email-page-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Email personalization region - focused snapshot', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Wait for content to stabilize
    await page.waitForTimeout(1000);
    
    // Find the main email personalization content area
    const emailRegion = page.locator('main').filter({ has: page.locator('text=AI Email Personalization') });
    
    // Take screenshot of just the email personalization region
    await expect(emailRegion).toHaveScreenshot('email-personalization-region.png', {
      animations: 'disabled',
    });
  });

  test('Email settings panel - visual snapshot', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Find the settings panel (usually contains tone, length, etc.)
    const settingsPanel = page.locator('[data-testid="email-settings"], .email-settings, form').first();
    
    // Capture settings panel
    await expect(settingsPanel).toHaveScreenshot('email-settings-panel.png', {
      animations: 'disabled',
    });
  });

  test('Email preview area - visual snapshot', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Upload test CSV to trigger preview
    const csvContent = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO`;
    const csvBuffer = Buffer.from(csvContent);
    
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'test-contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Wait for preview area to update
    await page.waitForTimeout(2000);
    
    // Find preview area
    const previewArea = page.locator('[data-testid="email-preview"], .email-preview, .preview-container').first();
    
    // Capture preview area
    await expect(previewArea).toHaveScreenshot('email-preview-area.png', {
      animations: 'disabled',
    });
  });
});