import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../../.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login')
  
  // Fill in credentials
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com')
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123')
  
  // Submit login form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  
  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})