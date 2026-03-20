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
  // Player tests require mobile viewport — the full-player modal is suppressed on desktop (≥1024px)
  // to show controls inline instead. Locking to 390px ensures consistent behaviour across CI.
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    // Prevent AudioService from calling store.pause() in CI where real audio
    // URLs can't load. Two guard layers:
    // 1. play() always resolves — the .catch() path in AudioService never fires.
    // 2. Suppress 'error' addEventListener on media elements — the browser's
    //    audio-load-failure error event has no handler to call store.pause().
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () {
        return Promise.resolve();
      };
      const origAddEventListener = HTMLMediaElement.prototype.addEventListener;
      HTMLMediaElement.prototype.addEventListener = function (type, listener, options) {
        if (type === 'error') return; // block AudioService's error → store.pause() path
        origAddEventListener.call(this, type, listener, options);
      };
    });

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
    await page.getByRole('button', { name: `Play ${PLAYER_EPISODE.title}`, exact: true }).click();
    // v1.5.9+: episode play opens the full-player modal instead of navigating to /episode/
    const fullPlayerModal = page.locator('ion-modal.full-player-modal');
    await expect(fullPlayerModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(fullPlayerModal).not.toBeVisible();

    // Navigate within the SPA to preserve PlayerStore state (page.goto would reload)
    await page.evaluate((u: string) => (window as any)['__e2eNavigate'](u), '/tabs/home');
    await page.waitForURL('/tabs/home');
    await expect(page.locator('wavely-mini-player')).toBeVisible();
  });

  test('mini player appears when episode starts', async ({ page }) => {
    await expect(page.locator('wavely-mini-player')).toBeVisible();
    await expect(page.locator('wavely-mini-player .mini-player__title')).toHaveText(PLAYER_EPISODE.title);
  });

  test('play/pause toggle', async ({ page }) => {
    // Ionic 8 forwards aria-label from the ion-button host to its shadow <button>
    // and clears it on the host, so toHaveAttribute('aria-label') on ion-button is
    // unreliable. Assert on ion-icon[name] instead — it directly reflects isPlaying.
    const icon = page.locator('wavely-mini-player ion-button.mini-player__play-btn ion-icon');
    const toggleButton = page.locator('wavely-mini-player').locator('ion-button.mini-player__play-btn');

    await expect(icon).toHaveAttribute('name', 'pause-circle');
    await toggleButton.click();
    await expect(icon).toHaveAttribute('name', 'play-circle');

    await toggleButton.click();
    await expect(icon).toHaveAttribute('name', 'pause-circle');
  });

  test('clicking mini player opens full player', async ({ page }) => {
    await page.locator('wavely-mini-player .mini-player').click();

    await expect(page.locator('ion-modal.full-player-modal')).toBeVisible();
  });

  test('full player shows title and controls', async ({ page }) => {
    await page.locator('wavely-mini-player .mini-player').click();

    const fullPlayer = page.locator('ion-modal.full-player-modal wavely-full-player');
    await expect(fullPlayer.locator('.full-player__title')).toHaveText(PLAYER_EPISODE.title);
    await expect(fullPlayer.getByRole('button', { name: /skip back 15 seconds/i })).toBeVisible();
    await expect(fullPlayer.getByRole('button', { name: /skip forward 30 seconds/i })).toBeVisible();
    await expect(fullPlayer.locator('button.full-player__play-pause-btn')).toBeVisible();
  });
});
