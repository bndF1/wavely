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

test.describe('Discover browse content', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(ITUNES_TOP_PODCASTS_URL, async (route) => {
      const url = new URL(route.request().url());
      const genreId = url.pathname.match(/genre=(\d+)/)?.[1] ?? 'all';

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

  test('old browse path redirects to discover', async ({ page }) => {
    await page.goto('/tabs/browse');
    await expect(page).toHaveURL(/\/tabs\/discover/);
  });

  test('discover tab/category grid renders', async ({ page }) => {
    await page.goto('/tabs/discover');

    await expect(page.locator('ion-title, h1.desktop-page-title').filter({ hasText: 'Discover' })).toBeVisible();
    await expect(page.locator('.category-row ion-chip')).toHaveCount(12);
    await expect(page.locator('wavely-podcast-card').first()).toBeVisible();
  });

  test('clicking category navigates to category detail page', async ({ page }) => {
    await page.goto('/tabs/discover');
    await page.locator('wavely-podcast-card').first().waitFor({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/\/browse\/category\/1303/, { timeout: 10000 }),
      page.locator('ion-chip').filter({ hasText: /^Comedy$/ }).locator('ion-label').click(),
    ]);

    await expect(page.url()).toContain('/browse/category/1303');
    await expect(page.locator('wavely-podcast-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Comedy Gold', { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
