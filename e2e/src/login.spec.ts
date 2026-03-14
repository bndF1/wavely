import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/pages';

test.describe('Login page', () => {
  test('renders the login page at /login', async ({ page }) => {
    await page.goto('/login');
    // The login page should load without error
    await expect(page).toHaveURL(/\/login/);
  });

  test('displays a Google sign-in button', async ({ page }) => {
    await page.goto('/login');
    const googleBtn = page.getByText(/continue with google/i);
    await expect(googleBtn).toBeVisible({ timeout: 10000 });
  });

  test('shows the Wavely brand/logo', async ({ page }) => {
    await page.goto('/login');
    // Check for any branding element (title text or logo image)
    const branding = page.getByText(/wavely/i).first();
    await expect(branding).toBeVisible({ timeout: 10000 });
  });

  test('has no critical JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      // Firebase auth errors are expected in test env (no real credentials)
      if (!err.message.includes('auth/') && !err.message.includes('FirebaseError')) {
        errors.push(err.message);
      }
    });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Auth guard redirect', () => {
  test('redirects unauthenticated users from / to /login', async ({ page }) => {
    await page.goto('/');
    // The auth guard should redirect to /login before Firebase resolves
    // Wait a bit for Firebase auth state to resolve (null → redirect)
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated users from /tabs to /login', async ({ page }) => {
    await page.goto('/tabs');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
