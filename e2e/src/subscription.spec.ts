import { test, expect } from './fixtures/auth.fixture';

const ITUNES_LOOKUP_URL = /itunes\.apple\.com\/lookup/;

function podcastLookupResult(id: string, title: string) {
  return {
    collectionId: Number(id),
    collectionName: title,
    collectionCensoredName: `${title} description`,
    artistName: 'Subscription Test Author',
    artworkUrl600: 'https://example.com/art-600.jpg',
    artworkUrl100: 'https://example.com/art-100.jpg',
    feedUrl: 'https://example.com/feed.xml',
    genres: ['Technology'],
    trackCount: 8,
    releaseDate: '2024-01-10T00:00:00Z',
  };
}

function episodeLookupResult(podcastId: string) {
  return {
    kind: 'podcast-episode',
    trackId: Number(`${podcastId}01`),
    collectionId: Number(podcastId),
    trackName: `Episode for ${podcastId}`,
    description: 'Episode description',
    previewUrl: 'https://example.com/episode.mp3',
    artworkUrl600: 'https://example.com/episode-600.jpg',
    artworkUrl160: 'https://example.com/episode-160.jpg',
    trackTimeMillis: 1500000,
    releaseDate: '2024-01-11T00:00:00Z',
  };
}

async function mockPodcastEndpoints(
  page: import('@playwright/test').Page,
  podcast: { id: string; title: string }
): Promise<void> {
  await page.route(ITUNES_LOOKUP_URL, async (route) => {
    const url = new URL(route.request().url());
    const entity = url.searchParams.get('entity');

    if (entity === 'podcastEpisode') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [episodeLookupResult(podcast.id)] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [podcastLookupResult(podcast.id, podcast.title)] }),
    });
  });
}

test.skip(() => !process.env['USE_EMULATORS'], 'Requires Firebase emulators');

test.describe.serial('Subscriptions', () => {
  test('subscribe to podcast then appears in library', async ({ page }) => {
    const podcast = { id: '62001', title: 'Subscribe Flow Podcast' };

    // Diagnostic logging for CI debugging
    page.on('console', (msg) => console.log(`[sub-test:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.error('[sub-test:pageerror]', err.message));
    page.on('response', (res) => {
      if (res.url().includes('itunes') || res.status() >= 400) {
        console.log(`[sub-test:response] ${res.status()} ${res.url()}`);
      }
    });

    await mockPodcastEndpoints(page, podcast);

    console.log('[sub-test] navigating to podcast detail...');
    await page.goto(`/podcast/${podcast.id}`, { waitUntil: 'domcontentloaded' });
    console.log('[sub-test] page loaded, URL:', page.url());

    // Wait for Angular to finish rendering the podcast content
    await expect(page.locator('.podcast-header:not(.skeleton-header)')).toBeVisible({ timeout: 15000 });
    console.log('[sub-test] podcast header visible, looking for subscribe button...');

    await page.locator('ion-button').filter({ hasText: /^Subscribe$/i }).click();
    // Wait for the optimistic update to reflect in the UI before navigating
    await expect(page.locator('ion-button').filter({ hasText: /^Subscribed$/i })).toBeVisible({ timeout: 10000 });

    // SPA navigation preserves PodcastsStore state; page.goto would reload and
    // lose the subscription before the Firestore write completes.
    // Fire-and-forget: Angular router navigation destroys the JS execution context,
    // so page.evaluate rejects with "Execution context was destroyed" — that's expected.
    void page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library').catch(() => {});
    await page.waitForURL('/tabs/library');
    await expect(page.locator('ion-title').filter({ hasText: 'Library' })).toBeVisible();
    await expect(page.locator('ion-item-sliding').filter({ hasText: podcast.title })).toBeVisible({ timeout: 10000 });
  });

  test('unsubscribe removes podcast from library', async ({ page }) => {
    const podcast = { id: '62002', title: 'Unsubscribe Flow Podcast' };
    await mockPodcastEndpoints(page, podcast);

    await page.goto(`/podcast/${podcast.id}`);
    await page.locator('ion-button').filter({ hasText: /^Subscribe$/i }).click();
    // Wait for the optimistic update to reflect in the UI before navigating
    // (button changes to 'Subscribed' as soon as the store adds the podcast)
    await expect(page.locator('ion-button').filter({ hasText: /^Subscribed$/i })).toBeVisible({ timeout: 10000 });

    void page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library').catch(() => {});
    await page.waitForURL('/tabs/library');
    await expect(page.locator('ion-title').filter({ hasText: 'Library' })).toBeVisible();
    await expect(page.locator('ion-item-sliding').filter({ hasText: podcast.title })).toBeVisible({ timeout: 15000 });

    const podcastItem = page.locator('ion-item-sliding').filter({ hasText: podcast.title });
    await podcastItem.locator('ion-button[slot="end"]').click();
    await expect(page.locator('ion-item-sliding').filter({ hasText: podcast.title })).toHaveCount(0);
  });
});
