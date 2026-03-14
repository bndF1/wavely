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

    // Serve a minimal valid WAV so the <audio> element loads without error
    // (prevents AudioService from calling store.pause() on load failure)
    await page.route('https://example.com/player-episode.mp3', async (route) => {
      const wav = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x26, 0x00, 0x00, 0x00, // RIFF, size=38
        0x57, 0x41, 0x56, 0x45,                         // WAVE
        0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, // fmt , size=16
        0x01, 0x00, 0x01, 0x00,                         // PCM, mono
        0x44, 0xac, 0x00, 0x00,                         // 44100 Hz
        0x88, 0x58, 0x01, 0x00,                         // byte rate
        0x02, 0x00, 0x10, 0x00,                         // block align, 16-bit
        0x64, 0x61, 0x74, 0x61, 0x02, 0x00, 0x00, 0x00, // data, size=2
        0x00, 0x00,                                     // 1 sample of silence
      ]);
      await route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        body: wav,
        headers: { 'Accept-Ranges': 'bytes' },
      });
    });

    await page.goto(`/podcast/${PLAYER_PODCAST.id}`);
    await page.getByRole('button', { name: new RegExp(`Play ${PLAYER_EPISODE.title}`, 'i') }).click();
    await expect(page).toHaveURL(/\/episode\//);

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
    const toggleButton = page.locator('wavely-mini-player').locator('ion-button.mini-player__play-btn');

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
    await expect(fullPlayer.locator('button.full-player__play-pause-btn')).toBeVisible();
  });
});
