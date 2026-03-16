import { test, expect } from '@playwright/test';

test.describe('Pannes Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*dashboard.*/);
    });

    test('should display pannes list', async ({ page }) => {
        await page.goto('/dashboard/proprietaire/pannes');
        await expect(page.locator('h1')).toContainText('Pannes');
    });

    test('should declare new panne', async ({ page }) => {
        await page.goto('/dashboard/proprietaire/pannes');
        await page.click('[data-testid="declare-panne-btn"]');
        await page.selectOption('[data-testid="vehicle-select"]', 'vehicle-1');
        await page.fill('[data-testid="panne-description"]', 'Test panne description');
        await page.selectOption('[data-testid="panne-gravite"]', 'mineure');
        await page.click('[data-testid="submit-panne"]');
        await expect(page.locator('.success-message')).toBeVisible();
    });
});
