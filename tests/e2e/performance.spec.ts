import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load contacts page within performance budget', async ({ page }) => {
    // Start measuring
    const startTime = Date.now()
    
    // Navigate to contacts
    await page.goto('/contacts')
    
    // Wait for main content to be visible
    await page.waitForSelector('[data-testid="contacts-table"]')
    
    // Calculate load time
    const loadTime = Date.now() - startTime
    
    // Performance budget: 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0
        let fid = 0
        let cls = 0
        
        // Observe LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          lcp = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Observe FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-input') {
              fid = entry.processingStart - entry.startTime
            }
          })
        }).observe({ entryTypes: ['first-input'] })
        
        // Observe CLS
        let clsValue = 0
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          cls = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Wait a bit for metrics to be collected
        setTimeout(() => {
          resolve({ lcp, fid, cls })
        }, 2000)
      })
    })
    
    // Assert Core Web Vitals thresholds
    expect(metrics.lcp).toBeLessThan(2500) // LCP < 2.5s
    expect(metrics.cls).toBeLessThan(0.1)  // CLS < 0.1
  })

  test('should handle 5M+ contacts with virtual scrolling', async ({ page }) => {
    // Mock API to return large dataset indication
    await page.route('**/api/contacts/v2*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contacts: Array(50).fill(null).map((_, i) => ({
            id: `contact-${i}`,
            firstName: `User`,
            lastName: `${i}`,
            email: `user${i}@example.com`,
            phone: `+1234567${i.toString().padStart(4, '0')}`,
            tags: ['Customer'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          totalCount: 5000000,
          nextCursor: 50,
        }),
      })
    })
    
    await page.goto('/contacts')
    
    // Measure initial render performance
    const renderStart = Date.now()
    await page.waitForSelector('[data-testid="contact-row"]')
    const renderTime = Date.now() - renderStart
    
    // Should render quickly even with large dataset
    expect(renderTime).toBeLessThan(1000)
    
    // Count visible rows
    const visibleRows = await page.locator('[data-testid="contact-row"]').count()
    
    // Should only render visible rows + overscan
    expect(visibleRows).toBeLessThan(30) // Viewport height dependent
    
    // Test smooth scrolling
    const scrollStart = Date.now()
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="contacts-table"]')
      if (container) {
        container.scrollTop = 100000 // Scroll far down
      }
    })
    
    // Wait for new rows to render
    await page.waitForTimeout(100)
    const scrollTime = Date.now() - scrollStart
    
    // Scrolling should be smooth
    expect(scrollTime).toBeLessThan(200)
  })

  test('should optimize bundle size', async ({ page }) => {
    // Intercept all JS requests
    const jsRequests: number[] = []
    
    page.on('response', (response) => {
      if (response.url().includes('.js') && response.status() === 200) {
        const size = Number(response.headers()['content-length'] || 0)
        if (size > 0) {
          jsRequests.push(size)
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Calculate total JS size
    const totalSize = jsRequests.reduce((sum, size) => sum + size, 0)
    const totalSizeKB = totalSize / 1024
    
    console.log(`Total JS size: ${totalSizeKB.toFixed(2)} KB`)
    
    // Bundle size budget: 500KB for initial load
    expect(totalSizeKB).toBeLessThan(500)
  })

  test('should handle memory efficiently', async ({ page }) => {
    await page.goto('/contacts')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      // Scroll down
      await page.evaluate(() => {
        const container = document.querySelector('[data-testid="contacts-table"]')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
      
      await page.waitForTimeout(500)
      
      // Scroll back up
      await page.evaluate(() => {
        const container = document.querySelector('[data-testid="contacts-table"]')
        if (container) {
          container.scrollTop = 0
        }
      })
      
      await page.waitForTimeout(500)
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Memory increase should be reasonable (less than 50MB)
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`)
    
    expect(memoryIncrease).toBeLessThan(50)
  })
})