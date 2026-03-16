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

  test('navigates to Discover tab', async ({ page }) => {
    await page.goto('/tabs');
    const discoverTab = page.getByRole('tab', { name: /discover/i });
    await discoverTab.click();
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('navigates to Radio tab', async ({ page }) => {
    await page.goto('/tabs');
    const radioTab = page.getByRole('tab', { name: /radio/i });
    await radioTab.click();
    await expect(page).toHaveURL(/\/tabs\/radio/);
  });

  test('navigates to Library tab', async ({ page }) => {
    await page.goto('/tabs');
    const libraryTab = page.getByRole('tab', { name: /library/i });
    await libraryTab.click();
    await expect(page).toHaveURL(/\/tabs\/library/);
  });
});
