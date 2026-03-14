import { test, expect } from './fixtures/auth.fixture';

const ITUNES_TOP_PODCASTS_URL = /itunes\.apple\.com\/us\/rss\/toppodcasts\/.*\/json/;
const ITUNES_LOOKUP_URL = /itunes\.apple\.com\/lookup/;

const TRENDING_PODCAST = {
  id: '41001',
  title: 'Home Trending Podcast',
  author: 'Wavely Newsroom',
  description: 'A trending podcast for home tests',
};

const SUBSCRIPTION_PODCAST = {
  id: '41002',
  title: 'Home Subscription Podcast',
  author: 'Subscription Author',
  description: 'Podcast used to verify subscriptions section rendering',
};

function topPodcastFeedEntry(podcast: {
  id: string;
  title: string;
  author: string;
  description: string;
}) {
  return {
    'im:name': { label: podcast.title },
    'im:artist': { label: podcast.author },
    'im:image': [
      { label: 'https://example.com/100x100bb.jpg', attributes: { height: '100' } },
      { label: 'https://example.com/300x300bb.jpg', attributes: { height: '300' } },
      { label: 'https://example.com/600x600bb.jpg', attributes: { height: '600' } },
    ],
    id: { label: `podcast-${podcast.id}`, attributes: { 'im:id': podcast.id } },
    summary: { label: podcast.description },
    category: { attributes: { 'im:id': '1318', term: 'Technology', label: 'Technology' } },
  };
}

function lookupPodcastResult(podcast: {
  id: string;
  title: string;
  author: string;
  description: string;
}) {
  return {
    collectionId: Number(podcast.id),
    collectionName: podcast.title,
    collectionCensoredName: podcast.description,
    artistName: podcast.author,
    artworkUrl600: 'https://example.com/art-600.jpg',
    artworkUrl100: 'https://example.com/art-100.jpg',
    feedUrl: 'https://example.com/feed.xml',
    genres: ['Technology'],
    trackCount: 4,
    releaseDate: '2024-01-01T00:00:00Z',
  };
}

function lookupEpisodeResult(podcastId: string) {
  return {
    kind: 'podcast-episode',
    trackId: 93001,
    collectionId: Number(podcastId),
    trackName: 'Home Subscription Episode',
    description: 'Episode used for e2e assertions',
    previewUrl: 'https://example.com/episode.mp3',
    artworkUrl600: 'https://example.com/episode-art-600.jpg',
    artworkUrl160: 'https://example.com/episode-art-160.jpg',
    trackTimeMillis: 1800000,
    releaseDate: '2024-02-02T00:00:00Z',
  };
}

test.skip(() => !process.env['USE_EMULATORS'], 'Requires Firebase emulators');

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(ITUNES_TOP_PODCASTS_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feed: {
            entry: [topPodcastFeedEntry(TRENDING_PODCAST)],
          },
        }),
      });
    });
  });

  test('home tab active after load', async ({ page }) => {
    await page.goto('/tabs');
    await expect(page).toHaveURL(/\/tabs\/home/);

    const homeTab = page.getByRole('tab', { name: /home/i });
    await expect(homeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('home page basic smoke render', async ({ page }) => {
    await page.goto('/tabs/home');

    await expect(page.getByRole('heading', { name: 'Trending' })).toBeVisible();
    await expect(page.locator('wavely-podcast-card').first()).toBeVisible();
    await expect(page.getByText(TRENDING_PODCAST.title, { exact: false })).toBeVisible();
  });

  test('authenticated state renders subscriptions section', async ({ page }) => {
    await page.route(ITUNES_LOOKUP_URL, async (route) => {
      const url = new URL(route.request().url());
      const entity = url.searchParams.get('entity');

      if (entity === 'podcastEpisode') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: [lookupEpisodeResult(SUBSCRIPTION_PODCAST.id)] }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [lookupPodcastResult(SUBSCRIPTION_PODCAST)] }),
      });
    });

    await page.goto(`/podcast/${SUBSCRIPTION_PODCAST.id}`);
    await page.getByRole('button', { name: /^subscribe$/i }).click();

    // Navigate within the SPA to preserve PodcastsStore state (page.goto would reload,
    // potentially losing the subscription before the Firestore write completes)
    await page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/home');
    await page.waitForURL('/tabs/home');
    await expect(page.getByRole('heading', { name: 'My Podcasts' })).toBeVisible();
    await expect(page.getByText(SUBSCRIPTION_PODCAST.title, { exact: false })).toBeVisible();
  });
});
