import { test, expect } from '@playwright/test'

test.describe('WebSocket Real-time Features', () => {
  test('should show connection status', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for connection status indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toBeVisible()
    
    // Should show connected state
    await expect(connectionStatus).toContainText('Connected')
    
    // Check for last sync time
    await expect(page.locator('text=Last sync:')).toBeVisible()
  })

  test('should handle connection loss gracefully', async ({ page, context }) => {
    await page.goto('/dashboard')
    
    // Wait for initial connection
    await expect(page.locator('text=Connected')).toBeVisible()
    
    // Simulate offline
    await context.setOffline(true)
    
    // Should show disconnected state
    await expect(page.locator('text=Disconnected')).toBeVisible({ timeout: 10000 })
    
    // Try to create a contact while offline
    await page.goto('/contacts')
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Offline')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[name="email"]', 'offline@test.com')
    await page.click('button:has-text("Create Contact")')
    
    // Should show queued notification
    await expect(page.locator('text=Operation queued')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Should reconnect
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 15000 })
    
    // Should sync queued operations
    await expect(page.locator('text=Sync complete')).toBeVisible({ timeout: 10000 })
  })

  test('should receive real-time updates across tabs', async ({ context }) => {
    // Open two tabs
    const page1 = await context.newPage()
    const page2 = await context.newPage()
    
    // Navigate both to contacts
    await page1.goto('/contacts')
    await page2.goto('/contacts')
    
    // Wait for both to load
    await page1.waitForSelector('[data-testid="contacts-table"]')
    await page2.waitForSelector('[data-testid="contacts-table"]')
    
    // Create contact in page1
    await page1.click('button:has-text("Add Contact")')
    await page1.fill('input[name="firstName"]', 'Realtime')
    await page1.fill('input[name="lastName"]', 'Update')
    await page1.fill('input[name="email"]', 'realtime.update@test.com')
    await page1.click('button:has-text("Create Contact")')
    
    // Should appear in page2 without refresh
    await expect(page2.locator('text=Realtime Update')).toBeVisible({ timeout: 5000 })
    
    // Edit contact in page2
    await page2.click('text=Realtime Update')
    await page2.click('button:has-text("Edit")')
    await page2.fill('input[name="company"]', 'Test Company')
    await page2.click('button:has-text("Save")')
    
    // Should update in page1
    await expect(page1.locator('text=Test Company')).toBeVisible({ timeout: 5000 })
    
    // Close tabs
    await page1.close()
    await page2.close()
  })

  test('should handle rapid updates efficiently', async ({ page }) => {
    await page.goto('/contacts')
    
    // Monitor WebSocket messages
    const wsMessages: any[] = []
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        if (event.payload) {
          try {
            const data = JSON.parse(event.payload.toString())
            wsMessages.push(data)
          } catch {}
        }
      })
    })
    
    // Create multiple contacts rapidly
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Add Contact")')
      await page.fill('input[name="firstName"]', `Rapid${i}`)
      await page.fill('input[name="lastName"]', 'Test')
      await page.fill('input[name="email"]', `rapid${i}@test.com`)
      await page.click('button:has-text("Create Contact")')
      
      // Don't wait between creates
    }
    
    // All contacts should appear
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`text=Rapid${i} Test`)).toBeVisible({ timeout: 10000 })
    }
    
    // Check that updates were batched efficiently
    console.log(`Received ${wsMessages.length} WebSocket messages`)
  })

  test('should show user activity in real-time', async ({ context }) => {
    // Open admin view
    const adminPage = await context.newPage()
    await adminPage.goto('/admin/activity')
    
    // Open user page
    const userPage = await context.newPage()
    await userPage.goto('/contacts')
    
    // User performs action
    await userPage.click('text=John Doe') // Assuming test data exists
    
    // Admin should see activity
    await expect(adminPage.locator('text=viewed contact John Doe')).toBeVisible({ timeout: 5000 })
    
    // Close pages
    await adminPage.close()
    await userPage.close()
  })

  test('should handle reconnection with state preservation', async ({ page, context }) => {
    await page.goto('/contacts')
    
    // Select some contacts
    await page.click('button:has-text("Select multiple")')
    const checkboxes = page.locator('input[type="checkbox"]:not(:checked)')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()
    
    // Verify selection
    await expect(page.locator('text=2 selected')).toBeVisible()
    
    // Simulate connection loss and recovery
    await context.setOffline(true)
    await page.waitForTimeout(1000)
    await context.setOffline(false)
    
    // Wait for reconnection
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 15000 })
    
    // Selection should be preserved
    await expect(page.locator('text=2 selected')).toBeVisible()
  })
})