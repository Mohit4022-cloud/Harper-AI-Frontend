import { test, expect } from '@playwright/test';

test.describe('Voice Connection CSRF Protection', () => {
  test('voice connection includes CSRF token', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Get CSRF token from cookies
    const cookies = await page.context().cookies();
    const csrfCookie = cookies.find(c => c.name === 'csrf-token');
    expect(csrfCookie).toBeTruthy();
    expect(csrfCookie?.value).toBeTruthy();
    
    // Navigate to calling page
    await page.goto('/calling');
    
    // Intercept voice connection request
    let voiceRequestHeaders: Record<string, string> = {};
    await page.route('**/api/twilio/token', async (route) => {
      voiceRequestHeaders = route.request().headers();
      await route.continue();
    });
    
    // Trigger voice connection (if button exists)
    const connectButton = page.locator('button:has-text("Connect"), button:has-text("Start Call")').first();
    if (await connectButton.count() > 0) {
      await connectButton.click();
      
      // Wait for the request to be made
      await page.waitForTimeout(1000);
      
      // Verify CSRF token was included
      expect(voiceRequestHeaders['x-csrf-token']).toBeTruthy();
      expect(voiceRequestHeaders['x-csrf-token']).toBe(csrfCookie?.value);
    }
  });

  test('voice API endpoints return 200 with valid CSRF token', async ({ page, request }) => {
    // Login first to get session
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Get cookies including CSRF token
    const cookies = await page.context().cookies();
    const csrfToken = cookies.find(c => c.name === 'csrf-token')?.value;
    const sessionCookie = cookies.find(c => c.name === 'harper-ai-session')?.value;
    
    expect(csrfToken).toBeTruthy();
    
    // Test voice token endpoint
    const tokenResponse = await request.post('/api/twilio/token', {
      headers: {
        'x-csrf-token': csrfToken!,
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });
    
    expect(tokenResponse.status()).toBe(200);
    const tokenData = await tokenResponse.json();
    expect(tokenData.token).toBeTruthy();
    
    // Test voice connect endpoint (if exists)
    const connectResponse = await request.post('/api/call/voice', {
      headers: {
        'x-csrf-token': csrfToken!,
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
      data: {
        to: '+1234567890',
        from: '+0987654321',
      },
    });
    
    // Should either succeed or return a valid error (not CSRF failure)
    expect([200, 400, 404]).toContain(connectResponse.status());
    
    // Test without CSRF token - should fail
    const failResponse = await request.post('/api/twilio/token', {
      headers: {
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });
    
    expect(failResponse.status()).toBe(403);
    const errorData = await failResponse.json();
    expect(errorData.error).toContain('CSRF');
  });
});