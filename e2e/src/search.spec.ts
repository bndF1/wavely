import { test, expect } from './fixtures/auth.fixture';

const ITUNES_SEARCH_URL = /itunes\.apple\.com\/search/;

// These tests require the Firebase Auth Emulator.
test.skip(
  () => !process.env['USE_EMULATORS'],
  'Requires Firebase Auth Emulator (USE_EMULATORS=true)'
);

test.describe('Search page', () => {
  test('shows a search bar when navigating to /tabs/search', async ({ page }) => {
    await page.goto('/tabs/search');
    const searchbar = page.locator('ion-searchbar');
    await expect(searchbar).toBeVisible();
  });

  test('shows results after typing a search term', async ({ page }) => {
    await page.route(ITUNES_SEARCH_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              collectionId: 1,
              collectionName: 'Test Podcast',
              artistName: 'Test Author',
              artworkUrl600: 'https://example.com/art.jpg',
              artworkUrl100: 'https://example.com/art.jpg',
              feedUrl: 'https://example.com/feed.xml',
              genres: ['Technology'],
              trackCount: 10,
              releaseDate: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      })
    );

    await page.goto('/tabs/search');
    const searchbar = page.locator('ion-searchbar');
    await searchbar.locator('input').fill('javascript');
    await page.waitForSelector('wavely-podcast-card', { timeout: 5000 });
    const cards = page.locator('wavely-podcast-card');
    await expect(cards).toHaveCount(1);
  });

  test('shows empty state when search returns no results', async ({ page }) => {
    await page.route(ITUNES_SEARCH_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    );

    await page.goto('/tabs/search');
    const searchbar = page.locator('ion-searchbar');
    await searchbar.locator('input').fill('xyznoexist');
    await page.waitForTimeout(500);
    const cards = page.locator('wavely-podcast-card');
    await expect(cards).toHaveCount(0);
  });
});
