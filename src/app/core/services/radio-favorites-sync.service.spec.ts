// Mock @angular/fire/firestore before any imports that use it
jest.mock('@angular/fire/firestore', () => ({
  Firestore: class MockFirestore {},
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(() => ({ id: 'mock-collection' })),
}));

// Mock localStorage for UserPreferencesService
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { RadioFavoritesSyncService } from './radio-favorites-sync.service';
import { UserPreferencesService } from './user-preferences.service';
import { RadioStation } from '../models/radio-station.model';

function mockStation(overrides: Partial<RadioStation> = {}): RadioStation {
  return {
    stationuuid: 'uuid-1',
    name: 'Test Radio',
    url_resolved: 'https://stream.example.com',
    favicon: 'https://example.com/favicon.ico',
    countrycode: 'US',
    language: 'english',
    tags: 'pop,rock',
    votes: 100,
    clickcount: 500,
    bitrate: 128,
    codec: 'MP3',
    ...overrides,
  };
}

describe('RadioFavoritesSyncService', () => {
  let service: RadioFavoritesSyncService;
  let prefs: UserPreferencesService;
  let mockSetDoc: jest.Mock;
  let mockDeleteDoc: jest.Mock;
  let mockGetDocs: jest.Mock;

  beforeEach(() => {
    localStorageMock.clear();
    const firestoreMock = jest.requireMock('@angular/fire/firestore');
    mockSetDoc = firestoreMock.setDoc;
    mockDeleteDoc = firestoreMock.deleteDoc;
    mockGetDocs = firestoreMock.getDocs;

    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });

    TestBed.configureTestingModule({
      providers: [
        RadioFavoritesSyncService,
        UserPreferencesService,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(RadioFavoritesSyncService);
    prefs = TestBed.inject(UserPreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('addFavorite()', () => {
    it('adds station to prefs immediately (optimistic update)', async () => {
      const station = mockStation({ stationuuid: 'uuid-add' });
      await service.addFavorite(station, 'uid-1');
      expect(prefs.favoriteStations()).toContainEqual(station);
    });

    it('writes to Firestore when uid is provided', async () => {
      await service.addFavorite(mockStation(), 'uid-1');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('does NOT write to Firestore when uid is null', async () => {
      await service.addFavorite(mockStation(), null);
      expect(prefs.favoriteStations()).toHaveLength(1);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('does not add duplicate station', async () => {
      const station = mockStation({ stationuuid: 'uuid-dup' });
      prefs.addFavoriteStation(station);
      await service.addFavorite(station, 'uid-1');
      expect(prefs.favoriteStations().filter((s) => s.stationuuid === 'uuid-dup')).toHaveLength(1);
    });

    it('rolls back store on Firestore failure', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore unavailable'));
      const station = mockStation({ stationuuid: 'uuid-rollback' });
      await service.addFavorite(station, 'uid-1');
      expect(prefs.favoriteStations()).not.toContainEqual(station);
    });
  });

  describe('removeFavorite()', () => {
    it('removes station from prefs immediately (optimistic update)', async () => {
      const station = mockStation({ stationuuid: 'uuid-remove' });
      prefs.addFavoriteStation(station);
      await service.removeFavorite('uuid-remove', 'uid-1');
      expect(prefs.favoriteStations()).not.toContainEqual(station);
    });

    it('deletes from Firestore when uid is provided', async () => {
      const station = mockStation({ stationuuid: 'uuid-del' });
      prefs.addFavoriteStation(station);
      await service.removeFavorite('uuid-del', 'uid-1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('does NOT delete from Firestore when uid is null', async () => {
      const station = mockStation({ stationuuid: 'uuid-noauth' });
      prefs.addFavoriteStation(station);
      await service.removeFavorite('uuid-noauth', null);
      expect(prefs.favoriteStations()).not.toContainEqual(station);
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('rolls back store on Firestore failure', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Firestore unavailable'));
      const station = mockStation({ stationuuid: 'uuid-rollback-rm' });
      prefs.addFavoriteStation(station);
      await service.removeFavorite('uuid-rollback-rm', 'uid-1');
      expect(prefs.favoriteStations()).toContainEqual(station);
    });
  });

  describe('syncToggle()', () => {
    it('adds station when not currently a favorite', async () => {
      const station = mockStation({ stationuuid: 'uuid-toggle-add' });
      await service.syncToggle(station, 'uid-1');
      expect(prefs.isFavorite('uuid-toggle-add')).toBe(true);
    });

    it('removes station when already a favorite', async () => {
      const station = mockStation({ stationuuid: 'uuid-toggle-rm' });
      prefs.addFavoriteStation(station);
      await service.syncToggle(station, 'uid-1');
      expect(prefs.isFavorite('uuid-toggle-rm')).toBe(false);
    });
  });

  describe('clearFavorites()', () => {
    it('empties the in-memory favorites list', () => {
      prefs.addFavoriteStation(mockStation({ stationuuid: 'uuid-a' }));
      prefs.addFavoriteStation(mockStation({ stationuuid: 'uuid-b' }));
      service.clearFavorites();
      expect(prefs.favoriteStations()).toEqual([]);
    });
  });

  describe('loadFromFirestore()', () => {
    it('sets favorites from Firestore data', async () => {
      const station = mockStation({ stationuuid: 'uuid-remote' });
      mockGetDocs.mockResolvedValue({ docs: [{ data: () => station }] });
      await service.loadFromFirestore('uid-1', () => true);
      expect(prefs.favoriteStations()).toContainEqual(station);
    });

    it('discards result when isStillCurrentUser returns false (stale race)', async () => {
      const station = mockStation({ stationuuid: 'uuid-stale' });
      mockGetDocs.mockResolvedValue({ docs: [{ data: () => station }] });
      await service.loadFromFirestore('uid-1', () => false);
      expect(prefs.favoriteStations()).not.toContainEqual(station);
    });

    it('merges local-only favorites with Firestore data', async () => {
      const remote = mockStation({ stationuuid: 'uuid-remote-merge' });
      const local = mockStation({ stationuuid: 'uuid-local-merge' });

      let resolveGetDocs!: (v: unknown) => void;
      mockGetDocs.mockReturnValue(new Promise((res) => (resolveGetDocs = res)));

      const loadPromise = service.loadFromFirestore('uid-1', () => true);
      prefs.addFavoriteStation(local);
      resolveGetDocs({ docs: [{ data: () => remote }] });
      await loadPromise;

      expect(prefs.favoriteStations()).toContainEqual(remote);
      expect(prefs.favoriteStations()).toContainEqual(local);
    });

    it('does not duplicate stations present in both Firestore and local', async () => {
      const shared = mockStation({ stationuuid: 'uuid-shared' });
      prefs.addFavoriteStation(shared);
      mockGetDocs.mockResolvedValue({ docs: [{ data: () => shared }] });
      await service.loadFromFirestore('uid-1', () => true);
      expect(prefs.favoriteStations().filter((s) => s.stationuuid === 'uuid-shared')).toHaveLength(1);
    });
  });
});
