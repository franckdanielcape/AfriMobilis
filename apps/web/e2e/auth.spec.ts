import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('h1')).toContainText('Connexion');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await expect(page.locator('.error-message')).toBeVisible();
    });

    test('should navigate to dashboard after login', async ({ page }) => {
        await page.goto('/login');
        // Note: Use test credentials
        await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '');
        await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard.*/);
    });
});
