import { test, expect } from '@playwright/test';

test.describe('Vehicles Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*dashboard.*/);
    });

    test('should display vehicles list', async ({ page }) => {
        await page.goto('/dashboard/proprietaire/vehicules');
        await expect(page.locator('h1')).toContainText('Véhicules');
        await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible();
    });

    test('should search vehicles by plate', async ({ page }) => {
        await page.goto('/dashboard/proprietaire/vehicules');
        await page.fill('[data-testid="search-plate"]', 'AB-123');
        await page.press('[data-testid="search-plate"]', 'Enter');
        await expect(page.locator('[data-testid="vehicle-card"]')).toBeVisible();
    });

    test('should open add vehicle modal', async ({ page }) => {
        await page.goto('/dashboard/proprietaire/vehicules');
        await page.click('[data-testid="add-vehicle-btn"]');
        await expect(page.locator('[data-testid="add-vehicle-modal"]')).toBeVisible();
    });
});
