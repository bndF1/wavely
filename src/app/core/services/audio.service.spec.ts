// Mock @angular/fire/auth to avoid firebase node fetch dependency in Jest.
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { AudioService } from './audio.service';
import { Episode } from '../models/podcast.model';

describe('AudioService.formatTime()', () => {
  describe('valid inputs', () => {
    it('formats zero as 0:00', () => {
      expect(AudioService.formatTime(0)).toBe('0:00');
    });

    it('formats seconds under a minute', () => {
      expect(AudioService.formatTime(5)).toBe('0:05');
      expect(AudioService.formatTime(59)).toBe('0:59');
    });

    it('formats exactly one minute', () => {
      expect(AudioService.formatTime(60)).toBe('1:00');
    });

    it('formats minutes and seconds', () => {
      expect(AudioService.formatTime(90)).toBe('1:30');
      expect(AudioService.formatTime(3599)).toBe('59:59');
    });

    it('formats exactly one hour', () => {
      expect(AudioService.formatTime(3600)).toBe('1:00:00');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(AudioService.formatTime(3661)).toBe('1:01:01');
      expect(AudioService.formatTime(7384)).toBe('2:03:04');
    });

    it('pads single-digit minutes and seconds with leading zeros', () => {
      expect(AudioService.formatTime(65)).toBe('1:05');
      expect(AudioService.formatTime(3605)).toBe('1:00:05');
    });
  });

  describe('edge / invalid inputs', () => {
    it('returns 0:00 for negative values', () => {
      expect(AudioService.formatTime(-1)).toBe('0:00');
      expect(AudioService.formatTime(-999)).toBe('0:00');
    });

    it('returns 0:00 for Infinity', () => {
      expect(AudioService.formatTime(Infinity)).toBe('0:00');
    });

    it('returns 0:00 for NaN', () => {
      expect(AudioService.formatTime(NaN)).toBe('0:00');
    });

    it('floors fractional seconds', () => {
      expect(AudioService.formatTime(90.9)).toBe('1:30');
      expect(AudioService.formatTime(3600.1)).toBe('1:00:00');
    });
  });
});

describe('AudioService Media Session wiring', () => {
  const episode: Episode = {
    id: 'ep-1',
    podcastId: 'pod-1',
    title: 'Episode 1',
    description: 'Description',
    audioUrl: 'https://cdn.example.com/ep-1.mp3',
    imageUrl: 'https://cdn.example.com/ep-1.jpg',
    releaseDate: '2025-01-01T00:00:00.000Z',
    duration: 600,
  };

  afterEach(() => {
    delete (navigator as Partial<Navigator> & { mediaSession?: unknown }).mediaSession;
    delete (globalThis as { MediaMetadata?: unknown }).MediaMetadata;
  });

  it('registers action handlers and updates metadata when mediaSession is available', () => {
    const mockStore = {
      resume: jest.fn(),
      pause: jest.fn(),
      skipBack: jest.fn(),
      skipForward: jest.fn(),
      playNext: jest.fn(),
      currentTime: jest.fn(() => 0),
    };

    const mockMediaSession = {
      metadata: null as unknown,
      playbackState: 'none' as MediaSessionPlaybackState,
      setActionHandler: jest.fn(),
      setPositionState: jest.fn(),
    };

    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: mockMediaSession,
    });

    (globalThis as { MediaMetadata: unknown }).MediaMetadata = class {
      constructor(init: unknown) {
        Object.assign(this, init as object);
      }
    } as unknown as typeof MediaMetadata;

    const service = Object.create(AudioService.prototype) as {
      platformId: object;
      store: typeof mockStore;
      setupMediaSession: () => void;
      updateMediaSession: (episode: Episode | null) => void;
    };

    service.platformId = 'browser';
    service.store = mockStore;

    service.setupMediaSession();
    service.updateMediaSession(episode);

    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));

    expect(mockMediaSession.metadata).toMatchObject({
      title: episode.title,
      artist: episode.podcastId,
      artwork: [{ src: episode.imageUrl, sizes: '512x512', type: 'image/jpeg' }],
    });
  });
});
