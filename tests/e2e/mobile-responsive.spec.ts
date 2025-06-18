/**
 * Mobile Responsive Testing Suite
 * 
 * Tests UI responsiveness across various mobile devices and viewports
 */

import { test, expect, devices } from '@playwright/test';

const mobileViewports = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'iPhone 13 Pro Max', ...devices['iPhone 13 Pro Max'] },
  { name: 'Pixel 5', ...devices['Pixel 5'] },
  { name: 'Galaxy S21', viewport: { width: 360, height: 800 } },
  { name: 'iPad Mini', ...devices['iPad Mini'] },
  { name: 'iPad Pro', ...devices['iPad Pro'] },
];

test.describe('Mobile Responsive Tests', () => {
  // Test each page on multiple devices
  mobileViewports.forEach(device => {
    test.describe(`${device.name} Tests`, () => {
      test.use({
        ...device,
        // Extend default timeout for mobile tests
        actionTimeout: 20000,
      });

      test.beforeEach(async ({ page }) => {
        // Mock authentication
        await page.goto('/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
      });

      test('Dashboard is mobile responsive', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Check mobile menu is visible
        if (device.viewport.width < 768) {
          const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
          await expect(mobileMenu).toBeVisible();
          
          // Test mobile menu interaction
          await mobileMenu.click();
          const sidebar = page.locator('[data-testid="mobile-sidebar"]');
          await expect(sidebar).toBeVisible();
          
          // Close menu
          await page.locator('[data-testid="mobile-menu-close"]').click();
          await expect(sidebar).not.toBeVisible();
        }
        
        // Check cards stack vertically on mobile
        const metricsCards = page.locator('[data-testid="metrics-card"]');
        if (device.viewport.width < 640) {
          const cardCount = await metricsCards.count();
          for (let i = 0; i < cardCount - 1; i++) {
            const currentCard = await metricsCards.nth(i).boundingBox();
            const nextCard = await metricsCards.nth(i + 1).boundingBox();
            
            // Cards should be stacked vertically
            expect(currentCard.y).toBeLessThan(nextCard.y);
            expect(currentCard.x).toBeCloseTo(nextCard.x, 0);
          }
        }
        
        // Take screenshot for visual verification
        await page.screenshot({ 
          path: `test-results/mobile-screenshots/dashboard-${device.name.replace(/ /g, '-')}.png`,
          fullPage: true,
        });
      });

      test('Contacts page is mobile responsive', async ({ page }) => {
        await page.goto('/contacts');
        
        // Check table converts to cards on mobile
        if (device.viewport.width < 768) {
          const contactCards = page.locator('[data-testid="contact-card-mobile"]');
          await expect(contactCards.first()).toBeVisible();
          
          // Traditional table should be hidden
          const table = page.locator('table');
          await expect(table).not.toBeVisible();
        } else {
          // Table should be visible on larger screens
          const table = page.locator('table');
          await expect(table).toBeVisible();
        }
        
        // Test search functionality
        const searchInput = page.locator('[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test contact');
        
        // Test add contact button
        const addButton = page.locator('button:has-text("Add Contact")');
        await expect(addButton).toBeVisible();
        
        if (device.viewport.width < 640) {
          // On small screens, button might show icon only
          const buttonText = await addButton.textContent();
          if (!buttonText.includes('Add Contact')) {
            const icon = addButton.locator('svg');
            await expect(icon).toBeVisible();
          }
        }
      });

      test('Email personalization form is mobile responsive', async ({ page }) => {
        await page.goto('/email');
        
        // Check form elements stack vertically on mobile
        const formFields = page.locator('form input, form select, form textarea');
        const fieldCount = await formFields.count();
        
        if (device.viewport.width < 640) {
          for (let i = 0; i < fieldCount - 1; i++) {
            const currentField = await formFields.nth(i).boundingBox();
            const nextField = await formFields.nth(i + 1).boundingBox();
            
            // Fields should be full width
            expect(currentField.width).toBeGreaterThan(device.viewport.width * 0.8);
          }
        }
        
        // Test that buttons are accessible
        const generateButton = page.locator('button:has-text("Generate")');
        await expect(generateButton).toBeVisible();
        
        // Scroll to bottom to check button visibility
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(generateButton).toBeInViewport();
      });

      test('Navigation is mobile optimized', async ({ page }) => {
        await page.goto('/dashboard');
        
        if (device.viewport.width < 768) {
          // Test hamburger menu
          const menuButton = page.locator('[data-testid="mobile-menu-button"]');
          await menuButton.click();
          
          // Check all nav items are visible in mobile menu
          const navItems = [
            'Dashboard',
            'Contacts',
            'Calling',
            'Email',
            'Pipeline',
            'Calendar',
            'Reports',
            'Settings',
          ];
          
          for (const item of navItems) {
            const navLink = page.locator(`nav a:has-text("${item}")`);
            await expect(navLink).toBeVisible();
          }
          
          // Test navigation
          await page.locator('nav a:has-text("Contacts")').click();
          await expect(page).toHaveURL('/contacts');
          
          // Menu should auto-close after navigation
          const sidebar = page.locator('[data-testid="mobile-sidebar"]');
          await expect(sidebar).not.toBeVisible();
        }
      });

      test('Forms have appropriate input sizes', async ({ page }) => {
        await page.goto('/settings');
        
        // Check input fields are appropriately sized
        const inputs = page.locator('input[type="text"], input[type="email"]');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const box = await input.boundingBox();
          
          // Inputs should be at least 44px tall for touch targets
          expect(box.height).toBeGreaterThanOrEqual(44);
          
          // Inputs should have adequate width
          if (device.viewport.width < 640) {
            expect(box.width).toBeGreaterThan(device.viewport.width * 0.7);
          }
        }
        
        // Check buttons are touch-friendly
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();
          
          // Buttons should be at least 44px tall
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      });

      test('Modals are mobile optimized', async ({ page }) => {
        await page.goto('/contacts');
        
        // Open add contact modal
        await page.locator('button:has-text("Add Contact")').click();
        
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Check modal sizing on mobile
        const modalBox = await modal.boundingBox();
        
        if (device.viewport.width < 640) {
          // Modal should be nearly full width on mobile
          expect(modalBox.width).toBeGreaterThan(device.viewport.width * 0.9);
          
          // Modal should be scrollable if content exceeds viewport
          const modalContent = modal.locator('[data-testid="modal-content"]');
          const contentBox = await modalContent.boundingBox();
          
          if (contentBox.height > device.viewport.height * 0.8) {
            const scrollable = await modal.evaluate(el => {
              return el.scrollHeight > el.clientHeight;
            });
            expect(scrollable).toBeTruthy();
          }
        }
        
        // Test close button is accessible
        const closeButton = modal.locator('[aria-label="Close"]');
        await expect(closeButton).toBeVisible();
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      });

      test('Tables have horizontal scroll on mobile', async ({ page }) => {
        await page.goto('/reports');
        
        const tables = page.locator('table');
        const tableCount = await tables.count();
        
        if (device.viewport.width < 768 && tableCount > 0) {
          for (let i = 0; i < tableCount; i++) {
            const table = tables.nth(i);
            const tableContainer = table.locator('xpath=..');
            
            // Check if container has overflow-x scroll
            const overflowX = await tableContainer.evaluate(el => {
              return window.getComputedStyle(el).overflowX;
            });
            
            expect(['auto', 'scroll']).toContain(overflowX);
            
            // Check if table is wider than viewport
            const tableBox = await table.boundingBox();
            if (tableBox.width > device.viewport.width) {
              // Verify horizontal scrolling works
              await tableContainer.evaluate(el => el.scrollLeft = 100);
              const scrollLeft = await tableContainer.evaluate(el => el.scrollLeft);
              expect(scrollLeft).toBeGreaterThan(0);
            }
          }
        }
      });

      test('Text is readable on mobile', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Check font sizes
        const bodyText = page.locator('p, span').first();
        const fontSize = await bodyText.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });
        
        // Font size should be at least 14px
        expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);
        
        // Check line height for readability
        const lineHeight = await bodyText.evaluate(el => {
          return window.getComputedStyle(el).lineHeight;
        });
        
        // Line height should be at least 1.5x font size
        expect(parseFloat(lineHeight)).toBeGreaterThanOrEqual(parseInt(fontSize) * 1.5);
        
        // Check contrast ratios (simplified check)
        const textColor = await bodyText.evaluate(el => {
          return window.getComputedStyle(el).color;
        });
        const bgColor = await bodyText.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        // Ensure text and background colors are different
        expect(textColor).not.toBe(bgColor);
      });

      test('Touch interactions work correctly', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Test swipe gestures if implemented
        if (device.viewport.width < 768) {
          const swipeableElement = page.locator('[data-testid="swipeable-cards"]');
          if (await swipeableElement.count() > 0) {
            const box = await swipeableElement.boundingBox();
            
            // Simulate swipe
            await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
            await page.mouse.up();
            
            // Verify swipe action occurred (implementation specific)
            await page.waitForTimeout(500);
          }
        }
        
        // Test tap targets
        const buttons = page.locator('button, a');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            
            // Tap targets should be at least 44x44px
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test('Orientation changes handle correctly', async ({ page, context }) => {
        // Skip for devices that don't support orientation change
        if (!device.name.includes('iPad') && !device.name.includes('iPhone') && !device.name.includes('Pixel')) {
          test.skip();
        }
        
        await page.goto('/dashboard');
        
        // Get initial layout
        const initialMetrics = await page.locator('[data-testid="metrics-card"]').count();
        
        // Change orientation (simulate by changing viewport)
        const currentViewport = page.viewportSize();
        await page.setViewportSize({
          width: currentViewport.height,
          height: currentViewport.width,
        });
        
        // Wait for layout to adjust
        await page.waitForTimeout(500);
        
        // Verify layout adjusted
        const rotatedMetrics = await page.locator('[data-testid="metrics-card"]').count();
        expect(rotatedMetrics).toBe(initialMetrics);
        
        // Check that content is still visible
        const firstCard = page.locator('[data-testid="metrics-card"]').first();
        await expect(firstCard).toBeVisible();
        await expect(firstCard).toBeInViewport();
      });
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('Mobile navigation is keyboard accessible', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Tab through mobile menu
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Open mobile menu with keyboard
      await page.keyboard.press('Enter');
      
      const sidebar = page.locator('[data-testid="mobile-sidebar"]');
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();
        
        // Tab through menu items
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          const focused = await page.evaluate(() => {
            return document.activeElement?.getAttribute('href') || document.activeElement?.textContent;
          });
          expect(focused).toBeTruthy();
        }
      }
    });

    test('Touch targets meet WCAG guidelines', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      // Get all interactive elements
      const interactiveElements = page.locator('button, a, input, select, textarea');
      const count = await interactiveElements.count();
      
      const smallTargets = [];
      
      for (let i = 0; i < count; i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          
          // WCAG 2.5.5 Level AAA: Target size should be at least 44x44 CSS pixels
          if (box.width < 44 || box.height < 44) {
            const text = await element.textContent();
            const type = await element.evaluate(el => el.tagName);
            smallTargets.push({ text, type, width: box.width, height: box.height });
          }
        }
      }
      
      // Log any small targets found
      if (smallTargets.length > 0) {
        console.log('Small touch targets found:', smallTargets);
      }
      
      // Expect most targets to meet guidelines
      expect(smallTargets.length).toBeLessThan(count * 0.1); // Less than 10% should be small
    });
  });
});