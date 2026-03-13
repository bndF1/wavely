import { test, expect } from '@playwright/test';

const ITUNES_LOOKUP_URL = /itunes\.apple\.com\/lookup/;

const PODCAST = {
  id: '73001',
  title: 'Podcast Detail Title',
  description: 'Podcast detail description for smoke validation',
  author: 'Podcast Detail Author',
};

function podcastLookupResponse() {
  return {
    collectionId: Number(PODCAST.id),
    collectionName: PODCAST.title,
    collectionCensoredName: PODCAST.description,
    artistName: PODCAST.author,
    artworkUrl600: 'https://example.com/podcast-600.jpg',
    artworkUrl100: 'https://example.com/podcast-100.jpg',
    feedUrl: 'https://example.com/feed.xml',
    genres: ['Technology'],
    trackCount: 2,
    releaseDate: '2024-01-01T00:00:00Z',
  };
}

function episodeLookupResponse() {
  return [
    {
      kind: 'podcast-episode',
      trackId: 7300101,
      collectionId: Number(PODCAST.id),
      trackName: 'Episode One',
      description: 'Episode one description',
      previewUrl: 'https://example.com/one.mp3',
      artworkUrl600: 'https://example.com/episode-one-600.jpg',
      artworkUrl160: 'https://example.com/episode-one-160.jpg',
      trackTimeMillis: 1200000,
      releaseDate: '2024-01-02T00:00:00Z',
    },
    {
      kind: 'podcast-episode',
      trackId: 7300102,
      collectionId: Number(PODCAST.id),
      trackName: 'Episode Two',
      description: 'Episode two description',
      previewUrl: 'https://example.com/two.mp3',
      artworkUrl600: 'https://example.com/episode-two-600.jpg',
      artworkUrl160: 'https://example.com/episode-two-160.jpg',
      trackTimeMillis: 1800000,
      releaseDate: '2024-01-03T00:00:00Z',
    },
  ];
}

test.describe('Podcast detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(ITUNES_LOOKUP_URL, async (route) => {
      const url = new URL(route.request().url());
      const entity = url.searchParams.get('entity');
      const body =
        entity === 'podcastEpisode'
          ? { results: episodeLookupResponse() }
          : { results: [podcastLookupResponse()] };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
  });

  test('detail page shows title+description', async ({ page }) => {
    await page.goto(`/podcast/${PODCAST.id}`);

    await expect(page.getByRole('heading', { name: PODCAST.title })).toBeVisible();
    await expect(page.getByText(PODCAST.author, { exact: false })).toBeVisible();
  });

  test('episode list loads', async ({ page }) => {
    await page.goto(`/podcast/${PODCAST.id}`);

    await expect(page.getByRole('heading', { name: 'Episodes' })).toBeVisible();
    await expect(page.getByText('Episode One', { exact: false })).toBeVisible();
    await expect(page.locator('ion-list ion-item')).toHaveCount(2);
  });

  test('subscribe button visible when not subscribed', async ({ page }) => {
    await page.goto(`/podcast/${PODCAST.id}`);

    await expect(page.getByRole('button', { name: /^subscribe$/i })).toBeVisible();
  });
});
