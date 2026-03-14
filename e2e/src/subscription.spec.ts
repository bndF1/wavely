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
    await mockPodcastEndpoints(page, podcast);

    await page.goto(`/podcast/${podcast.id}`);
    await page.getByRole('button', { name: /^subscribe$/i }).click();

    // SPA navigation preserves PodcastsStore state; page.goto would reload and
    // lose the subscription before the Firestore write completes.
    await page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library');
    await page.waitForURL('/tabs/library');
    // ion-title doesn't expose role="heading" — match via locator
    await expect(page.locator('ion-title').filter({ hasText: 'Library' })).toBeVisible();
    // Library renders subscriptions as ion-item with ion-label h2 (not wavely-podcast-card)
    await expect(page.locator('ion-label h2').filter({ hasText: podcast.title })).toBeVisible();
  });

  test('unsubscribe removes podcast from library', async ({ page }) => {
    const podcast = { id: '62002', title: 'Unsubscribe Flow Podcast' };
    await mockPodcastEndpoints(page, podcast);

    await page.goto(`/podcast/${podcast.id}`);
    await page.getByRole('button', { name: /^subscribe$/i }).click();

    await page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library');
    await page.waitForURL('/tabs/library');
    await expect(page.locator('ion-title').filter({ hasText: 'Library' })).toBeVisible();
    // Library renders subscriptions as ion-item with ion-label h2 (not wavely-podcast-card)
    await expect(page.locator('ion-label h2').filter({ hasText: podcast.title })).toBeVisible({ timeout: 10000 });

    // Use ion-button[aria-label] selector to avoid strict mode violation:
    // getByRole matches both the ion-item's native button AND the ion-button ✕ button
    // because the ion-item's accessible name includes the aria-label of child buttons.
    await page
      .locator(`ion-button[aria-label="Unsubscribe from ${podcast.title}"]`)
      .click();
    await expect(page.locator('ion-label h2').filter({ hasText: podcast.title })).toHaveCount(0);
  });
});
