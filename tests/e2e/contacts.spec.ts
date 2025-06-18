/**
 * E2E Tests for Contacts Page
 * 
 * This test suite validates the contacts management functionality.
 * - Polls dev server before tests
 * - Mocks API endpoints for consistent testing
 * - Tests contact listing and creation flows
 */

import { test, expect, Page } from '@playwright/test';

// Global timeout constants
const NAV_TIMEOUT = 15000;
const ACTION_TIMEOUT = 10000;
const SERVER_WAIT_TIMEOUT = 30000;

// Mock contact data
const MOCK_CONTACTS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    title: 'CEO',
    phone: '+1234567890',
    status: 'active'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Tech Co',
    title: 'CTO',
    phone: '+0987654321',
    status: 'active'
  }
];

// Helper function to wait for dev server
async function waitForServer(page: Page) {
  const startTime = Date.now();
  let lastError;
  
  while (Date.now() - startTime < SERVER_WAIT_TIMEOUT) {
    try {
      const response = await page.request.get('http://localhost:3000/login', {
        timeout: 5000
      });
      if (response.ok()) {
        console.log('Dev server is ready');
        return;
      }
    } catch (error) {
      lastError = error;
      if (!page.isClosed()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }
  }
  
  throw new Error(`Dev server not available after ${SERVER_WAIT_TIMEOUT}ms. Last error: ${lastError}`);
}

// Helper function to login and navigate
async function loginAndNavigateToContacts(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForSelector('input[name="email"]', { timeout: ACTION_TIMEOUT });
  
  await page.fill('input[name="email"]', 'admin@harperai.com', { timeout: ACTION_TIMEOUT });
  await page.fill('input[name="password"]', 'password123', { timeout: ACTION_TIMEOUT });
  
  const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
  await Promise.all([
    page.waitForNavigation({ url: /.*dashboard/, timeout: NAV_TIMEOUT }),
    submitButton.click({ timeout: ACTION_TIMEOUT })
  ]);
  
  await page.waitForTimeout(1000);
  await page.goto('/contacts', { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await page.waitForSelector('h1', { timeout: NAV_TIMEOUT });
}

test.describe('Contacts Page', () => {
  test.setTimeout(60000);
  
  const consoleMessages: string[] = [];
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Checking dev server for contacts tests...');
    await waitForServer(page);
    
    await page.close();
    await context.close();
  });
  
  test.beforeEach(async ({ page, context }) => {
    consoleMessages.length = 0;
    
    // Console logging
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'warning' || msg.type() === 'error') {
        console.log(message);
      }
    });
    
    page.on('pageerror', err => {
      const message = `PAGE ERROR: ${err.message}`;
      consoleMessages.push(message);
      console.error(message);
    });
    
    // Mock contacts list API
    await context.route('**/api/contacts/list', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contacts: MOCK_CONTACTS,
          total: MOCK_CONTACTS.length
        })
      });
    });
    
    // Mock contacts GET endpoint
    await context.route('**/api/contacts', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CONTACTS)
        });
      } else {
        route.continue();
      }
    });
    
    // Mock auth
    await context.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@harperai.com',
        name: 'Test User',
        role: 'admin'
      }));
    });
  });
  
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status === 'failed') {
      console.log('Last 10 console messages:');
      console.log(consoleMessages.slice(-10).join('\n'));
    }
  });

  test('Contacts list - displays mocked contacts', async ({ page }) => {
    await loginAndNavigateToContacts(page);
    
    // Wait for contacts table to load
    await page.waitForSelector('table, [role="table"], .contacts-table', { timeout: ACTION_TIMEOUT });
    
    // Assert mock contacts are displayed
    for (const contact of MOCK_CONTACTS) {
      await expect(page.locator(`text=${contact.name}`)).toBeVisible({ timeout: ACTION_TIMEOUT });
      await expect(page.locator(`text=${contact.email}`)).toBeVisible({ timeout: ACTION_TIMEOUT });
      await expect(page.locator(`text=${contact.company}`)).toBeVisible({ timeout: ACTION_TIMEOUT });
    }
  });

  test('Create contact flow', async ({ page, context }) => {
    // Mock POST endpoint for contact creation
    await context.route('**/api/contacts', route => {
      if (route.request().method() === 'POST') {
        const newContact = {
          id: '3',
          name: 'New Contact',
          email: 'new@example.com',
          company: 'New Company',
          title: 'Manager',
          phone: '+1111111111',
          status: 'active'
        };
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newContact)
        });
      } else {
        route.continue();
      }
    });
    
    await loginAndNavigateToContacts(page);
    
    // Click create contact button
    const createButton = page.locator('button:has-text("Create Contact"), button:has-text("Add Contact"), button:has-text("New Contact")').first();
    await createButton.click({ timeout: ACTION_TIMEOUT });
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal, .create-contact-modal', { timeout: ACTION_TIMEOUT });
    
    // Fill in contact form
    await page.fill('input[name="name"], input[placeholder*="Name"]', 'New Contact', { timeout: ACTION_TIMEOUT });
    await page.fill('input[name="email"], input[placeholder*="Email"]', 'new@example.com', { timeout: ACTION_TIMEOUT });
    await page.fill('input[name="company"], input[placeholder*="Company"]', 'New Company', { timeout: ACTION_TIMEOUT });
    await page.fill('input[name="title"], input[placeholder*="Title"]', 'Manager', { timeout: ACTION_TIMEOUT });
    await page.fill('input[name="phone"], input[placeholder*="Phone"]', '+1111111111', { timeout: ACTION_TIMEOUT });
    
    // Submit form
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').last();
    await saveButton.click({ timeout: ACTION_TIMEOUT });
    
    // Assert new contact appears in the list
    await expect(page.locator('text=New Contact')).toBeVisible({ timeout: ACTION_TIMEOUT });
    await expect(page.locator('text=new@example.com')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });

  test('Search contacts', async ({ page }) => {
    await loginAndNavigateToContacts(page);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('John', { timeout: ACTION_TIMEOUT });
    
    // Wait for filtered results
    await page.waitForTimeout(500); // Debounce delay
    
    // Assert John Doe is visible
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: ACTION_TIMEOUT });
    
    // Assert Jane Smith is not visible (assuming client-side filtering)
    await expect(page.locator('text=Jane Smith')).not.toBeVisible({ timeout: 5000 });
  });

  test('Contact actions - Edit', async ({ page }) => {
    await loginAndNavigateToContacts(page);
    
    // Find edit button for first contact
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click({ timeout: ACTION_TIMEOUT });
    
    // Wait for edit modal/form
    await page.waitForSelector('[role="dialog"], .edit-modal, .edit-contact-form', { timeout: ACTION_TIMEOUT });
    
    // Verify form is pre-filled
    const nameInput = page.locator('input[name="name"], input[value*="John"]').first();
    await expect(nameInput).toHaveValue(/John/i, { timeout: ACTION_TIMEOUT });
  });

  test('Contact actions - Delete', async ({ page, context }) => {
    // Mock DELETE endpoint
    await context.route('**/api/contacts/*', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        route.continue();
      }
    });
    
    await loginAndNavigateToContacts(page);
    
    // Find delete button for first contact
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click({ timeout: ACTION_TIMEOUT });
    
    // Confirm deletion (if confirmation dialog appears)
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    // Assert contact is removed (mock should return updated list without deleted item)
    await expect(page.locator('text=Contact deleted')).toBeVisible({ timeout: ACTION_TIMEOUT });
  });
});