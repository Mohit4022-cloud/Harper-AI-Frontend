/**
 * Accessibility Testing for Email Personalization Page
 * 
 * This test suite uses axe-playwright to detect accessibility violations.
 * - Runs a11y checks on initial page load
 * - Re-runs checks after modal interactions
 * - Fails on any accessibility violations
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test.describe('Email Page Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock APIs for consistent behavior
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

  test('Email page - initial load accessibility', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Wait for page to fully render
    await page.waitForTimeout(2000);
    
    // Run accessibility check
    const results = await new AxeBuilder({ page }).analyze();
    
    // Log any violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:');
      results.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        console.log(`   Affected elements: ${violation.nodes.length}`);
      });
    }
    
    // Assert no violations
    expect(results.violations).toHaveLength(0);
  });

  test('Help modal - accessibility check', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Click Help button to open modal
    const helpButton = page.locator('button:has-text("Help")');
    await helpButton.click({ timeout: 10000 });
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .help-modal, .modal', { timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for animation
    
    // Run accessibility check with modal open
    const results = await new AxeBuilder({ page }).analyze();
    
    // Log violations if any
    if (results.violations.length > 0) {
      console.log('Accessibility violations in Help modal:');
      results.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Affected elements: ${violation.nodes.length}`);
      });
    }
    
    // Assert no violations
    expect(results.violations).toHaveLength(0);
  });

  test('Form controls - accessibility check', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Focus on form elements to ensure they're interactive
    await page.focus('input[placeholder*="Gemini API Key"]');
    await page.focus('select[name="tone"], [data-testid="tone-select"]');
    
    // Run accessibility check focused on form region
    const formRegion = page.locator('form, [role="form"], .settings-panel').first();
    const results = await new AxeBuilder({ page })
      .include(formRegion)
      .analyze();
    
    // Assert no violations in form controls
    expect(results.violations).toHaveLength(0);
  });

  test('Data table - accessibility check', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Upload CSV to populate table
    const csvContent = `name,email,company,title
John Doe,john@example.com,Acme Corp,CEO
Jane Smith,jane@example.com,Tech Co,CTO`;
    const csvBuffer = Buffer.from(csvContent);
    
    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles({
      name: 'test-contacts.csv',
      mimeType: 'text/csv',
      buffer: csvBuffer
    });
    
    // Wait for table to populate
    await page.waitForSelector('text=John Doe', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Run accessibility check on table region
    const tableRegion = page.locator('table, [role="table"], .data-table').first();
    const results = await new AxeBuilder({ page })
      .include(tableRegion)
      .analyze();
    
    // Log any table-specific violations
    if (results.violations.length > 0) {
      console.log('Table accessibility violations:');
      results.violations.forEach(v => console.log(`- ${v.description}`));
    }
    
    // Assert no violations
    expect(results.violations).toHaveLength(0);
  });

  test('Color contrast - accessibility check', async ({ page }) => {
    await loginAndNavigateToEmail(page);
    
    // Run color contrast specific check
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag2aaa'])
      .analyze();
    
    // Filter for color contrast violations
    const contrastViolations = results.violations.filter(v => 
      v.id.includes('color-contrast') || v.tags.includes('color-contrast')
    );
    
    if (contrastViolations.length > 0) {
      console.log('Color contrast violations found:');
      contrastViolations.forEach(v => {
        console.log(`- ${v.description}: ${v.nodes.length} elements affected`);
      });
    }
    
    // Assert no color contrast violations
    expect(contrastViolations).toHaveLength(0);
  });
});