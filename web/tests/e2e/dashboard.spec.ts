import { test, expect } from '@playwright/test';

test('dashboard loads and shows chapters', async ({ page }) => {
  // Assuming the app is running on localhost:5173
  await page.goto('http://localhost:5173');
  
  // Wait for the dashboard to load
  await expect(page.locator('h1')).toContainText('Election Journey');
  
  // Check if at least one chapter is visible
  const chapters = page.locator('.chapter-card');
  await expect(chapters.first()).toBeVisible();
});

test('navigation to Learning Lab works', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Click on Learning Lab in sidebar
  await page.click('text=Learning Lab');
  
  // Verify Quiz or Flashcards header
  await expect(page.locator('h2')).toContainText('Learning Lab');
});
