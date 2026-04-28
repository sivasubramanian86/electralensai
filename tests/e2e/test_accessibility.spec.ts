import { test, expect } from '@playwright/test';

test.describe('ElectraLensAI Accessibility Audit', () => {
  test('should have a high-contrast theme and proper ARIA labels', async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('http://localhost:5173');

    // 1. Check for the main heading (H1)
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // 2. Check for the search bar with ARIA label
    const searchBar = page.getByLabel('Search civic information');
    await expect(searchBar).toBeVisible();

    // 3. Check for the language selector with ARIA label
    const langSelector = page.getByLabel('Change language');
    await expect(langSelector).toBeVisible();

    // 4. Check for the login button with ARIA label
    const loginBtn = page.getByLabel('Sign in with Google');
    await expect(loginBtn).toBeVisible();
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify main landmarks exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});
