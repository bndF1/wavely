import { test, expect } from './fixtures/auth.fixture';

// These tests require the Firebase Auth Emulator.
// In CI: set USE_EMULATORS=true and start emulators before running.
// Locally: `firebase emulators:start --only auth,firestore` then `USE_EMULATORS=true bunx nx e2e`
test.skip(
  () => !process.env['USE_EMULATORS'],
  'Requires Firebase Auth Emulator (USE_EMULATORS=true)'
);

test.describe('Tab navigation', () => {
  test('displays tab bar after login', async ({ page }) => {
    await page.goto('/tabs/home');
    const tabBar = page.locator('ion-tab-bar');
    await expect(tabBar).toBeVisible();
  });

  test('navigates to Browse tab', async ({ page }) => {
    await page.goto('/tabs');
    const browseTab = page.getByRole('tab', { name: /browse/i });
    await browseTab.click();
    await expect(page).toHaveURL(/\/tabs\/browse/);
  });

  test('navigates to Search tab', async ({ page }) => {
    await page.goto('/tabs');
    const searchTab = page.getByRole('tab', { name: /search/i });
    await searchTab.click();
    await expect(page).toHaveURL(/\/tabs\/search/);
  });

  test('navigates to Library tab', async ({ page }) => {
    await page.goto('/tabs');
    const libraryTab = page.getByRole('tab', { name: /library/i });
    await libraryTab.click();
    await expect(page).toHaveURL(/\/tabs\/library/);
  });
});
