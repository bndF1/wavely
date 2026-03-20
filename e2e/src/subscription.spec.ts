import { test, expect } from './fixtures/auth.fixture';
import { clickInViewport } from './helpers/interactions';

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

    // Capture browser errors so CI logs show Firestore/Angular failures.
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('[browser:error]', msg.text());
    });
    page.on('pageerror', (err) => console.error('[browser:pageerror]', err.message));

    await page.goto(`/podcast/${podcast.id}`);
    await expect(page.locator('.podcast-header:not(.skeleton-header)')).toBeVisible({ timeout: 15000 });

    // Wait for Firebase Auth to restore the session. Without this, clicking
    // Subscribe before auth resolves causes a race: the subscription is added
    // locally (uid=null, no Firestore write), then AuthStore.init() processes
    // the restored user and calls clearSubscriptions(), wiping it.
    await page.waitForFunction(() => (window as any)['__e2eAuthReady'] === true, { timeout: 15000 });

    // On test retry the podcast may already be subscribed in Firestore from the
    // previous run. Skip clicking if the "Subscribed" button is already visible.
    const alreadySubscribed = await page.locator('ion-button').filter({ hasText: /\bSubscribed\b/i }).isVisible();
    if (!alreadySubscribed) {
      // Use plain .click() (not clickInViewport) — the Subscribe button is in
      // a fixed Ionic header so it is always in the viewport. clickInViewport
      // uses force:true which may interact differently with Ionic event delivery.
      await page.locator('ion-button').filter({ hasText: /\bSubscribe\b/i }).click();
      await expect(page.locator('ion-button').filter({ hasText: /\bSubscribed\b/i })).toBeVisible({ timeout: 10000 });
    }

    // SPA navigation preserves PodcastsStore state; page.goto would reload and
    // lose the subscription before the Firestore write completes.
    void page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library').catch(() => {});
    await page.waitForURL('/tabs/library');
    await expect(page.locator('ion-title, h1.desktop-page-title').filter({ hasText: 'Library' })).toBeVisible();
    // Use \b only at start: the item's text content is "TitleAuthor✕Unsubscribe" (concatenated),
    // so there is no word boundary after "Podcast" (next char is "S" of author text).
    // \b at start is enough to exclude "UnsubscribeTitle" from matching "SubscribeTitle".
    await expect(page.locator('ion-item-sliding').filter({ hasText: new RegExp(`\\b${podcast.title}`) })).toBeVisible({ timeout: 10000 });
  });

  test('unsubscribe removes podcast from library', async ({ page }) => {
    const podcast = { id: '62002', title: 'Unsubscribe Flow Podcast' };
    await mockPodcastEndpoints(page, podcast);

    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('[browser:error]', msg.text());
    });
    page.on('pageerror', (err) => console.error('[browser:pageerror]', err.message));

    await page.goto(`/podcast/${podcast.id}`);
    await expect(page.locator('.podcast-header:not(.skeleton-header)')).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => (window as any)['__e2eAuthReady'] === true, { timeout: 15000 });

    const alreadySubscribed = await page.locator('ion-button').filter({ hasText: /\bSubscribed\b/i }).isVisible();
    if (!alreadySubscribed) {
      await page.locator('ion-button').filter({ hasText: /\bSubscribe\b/i }).click();
      await expect(page.locator('ion-button').filter({ hasText: /\bSubscribed\b/i })).toBeVisible({ timeout: 10000 });
    }

    void page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/library').catch(() => {});
    await page.waitForURL('/tabs/library');
    await expect(page.locator('ion-title, h1.desktop-page-title').filter({ hasText: 'Library' })).toBeVisible();
    const titleRegex = new RegExp(`\\b${podcast.title}`);
    await expect(page.locator('ion-item-sliding').filter({ hasText: titleRegex })).toBeVisible({ timeout: 15000 });

    const podcastItem = page.locator('ion-item-sliding').filter({ hasText: titleRegex });
    await podcastItem.scrollIntoViewIfNeeded();
    await clickInViewport(podcastItem.locator('ion-button[slot="end"]'));
    await expect(page.locator('ion-item-sliding').filter({ hasText: titleRegex })).toHaveCount(0);
  });
});
