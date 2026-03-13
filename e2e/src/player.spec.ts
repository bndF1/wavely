import { test, expect } from '../fixtures/auth.fixture';

// These tests require the Firebase Auth Emulator.
test.skip(
  () => !process.env['USE_EMULATORS'],
  'Requires Firebase Auth Emulator (USE_EMULATORS=true)'
);

test.describe('Mini player', () => {
  test('mini player is hidden when no episode is playing', async ({ page }) => {
    await page.goto('/tabs/home');
    const miniPlayer = page.locator('wavely-mini-player');
    await expect(miniPlayer).not.toBeVisible();
  });

  test('mini player appears after tapping play on an episode', async ({ page }) => {
    await page.goto('/episode/1');
    const playButton = page.getByRole('button', { name: /play/i }).first();
    await playButton.click();
    const miniPlayer = page.locator('wavely-mini-player');
    await expect(miniPlayer).toBeVisible({ timeout: 5000 });
  });

  test('mini player shows episode title', async ({ page }) => {
    await page.goto('/episode/1');
    const playButton = page.getByRole('button', { name: /play/i }).first();
    await playButton.click();
    const title = page.locator('wavely-mini-player [data-testid="episode-title"]');
    await expect(title).not.toBeEmpty();
  });
});

test.describe('Full player', () => {
  test('tapping mini player opens the full player', async ({ page }) => {
    await page.goto('/episode/1');
    await page.getByRole('button', { name: /play/i }).first().click();
    await page.locator('wavely-mini-player').click();
    const fullPlayer = page.locator('wavely-full-player');
    await expect(fullPlayer).toBeVisible({ timeout: 5000 });
  });

  test('full player shows playback rate button', async ({ page }) => {
    await page.goto('/episode/1');
    await page.getByRole('button', { name: /play/i }).first().click();
    await page.locator('wavely-mini-player').click();
    const rateButton = page.locator('wavely-full-player').getByText(/×/);
    await expect(rateButton).toBeVisible();
  });
});
