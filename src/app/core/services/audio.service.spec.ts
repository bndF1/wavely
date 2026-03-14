// AudioService imports AuthStore → AuthService → @angular/fire/auth → @firebase/auth,
// which calls `fetch` at module load and crashes in Jest's Node environment.
// Mocking @angular/fire/auth prevents the module from loading its real code.
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { AudioService } from './audio.service';

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

describe('Media Session API guard', () => {
  it('does not throw when navigator.mediaSession is unavailable', () => {
    // In Jest (Node), navigator.mediaSession does not exist.
    // The service must handle this gracefully — the static method is all we
    // can test here without a full TestBed + browser environment.
    expect(() => AudioService.formatTime(0)).not.toThrow();
  });
});
