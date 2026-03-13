import { test, expect } from './fixtures/auth.fixture';

const ITUNES_LOOKUP_URL = /itunes\.apple\.com\/lookup/;

const PLAYER_PODCAST = {
  id: '84001',
  title: 'Player Podcast',
  author: 'Playback Author',
};

const PLAYER_EPISODE = {
  id: '8400101',
  title: 'Mini Player Episode',
};

function lookupPodcastResult() {
  return {
    collectionId: Number(PLAYER_PODCAST.id),
    collectionName: PLAYER_PODCAST.title,
    collectionCensoredName: 'Podcast for player tests',
    artistName: PLAYER_PODCAST.author,
    artworkUrl600: 'https://example.com/player-art-600.jpg',
    artworkUrl100: 'https://example.com/player-art-100.jpg',
    feedUrl: 'https://example.com/player-feed.xml',
    genres: ['Technology'],
    trackCount: 3,
    releaseDate: '2024-02-01T00:00:00Z',
  };
}

function lookupEpisodeResult() {
  return {
    kind: 'podcast-episode',
    trackId: Number(PLAYER_EPISODE.id),
    collectionId: Number(PLAYER_PODCAST.id),
    trackName: PLAYER_EPISODE.title,
    description: 'Episode used for player e2e tests',
    previewUrl: 'https://example.com/player-episode.mp3',
    artworkUrl600: 'https://example.com/player-episode-600.jpg',
    artworkUrl160: 'https://example.com/player-episode-160.jpg',
    trackTimeMillis: 1800000,
    releaseDate: '2024-02-02T00:00:00Z',
  };
}

test.skip(() => !process.env['USE_EMULATORS'], 'Requires Firebase emulators');

test.describe('Player', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(ITUNES_LOOKUP_URL, async (route) => {
      const url = new URL(route.request().url());
      const entity = url.searchParams.get('entity');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: entity === 'podcastEpisode' ? [lookupEpisodeResult()] : [lookupPodcastResult()],
        }),
      });
    });

    await page.goto(`/podcast/${PLAYER_PODCAST.id}`);
    await page.getByRole('button', { name: new RegExp(`Play ${PLAYER_EPISODE.title}`, 'i') }).click();
    await expect(page).toHaveURL(/\/episode\//);

    await page.goto('/tabs/home');
    await expect(page.locator('wavely-mini-player')).toBeVisible();
  });

  test('mini player appears when episode starts', async ({ page }) => {
    await expect(page.locator('wavely-mini-player')).toBeVisible();
    await expect(page.locator('wavely-mini-player .mini-player__title')).toHaveText(PLAYER_EPISODE.title);
  });

  test('play/pause toggle', async ({ page }) => {
    const toggleButton = page.locator('wavely-mini-player').getByRole('button', { name: /pause|play/i });

    await expect(toggleButton).toHaveAttribute('aria-label', /pause/i);
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-label', /play/i);

    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-label', /pause/i);
  });

  test('clicking mini player opens full player', async ({ page }) => {
    await page.locator('wavely-mini-player .mini-player').click();

    const fullPlayer = page.locator('ion-modal.full-player-modal wavely-full-player');
    await expect(fullPlayer).toBeVisible();
  });

  test('full player shows title and controls', async ({ page }) => {
    await page.locator('wavely-mini-player .mini-player').click();

    const fullPlayer = page.locator('ion-modal.full-player-modal wavely-full-player');
    await expect(fullPlayer.locator('.full-player__title')).toHaveText(PLAYER_EPISODE.title);
    await expect(fullPlayer.getByRole('button', { name: /skip back 15 seconds/i })).toBeVisible();
    await expect(fullPlayer.getByRole('button', { name: /skip forward 30 seconds/i })).toBeVisible();
    await expect(fullPlayer.getByRole('button', { name: /pause|play/i })).toBeVisible();
  });
});
