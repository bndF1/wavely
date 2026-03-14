import { test, expect } from './fixtures/auth.fixture';

const ITUNES_TOP_PODCASTS_URL = /itunes\.apple\.com\/us\/rss\/toppodcasts\/.*\/json/;

function feedEntry(id: string, title: string, author: string, genreLabel: string) {
  return {
    'im:name': { label: title },
    'im:artist': { label: author },
    'im:image': [
      { label: 'https://example.com/100x100bb.jpg', attributes: { height: '100' } },
      { label: 'https://example.com/300x300bb.jpg', attributes: { height: '300' } },
      { label: 'https://example.com/600x600bb.jpg', attributes: { height: '600' } },
    ],
    id: { label: `podcast-${id}`, attributes: { 'im:id': id } },
    summary: { label: `${title} description` },
    category: {
      attributes: { 'im:id': '1318', term: genreLabel, label: genreLabel },
    },
  };
}

test.skip(() => !process.env['USE_EMULATORS'], 'Requires Firebase emulators');

test.describe('Browse page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(ITUNES_TOP_PODCASTS_URL, async (route) => {
      const url = new URL(route.request().url());
      const genreId = url.pathname.match(/genre\/(\d+)/)?.[1] ?? 'all';

      const payloadByGenre: Record<string, unknown[]> = {
        all: [
          feedEntry('51001', 'All Category Podcast', 'All Author', 'Technology'),
          feedEntry('51002', 'General Browse Podcast', 'Browse Team', 'Business'),
        ],
        '1303': [feedEntry('52003', 'Comedy Gold', 'Funny Host', 'Comedy')],
        '1489': [feedEntry('52004', 'News Daily', 'News Desk', 'News')],
      };

      const entry = payloadByGenre[genreId] ?? payloadByGenre['all'];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ feed: { entry } }),
      });
    });
  });

  test('browse tab/category grid renders', async ({ page }) => {
    await page.goto('/tabs/browse');

    await expect(page.locator('ion-title').filter({ hasText: 'Browse' })).toBeVisible();
    await expect(page.locator('.category-row ion-chip')).toHaveCount(12);
    await expect(page.locator('wavely-podcast-card').first()).toBeVisible();
  });

  test('clicking category navigates to category detail page', async ({ page }) => {
    await page.goto('/tabs/browse');
    // Wait for initial podcasts to load before interacting
    await page.locator('wavely-podcast-card').first().waitFor({ timeout: 10000 });

    // Clicking a non-"All" category chip now navigates to /browse/category/:genreId
    await Promise.all([
      page.waitForURL(/\/browse\/category\/1303/, { timeout: 10000 }),
      page.locator('ion-chip').filter({ hasText: /^Comedy$/ }).locator('ion-label').click(),
    ]);
    await expect(page.url()).toContain('/browse/category/1303');
    // Category detail page should load and show results for genre 1303
    await expect(page.locator('wavely-podcast-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Comedy Gold', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('trending/new sections visible', async ({ page }) => {
    await page.goto('/tabs/browse');

    await expect(page.getByText('News', { exact: true })).toBeVisible();
    await expect(page.locator('wavely-podcast-card')).not.toHaveCount(0);
  });
});
