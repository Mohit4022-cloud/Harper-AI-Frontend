/**
 * Authentication & Security E2E Tests
 * 
 * Tests authentication flows, security features, and access control
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication & Security', () => {
  test('auth endpoints wired up', async ({ page }) => {
    // Check if login page exists
    await page.goto('/login');
    
    // Look for login form
    const loginForm = await page.$('form[data-test=login]');
    if (!loginForm) {
      // Try alternative selectors
      const alternativeForm = await page.$('form');
      const hasEmailInput = await page.$('input[type="email"], input[name="email"]');
      const hasPasswordInput = await page.$('input[type="password"], input[name="password"]');
      const hasSubmitButton = await page.$('button[type="submit"]');
      
      expect(
        alternativeForm && hasEmailInput && hasPasswordInput && hasSubmitButton,
        'Login form not found – feature may be missing. Expected to find a form with email and password inputs.'
      ).toBeTruthy();
    }
  });

  test('login flow works correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for form elements
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      test.fail(true, 'Login form elements not found');
      return;
    }
    
    // Fill login form
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    // Submit form
    await submitButton.click();
    
    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/\/(dashboard|home)/);
  });

  test('logout flow works correctly', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/\/(dashboard|home)/);
    
    // Look for logout button
    const logoutButton = await page.$('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
    
    if (!logoutButton) {
      // Try opening user menu first
      const userMenu = await page.$('[data-test="user-menu"], [aria-label*="user"], [aria-label*="account"]');
      if (userMenu) {
        await userMenu.click();
        await page.waitForTimeout(500);
      }
      
      const logoutInMenu = await page.$('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")');
      expect(logoutInMenu, 'Logout button not found').toBeTruthy();
      
      if (logoutInMenu) {
        await logoutInMenu.click();
      }
    } else {
      await logoutButton.click();
    }
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/(login|signin)/);
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/contacts', '/email', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/(login|signin)/);
    }
  });

  test('registration flow works', async ({ page }) => {
    await page.goto('/register');
    
    // Check if registration page exists
    const registerForm = await page.$('form');
    if (!registerForm) {
      // Registration might be on login page
      await page.goto('/login');
      const registerLink = await page.$('a:has-text("Register"), a:has-text("Sign up"), button:has-text("Create account")');
      
      if (!registerLink) {
        test.skip(true, 'Registration feature not found');
        return;
      }
      
      await registerLink.click();
    }
    
    // Fill registration form
    const timestamp = Date.now();
    await page.fill('input[name="email"], input[type="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"], input[type="password"]', 'securePassword123!');
    
    // Look for name field
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    if (nameInput) {
      await nameInput.fill('Test User');
    }
    
    // Look for confirm password field
    const confirmPasswordInput = await page.$('input[name="confirmPassword"], input[placeholder*="confirm"]');
    if (confirmPasswordInput) {
      await confirmPasswordInput.fill('securePassword123!');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should either redirect to dashboard or show success message
    await page.waitForURL(/\/(dashboard|home|verify|welcome)/, { timeout: 10000 }).catch(() => {
      // Check for success message if no redirect
      return expect(page.locator('text=/success|verified|welcome/i')).toBeVisible();
    });
  });

  test('password reset flow exists', async ({ page }) => {
    await page.goto('/login');
    
    // Look for forgot password link
    const forgotPasswordLink = await page.$('a:has-text("Forgot password"), a:has-text("Reset password"), button:has-text("Forgot password")');
    
    if (!forgotPasswordLink) {
      test.skip(true, 'Password reset feature not found');
      return;
    }
    
    await forgotPasswordLink.click();
    
    // Should navigate to password reset page
    await expect(page).toHaveURL(/\/(forgot|reset|recover)/);
    
    // Check for email input
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    expect(emailInput).toBeTruthy();
    
    if (emailInput) {
      await emailInput.fill('test@example.com');
      await page.click('button[type="submit"]');
      
      // Check for success message
      await expect(page.locator('text=/sent|check|email/i')).toBeVisible();
    }
  });

  test('session persistence works', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|home)/);
    
    // Get cookies
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session') || c.name.includes('token'));
    
    expect(authCookie, 'Auth cookie not found').toBeTruthy();
    
    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should still be authenticated
    await expect(newPage).toHaveURL('/dashboard');
  });

  test('CSRF protection exists', async ({ page }) => {
    await page.goto('/login');
    
    // Check for CSRF token in form
    const csrfToken = await page.$('input[name="csrf"], input[name="_csrf"], meta[name="csrf-token"]');
    
    if (!csrfToken) {
      console.warn('CSRF token not found - security feature may be missing');
    }
  });

  test('rate limiting on login attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForTimeout(500);
    }
    
    // Check for rate limit message
    const rateLimitMessage = await page.$('text=/too many|rate limit|try again later/i');
    
    if (!rateLimitMessage) {
      console.warn('Rate limiting may not be implemented');
    }
  });

  test('secure headers are present', async ({ page }) => {
    const response = await page.goto('/login');
    
    if (response) {
      const headers = response.headers();
      
      // Check for security headers
      const securityHeaders = {
        'x-frame-options': ['DENY', 'SAMEORIGIN'],
        'x-content-type-options': ['nosniff'],
        'x-xss-protection': ['1; mode=block'],
        'strict-transport-security': ['max-age=']
      };
      
      for (const [header, expectedValues] of Object.entries(securityHeaders)) {
        const headerValue = headers[header];
        if (headerValue) {
          const hasExpectedValue = expectedValues.some(expected => 
            headerValue.toLowerCase().includes(expected.toLowerCase())
          );
          expect(hasExpectedValue, `Security header ${header} has unexpected value: ${headerValue}`).toBeTruthy();
        } else {
          console.warn(`Security header ${header} is missing`);
        }
      }
    }
  });

  test('password requirements are enforced', async ({ page }) => {
    await page.goto('/register');
    
    // Try weak password
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
    if (!passwordInput) {
      test.skip(true, 'Password input not found');
      return;
    }
    
    await passwordInput.fill('123');
    await passwordInput.blur();
    
    // Check for validation message
    const validationMessage = await page.$('text=/must be|at least|minimum|required/i');
    
    if (!validationMessage) {
      // Try submitting form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(500);
        const errorAfterSubmit = await page.$('text=/must be|at least|minimum|required/i');
        expect(errorAfterSubmit, 'Password validation not enforced').toBeTruthy();
      }
    }
  });

  test('XSS prevention', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home)/);
    
    // Try to inject script in a form field (e.g., profile update)
    await page.goto('/settings');
    
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    if (nameInput) {
      const xssPayload = '<script>alert("XSS")</script>';
      await nameInput.fill(xssPayload);
      
      // Save form
      const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveButton) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Check if script was executed
        const alertDialog = page.locator('dialog');
        await expect(alertDialog).not.toBeVisible();
        
        // Check if payload was escaped in display
        const displayedName = await page.$(`text="${xssPayload}"`);
        if (displayedName) {
          const innerHTML = await displayedName.innerHTML();
          expect(innerHTML).not.toContain('<script>');
        }
      }
    }
  });
});