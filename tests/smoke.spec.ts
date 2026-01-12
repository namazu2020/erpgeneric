import { test, expect } from '@playwright/test';

test.describe('Smoke Validation', () => {

    test('should redirect unauthenticated user to login', async ({ page }) => {
        // Navigate to root
        await page.goto('/');

        // Expect redirection to login
        await expect(page).toHaveURL(/.*\/login/);

        // Expect "Acceso al ERP" title
        await expect(page.locator('h1')).toContainText('Acceso al ERP');
    });

    test('should show setup page or login page', async ({ page }) => {
        await page.goto('/setup');

        // Wait for either login or setup to settle
        await page.waitForURL(/.*(\/login|\/setup)/);

        const url = page.url();
        if (url.includes('/login')) {
            await expect(page.locator('h1')).toContainText('Acceso al ERP');
        } else {
            await expect(page.locator('h1')).toContainText('Configuración Inicial');
        }
    });

    test('should check configuration page security', async ({ page }) => {
        await page.goto('/configuracion');
        await expect(page).toHaveURL(/.*\/login/);
    });
});
