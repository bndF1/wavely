import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// These tests require the Firebase Auth Emulator.
// In CI: set USE_EMULATORS=true and start emulators before running.
// Locally: `firebase emulators:start --only auth,firestore` then `USE_EMULATORS=true bunx nx e2e`
test.skip(
  () => !process.env['USE_EMULATORS'],
  'Requires Firebase Auth Emulator (USE_EMULATORS=true)'
);

async function isDesktopNavigation(page: Page): Promise<boolean> {
  const tabBar = page.locator('ion-tab-bar');
  return tabBar.evaluate((el) => getComputedStyle(el).display === 'none');
}

async function clickPrimaryNavigation(
  page: Page,
  tab: 'discover' | 'radio' | 'library'
): Promise<void> {
  if (await isDesktopNavigation(page)) {
    await page.locator(`.desktop-sidebar__link[href$="/tabs/${tab}"]`).click();
    return;
  }

  await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
}

test.describe('Tab navigation', () => {
  test('displays primary navigation after login', async ({ page }) => {
    await page.goto('/tabs/home');
    const tabBar = page.locator('ion-tab-bar');

    if (await isDesktopNavigation(page)) {
      await expect(page.locator('.desktop-sidebar')).toBeVisible();
    } else {
      await expect(tabBar).toBeVisible();
    }
  });

  test('navigates to Discover tab', async ({ page }) => {
    await page.goto('/tabs');
    await clickPrimaryNavigation(page, 'discover');
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('navigates to Radio tab', async ({ page }) => {
    await page.goto('/tabs');
    await clickPrimaryNavigation(page, 'radio');
    await expect(page).toHaveURL(/\/tabs\/radio/);
  });

  test('navigates to Library tab', async ({ page }) => {
    await page.goto('/tabs');
    await clickPrimaryNavigation(page, 'library');
    await expect(page).toHaveURL(/\/tabs\/library/);
  });
});
