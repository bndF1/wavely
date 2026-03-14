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
  const episode: Episode & { podcastTitle?: string } = {
    id: 'ep-1',
    podcastId: 'pod-1',
    podcastTitle: 'Podcast Title',
    title: 'Episode 1',
    description: 'Description',
    audioUrl: 'https://cdn.example.com/ep-1.mp3',
    imageUrl: 'https://cdn.example.com/ep-1.jpg',
    releaseDate: '2025-01-01T00:00:00.000Z',
    duration: 600,
  };

  let originalMediaSession: MediaSession | undefined;
  let originalMediaMetadata: typeof MediaMetadata | undefined;

  beforeEach(() => {
    originalMediaSession = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    originalMediaMetadata = (globalThis as typeof globalThis & { MediaMetadata?: typeof MediaMetadata }).MediaMetadata;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      writable: true,
      value: originalMediaSession,
    });
    (globalThis as typeof globalThis & { MediaMetadata?: typeof MediaMetadata }).MediaMetadata = originalMediaMetadata;
    jest.restoreAllMocks();
  });

  function createServiceMocks() {
    const mockStore = {
      resume: jest.fn(),
      pause: jest.fn(),
      close: jest.fn(),
      skipBack: jest.fn(),
      skipForward: jest.fn(),
      playNext: jest.fn(),
      seek: jest.fn(),
      currentTime: jest.fn(() => 12),
      playbackRate: jest.fn(() => 1.25),
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

    (globalThis as typeof globalThis & { MediaMetadata?: typeof MediaMetadata }).MediaMetadata = class {
      constructor(init: unknown) {
        Object.assign(this, init as object);
      }
    } as unknown as typeof MediaMetadata;

    const service = Object.create(AudioService.prototype) as {
      platformId: object;
      store: typeof mockStore;
      mediaSessionHandlersRegistered: boolean;
      lastMediaSessionPositionUpdateMs: number;
      setupMediaSession: () => void;
      updateMediaSession: (episode: Episode | null) => void;
      updateMediaSessionPlaybackState: (playing: boolean) => void;
      updateMediaSessionPositionState: (currentTime: number, duration: number) => void;
    };

    service.platformId = 'browser';
    service.store = mockStore;
    service.mediaSessionHandlersRegistered = false;
    service.lastMediaSessionPositionUpdateMs = 0;

    return { service, mockStore, mockMediaSession };
  }

  it('registers handlers once for supported actions', () => {
    const { service, mockMediaSession } = createServiceMocks();

    service.setupMediaSession();
    service.setupMediaSession();

    expect(mockMediaSession.setActionHandler).toHaveBeenCalledTimes(8);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('stop', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));
  });

  it('sets metadata from episode title and display-friendly artist', () => {
    const { service, mockMediaSession } = createServiceMocks();

    service.updateMediaSession(episode);

    expect(mockMediaSession.metadata).toMatchObject({
      title: episode.title,
      artist: episode.podcastTitle,
      artwork: [{ src: episode.imageUrl, sizes: '512x512' }],
    });

    service.updateMediaSession({ ...episode, id: 'ep-2', imageUrl: undefined });
    expect((mockMediaSession.metadata as { artwork: unknown[] }).artwork).toEqual([]);
  });

  it('updates playbackState for play/pause', () => {
    const { service, mockMediaSession } = createServiceMocks();

    service.updateMediaSessionPlaybackState(true);
    expect(mockMediaSession.playbackState).toBe('playing');

    service.updateMediaSessionPlaybackState(false);
    expect(mockMediaSession.playbackState).toBe('paused');
  });

  it('throttles setPositionState and clamps position to [0, duration]', () => {
    const { service, mockMediaSession } = createServiceMocks();
    const nowSpy = jest.spyOn(Date, 'now');

    nowSpy.mockReturnValue(10000);
    service.updateMediaSessionPositionState(-5, 60);
    expect(mockMediaSession.setPositionState).toHaveBeenCalledWith({
      duration: 60,
      playbackRate: 1.25,
      position: 0,
    });

    nowSpy.mockReturnValue(12000);
    service.updateMediaSessionPositionState(20, 60);
    expect(mockMediaSession.setPositionState).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(15001);
    service.updateMediaSessionPositionState(99, 60);
    expect(mockMediaSession.setPositionState).toHaveBeenCalledTimes(2);
    expect(mockMediaSession.setPositionState).toHaveBeenLastCalledWith({
      duration: 60,
      playbackRate: 1.25,
      position: 60,
    });

    service.updateMediaSessionPositionState(30, 0);
    expect(mockMediaSession.setPositionState).toHaveBeenCalledTimes(2);
  });
});
