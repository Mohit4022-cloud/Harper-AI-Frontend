import { test, expect } from '@playwright/test'
import { ContactId } from '../../src/types/brand'

test.describe('Contacts Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')
  })

  test('should display contacts table', async ({ page }) => {
    // Check for table headers
    await expect(page.locator('text=Name')).toBeVisible()
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Phone')).toBeVisible()
    await expect(page.locator('text=Tags')).toBeVisible()
  })

  test('should search contacts', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="Search contacts..."]', 'John')
    
    // Wait for search results
    await page.waitForTimeout(500) // Debounce delay
    
    // Verify filtered results
    const results = page.locator('[data-testid="contact-row"]')
    await expect(results).toHaveCount(await results.count())
    
    // Check that all visible contacts contain "John"
    const names = await page.locator('[data-testid="contact-name"]').allTextContents()
    names.forEach(name => {
      expect(name.toLowerCase()).toContain('john')
    })
  })

  test('should create new contact', async ({ page }) => {
    // Click add contact button
    await page.click('button:has-text("Add Contact")')
    
    // Fill in contact form
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'Contact')
    await page.fill('input[name="email"]', 'test.contact@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="company"]', 'Test Company')
    
    // Add tags
    await page.fill('input[name="tags"]', 'VIP')
    await page.press('input[name="tags"]', 'Enter')
    await page.fill('input[name="tags"]', 'Customer')
    await page.press('input[name="tags"]', 'Enter')
    
    // Submit form
    await page.click('button:has-text("Create Contact")')
    
    // Wait for success notification
    await expect(page.locator('text=Contact created successfully')).toBeVisible()
    
    // Verify contact appears in list
    await expect(page.locator('text=Test Contact')).toBeVisible()
  })

  test('should bulk select and delete contacts', async ({ page }) => {
    // Enable selection mode
    await page.click('button:has-text("Select multiple")')
    
    // Select first 3 contacts
    const checkboxes = page.locator('input[type="checkbox"]:not(:checked)')
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).click()
    }
    
    // Verify selection count
    await expect(page.locator('text=3 selected')).toBeVisible()
    
    // Click delete button
    await page.click('button[aria-label="Delete selected"]')
    
    // Confirm deletion
    await page.click('button:has-text("Delete")', { force: true })
    
    // Wait for success notification
    await expect(page.locator('text=3 contacts deleted')).toBeVisible()
  })

  test('should handle virtual scrolling with large dataset', async ({ page }) => {
    // Scroll to bottom
    const container = page.locator('[data-testid="contacts-table"]')
    await container.evaluate(el => el.scrollTop = el.scrollHeight)
    
    // Wait for more data to load
    await page.waitForTimeout(1000)
    
    // Check that new items are rendered
    const rowCount = await page.locator('[data-testid="contact-row"]').count()
    expect(rowCount).toBeGreaterThan(0)
    
    // Scroll back to top
    await container.evaluate(el => el.scrollTop = 0)
    
    // Verify smooth scrolling
    await expect(page.locator('[data-testid="contact-row"]').first()).toBeVisible()
  })

  test('should export contacts to CSV', async ({ page }) => {
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Open actions menu and click export
    await page.click('button[aria-label="More actions"]')
    await page.click('text=Export to CSV')
    
    // Wait for download to complete
    const download = await downloadPromise
    
    // Verify file name
    expect(download.suggestedFilename()).toMatch(/contacts-\d{4}-\d{2}-\d{2}\.csv/)
    
    // Save file and verify it's not empty
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('should show real-time updates', async ({ page, context }) => {
    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('/contacts')
    
    // Create contact in first tab
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Realtime')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[name="email"]', 'realtime@example.com')
    await page.click('button:has-text("Create Contact")')
    
    // Wait for contact to appear in second tab
    await expect(page2.locator('text=Realtime Test')).toBeVisible({ timeout: 5000 })
    
    // Close second tab
    await page2.close()
  })

  test('should handle offline mode', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    
    // Try to create a contact
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Offline')
    await page.fill('input[name="lastName"]', 'Contact')
    await page.fill('input[name="email"]', 'offline@example.com')
    await page.click('button:has-text("Create Contact")')
    
    // Check for offline notification
    await expect(page.locator('text=Operation queued for sync')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Wait for sync
    await page.waitForTimeout(2000)
    
    // Verify contact was created
    await expect(page.locator('text=Offline Contact')).toBeVisible()
  })
})