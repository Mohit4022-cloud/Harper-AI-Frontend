import { test, expect } from '@playwright/test';

test.describe('Harper AI - Calling Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any required test data or mocks
    await page.goto('/');
  });

  test('complete calling flow: login → navigate to calling → make call → end call', async ({ page }) => {
    // Step 1: Login
    await test.step('Login to the application', async () => {
      await page.goto('/login');
      
      // Use dev bypass for faster testing
      if (process.env.NODE_ENV === 'development') {
        await page.goto('/dev-login');
        await page.click('button:has-text("Login as Admin")');
      } else {
        await page.fill('input[name="email"]', 'admin@harperai.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
      }
      
      // Wait for dashboard to load
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('h1')).toContainText('Dashboard');
    });

    // Step 2: Navigate to Calling page
    await test.step('Navigate to calling page', async () => {
      // Click on Calling in sidebar
      await page.click('nav a:has-text("Calling")');
      
      // Verify we're on the calling page
      await expect(page).toHaveURL(/.*calling/);
      await expect(page.locator('h1')).toContainText('AI-Powered Calling');
      
      // Wait for the dialer to be visible
      await expect(page.locator('[data-testid="dialer"]')).toBeVisible();
    });

    // Step 3: Make a call
    await test.step('Initiate a call', async () => {
      // Enter phone number
      const phoneInput = page.locator('input[placeholder*="phone"]');
      await phoneInput.fill('+1234567890');
      
      // Click call button
      await page.click('button:has-text("Call")');
      
      // Wait for call to connect (mock)
      await expect(page.locator('text=Call Active')).toBeVisible({ timeout: 5000 });
      
      // Verify call timer is running
      await expect(page.locator('text=/\\d+:\\d{2}/')).toBeVisible();
      
      // Verify transcript is being displayed
      await expect(page.locator('[data-testid="transcript-display"]')).toBeVisible();
      
      // Verify coaching cards appear
      await expect(page.locator('[data-testid="coaching-cards"]')).toBeVisible({ timeout: 20000 });
    });

    // Step 4: Interact with call controls
    await test.step('Test call controls', async () => {
      // Test mute
      const muteButton = page.locator('button[aria-label="Toggle mute"]');
      await muteButton.click();
      await expect(muteButton).toHaveAttribute('data-muted', 'true');
      
      // Unmute
      await muteButton.click();
      await expect(muteButton).toHaveAttribute('data-muted', 'false');
      
      // Test hold (if available)
      const holdButton = page.locator('button[aria-label="Toggle hold"]');
      if (await holdButton.isVisible()) {
        await holdButton.click();
        await expect(holdButton).toHaveAttribute('data-on-hold', 'true');
        await holdButton.click();
        await expect(holdButton).toHaveAttribute('data-on-hold', 'false');
      }
    });

    // Step 5: End the call
    await test.step('End the call', async () => {
      // Click end call button
      await page.click('button:has-text("End Call")');
      
      // Verify call has ended
      await expect(page.locator('text=Call Active')).not.toBeVisible();
      
      // Verify we can see call history
      await page.click('button:has-text("History")');
      await expect(page.locator('[data-testid="call-history"]')).toBeVisible();
      
      // Verify the recent call appears in history
      await expect(page.locator('text=+1234567890')).toBeVisible();
    });

    // Step 6: Verify analytics updated
    await test.step('Check call analytics', async () => {
      // Navigate to reports
      await page.click('nav a:has-text("Reports")');
      await expect(page).toHaveURL(/.*reports/);
      
      // Verify metrics are displayed
      await expect(page.locator('text=Total Calls')).toBeVisible();
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    });
  });

  test('test AI coaching features during call', async ({ page }) => {
    // Quick login
    await page.goto('/dev-login');
    await page.click('button:has-text("Login as SDR")');
    
    // Navigate to calling
    await page.goto('/calling');
    
    // Start a call
    await page.fill('input[placeholder*="phone"]', '+19876543210');
    await page.click('button:has-text("Call")');
    
    // Wait for coaching cards
    await expect(page.locator('[data-testid="coaching-cards"]')).toBeVisible({ timeout: 20000 });
    
    // Verify coaching card content
    const coachingCard = page.locator('[data-testid="coaching-card"]').first();
    await expect(coachingCard).toContainText(/tip|warning|suggestion/i);
    
    // Dismiss a coaching card
    await coachingCard.locator('button[aria-label="Dismiss"]').click();
    await expect(coachingCard).not.toBeVisible();
    
    // Verify sentiment analysis
    await expect(page.locator('[data-testid="sentiment-indicator"]')).toBeVisible();
    
    // End call
    await page.click('button:has-text("End Call")');
  });

  test('export reports functionality', async ({ page }) => {
    // Quick login
    await page.goto('/dev-login');
    await page.click('button:has-text("Login as Admin")');
    
    // Navigate to reports
    await page.goto('/reports');
    
    // Select export format
    await page.click('[data-testid="export-format-select"]');
    await page.click('text=CSV');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/harper-ai-report.*\.csv/);
    
    // Test other formats
    await page.click('[data-testid="export-format-select"]');
    await page.click('text=Excel');
    await page.click('button:has-text("Export")');
    
    // Verify success notification
    await expect(page.locator('text=Report exported successfully')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('calling page works on mobile', async ({ page }) => {
    await page.goto('/dev-login');
    await page.click('button:has-text("Login as SDR")');
    
    await page.goto('/calling');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verify dialer is accessible
    await expect(page.locator('[data-testid="dialer"]')).toBeVisible();
    
    // Test making a call on mobile
    await page.fill('input[placeholder*="phone"]', '+15551234567');
    await page.click('button:has-text("Call")');
    
    await expect(page.locator('text=Call Active')).toBeVisible();
  });
});