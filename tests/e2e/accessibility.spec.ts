import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
  })

  test('home page should have no accessibility violations', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    })
  })

  test('contacts page should be accessible', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForSelector('[data-testid="contacts-table"]')
    
    await checkA11y(page, null, {
      detailedReport: true,
    })
  })

  test('modal dialogs should be accessible', async ({ page }) => {
    await page.goto('/contacts')
    
    // Open add contact modal
    await page.click('button:has-text("Add Contact")')
    await page.waitForSelector('[role="dialog"]')
    
    // Check modal accessibility
    await checkA11y(page, '[role="dialog"]', {
      detailedReport: true,
    })
    
    // Check focus management
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBe('INPUT') // First input should be focused
    
    // Check escape key closes modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForSelector('[data-testid="contacts-table"]')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    let focusedText = await page.evaluate(() => document.activeElement?.getAttribute('placeholder'))
    expect(focusedText).toBe('Search contacts...')
    
    // Tab to filters button
    await page.keyboard.press('Tab')
    focusedText = await page.evaluate(() => document.activeElement?.textContent)
    expect(focusedText).toContain('Filters')
    
    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(page.locator('[role="menu"]')).toBeVisible()
    
    // Navigate menu with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  })

  test('screen reader announcements should work', async ({ page }) => {
    await page.goto('/contacts')
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').count()
    expect(liveRegions).toBeGreaterThan(0)
    
    // Trigger an action that should announce
    await page.click('button:has-text("Add Contact")')
    await page.fill('input[name="firstName"]', 'Screen')
    await page.fill('input[name="lastName"]', 'Reader')
    await page.fill('input[name="email"]', 'screen.reader@test.com')
    await page.click('button:has-text("Create Contact")')
    
    // Check for success announcement
    const announcement = await page.locator('[role="status"], [aria-live="polite"]')
    await expect(announcement).toContainText(/created|success/i)
  })

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/contacts')
    
    // Check specific color contrast issues
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    })
  })

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/contacts')
    await page.click('button:has-text("Add Contact")')
    
    // Check all inputs have labels
    const inputs = await page.locator('input:not([type="hidden"])').all()
    
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const name = await input.getAttribute('name')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')
      
      // Input should have either a label, aria-label, or aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        expect(label > 0 || ariaLabel || ariaLabelledby).toBeTruthy()
      }
    }
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')
    
    // Find all images
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Images should have alt text or role="presentation" for decorative images
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/contacts')
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Check focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      }
    })
    
    // Should have some visual focus indicator
    expect(
      focusedElement?.outline !== 'none' ||
      focusedElement?.boxShadow !== 'none' ||
      focusedElement?.border !== 'none'
    ).toBeTruthy()
  })
})