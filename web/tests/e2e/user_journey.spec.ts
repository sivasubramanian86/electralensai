import { test, expect } from '@playwright/test';

test.describe('ElectraLensAI User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('full civic learning flow', async ({ page }) => {
    // 1. Dashboard Landing
    await expect(page.locator('h1')).toContainText('Election Journey');

    // 2. Persona Selection
    await page.click('button[aria-pressed="false"]:has-text("First-Time Voter")');
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('First-Time Voter');

    // 3. Navigate to Learning Lab
    await page.click('nav >> text=Learning Lab');
    await expect(page.locator('h2')).toContainText('Learning Lab');

    // 4. Start a Quiz
    await page.click('button:has-text("Start Quiz")');
    await expect(page.locator('div[role="radiogroup"]')).toBeVisible();

    // 5. Answer a question
    await page.click('button[role="radio"] >> nth=0');
    await page.click('button:has-text("Check Answer")');
    await expect(page.locator('div[aria-live="polite"]')).toBeVisible();
  });

  test('accessibility settings adjustment', async ({ page }) => {
    // 1. Open Settings
    await page.click('nav >> text=Settings');
    await expect(page.locator('h2')).toContainText('Settings');

    // 2. Toggle High Contrast Mode
    await page.click('button[aria-pressed]:has-text("High Contrast")');
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('High Contrast');

    // 3. Change Language
    await page.selectOption('select[aria-label="Interface Language"]', 'hi');
    // Verify i18n change (assuming 'Settings' becomes 'सेटिंग्स' or similar)
    // For now, just check if the value changed
    await expect(page.locator('select[aria-label="Interface Language"]')).toHaveValue('hi');
  });
});
