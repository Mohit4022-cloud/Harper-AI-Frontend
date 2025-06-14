import { test, expect } from '@playwright/test'

test.describe('API Health Checks', () => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`)
    expect(response.status()).toBe(200)
    
    const json = await response.json()
    expect(json).toHaveProperty('status', 'healthy')
  })

  test('settings endpoint returns success', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/settings`)
    expect(response.status()).toBe(200)
    
    const json = await response.json()
    expect(json).toHaveProperty('success', true)
    expect(json).toHaveProperty('data')
  })

  test('call start endpoint validates phone number', async ({ request }) => {
    // Test missing phone number
    const response = await request.post(`${baseUrl}/api/call/start`, {
      data: {},
    })
    expect(response.status()).toBe(400)
    
    const json = await response.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toContain('phone')
  })

  test('call start endpoint returns request ID header', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/call/start`, {
      data: { phone: '+1234567890' },
    })
    
    // Should have x-request-id header
    const requestId = response.headers()['x-request-id']
    expect(requestId).toBeTruthy()
  })

  test('API routes use relative paths in production', async ({ page }) => {
    // Navigate to a page that makes API calls
    await page.goto(`${baseUrl}/settings`)
    
    // Intercept API calls
    const apiCalls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url())
      }
    })
    
    // Wait for settings to load
    await page.waitForTimeout(2000)
    
    // Verify API calls don't include localhost
    for (const url of apiCalls) {
      expect(url).not.toContain('localhost:3000')
      expect(url).not.toContain('http://localhost')
    }
  })
})