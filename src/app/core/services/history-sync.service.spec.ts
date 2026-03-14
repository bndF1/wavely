jest.mock('@angular/fire/firestore', () => ({
  Firestore: class MockFirestore {},
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(() => ({ id: 'mock-collection' })),
}));

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { HistorySyncService } from './history-sync.service';
import { HistoryStore, type HistoryEntry } from '../../store/history/history.store';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  episodeId: 'ep-1',
  episodeTitle: 'Episode 1',
  podcastTitle: 'Podcast 1',
  imageUrl: '/image.jpg',
  position: 30,
  duration: 120,
  lastPlayedAt: 1000,
  completed: false,
  ...overrides,
});

describe('HistorySyncService', () => {
  let service: HistorySyncService;
  let historyStore: InstanceType<typeof HistoryStore>;
  let mockSetDoc: jest.Mock;
  let mockGetDocs: jest.Mock;
  let mockDeleteDoc: jest.Mock;

  beforeEach(() => {
    const fm = jest.requireMock('@angular/fire/firestore');
    mockSetDoc = fm.setDoc;
    mockGetDocs = fm.getDocs;
    mockDeleteDoc = fm.deleteDoc;

    mockSetDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockDeleteDoc.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        HistorySyncService,
        HistoryStore,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(HistorySyncService);
    historyStore = TestBed.inject(HistoryStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // recordPlay()
  // ──────────────────────────────────────────────────────────────────────────
  describe('recordPlay()', () => {
    it('writes to Firestore and updates store on success', async () => {
      const entry = makeEntry({ lastPlayedAt: 5000 });
      await service.recordPlay(entry, 'uid-1');

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(historyStore.entries()).toContainEqual(entry);
    });

    it('uses provided lastPlayedAt when set', async () => {
      const entry = makeEntry({ lastPlayedAt: 9999 });
      await service.recordPlay(entry, 'uid-1');

      const [, data] = mockSetDoc.mock.calls[0];
      expect(data.lastPlayedAt).toBe(9999);
    });

    it('falls back to Date.now() when lastPlayedAt is null/undefined', async () => {
      const before = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = makeEntry({ lastPlayedAt: undefined as any });
      await service.recordPlay(entry, 'uid-1');
      const after = Date.now();

      const [, data] = mockSetDoc.mock.calls[0];
      expect(data.lastPlayedAt).toBeGreaterThanOrEqual(before);
      expect(data.lastPlayedAt).toBeLessThanOrEqual(after);
    });

    it('does nothing when uid is empty', async () => {
      await service.recordPlay(makeEntry(), '');
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(historyStore.entries()).toEqual([]);
    });

    it('does nothing when episodeId is empty', async () => {
      await service.recordPlay(makeEntry({ episodeId: '' }), 'uid-1');
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('swallows Firestore errors silently', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore unavailable'));
      await expect(service.recordPlay(makeEntry(), 'uid-1')).resolves.toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // loadHistory()
  // ──────────────────────────────────────────────────────────────────────────
  describe('loadHistory()', () => {
    it('returns empty array when uid is empty', async () => {
      const result = await service.loadHistory('');
      expect(result).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('returns empty array when Firestore has no documents', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      const result = await service.loadHistory('uid-1');
      expect(result).toEqual([]);
    });

    it('maps Firestore documents to HistoryEntry with all fields present', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              episodeId: 'ep-1',
              episodeTitle: 'Episode 1',
              podcastTitle: 'Podcast 1',
              imageUrl: '/image.jpg',
              position: 60,
              duration: 300,
              lastPlayedAt: 2000,
              completed: true,
            }),
          },
        ],
      });

      const result = await service.loadHistory('uid-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        episodeId: 'ep-1',
        episodeTitle: 'Episode 1',
        podcastTitle: 'Podcast 1',
        imageUrl: '/image.jpg',
        position: 60,
        duration: 300,
        lastPlayedAt: 2000,
        completed: true,
      });
    });

    it('fills missing optional fields with defaults (all ?? fallbacks)', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => ({ episodeId: 'ep-2' }) }, // only required field present
        ],
      });

      const result = await service.loadHistory('uid-1');
      expect(result[0]).toMatchObject({
        episodeId: 'ep-2',
        episodeTitle: 'Untitled episode',
        podcastTitle: 'Unknown podcast',
        imageUrl: '/default-artwork.svg',
        position: 0,
        duration: 0,
        lastPlayedAt: 0,
        completed: false,
      });
    });

    it('filters out entries with empty episodeId', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => ({}) },                          // no episodeId → filtered
          { data: () => ({ episodeId: 'ep-keep' }) },   // kept
        ],
      });

      const result = await service.loadHistory('uid-1');
      expect(result).toHaveLength(1);
      expect(result[0].episodeId).toBe('ep-keep');
    });

    it('sorts results by lastPlayedAt descending', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => ({ episodeId: 'ep-old', lastPlayedAt: 10 }) },
          { data: () => ({ episodeId: 'ep-new', lastPlayedAt: 99 }) },
        ],
      });

      const result = await service.loadHistory('uid-1');
      expect(result[0].episodeId).toBe('ep-new');
      expect(result[1].episodeId).toBe('ep-old');
    });

    it('returns empty array on Firestore error', async () => {
      mockGetDocs.mockRejectedValue(new Error('permission-denied'));
      const result = await service.loadHistory('uid-1');
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // clearHistory()
  // ──────────────────────────────────────────────────────────────────────────
  describe('clearHistory()', () => {
    it('clears the store immediately when uid is empty (offline/guest)', async () => {
      historyStore.addOrUpdate(makeEntry());
      await service.clearHistory('');

      expect(historyStore.entries()).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('deletes all Firestore docs and clears store when uid is provided', async () => {
      const docRef1 = { ref: { id: 'doc-1' } };
      const docRef2 = { ref: { id: 'doc-2' } };
      mockGetDocs.mockResolvedValue({ docs: [docRef1, docRef2] });

      historyStore.addOrUpdate(makeEntry());
      await service.clearHistory('uid-1');

      expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
      expect(historyStore.entries()).toEqual([]);
    });

    it('still clears store on Firestore error', async () => {
      mockGetDocs.mockRejectedValue(new Error('unavailable'));
      historyStore.addOrUpdate(makeEntry());

      await service.clearHistory('uid-1');

      expect(historyStore.entries()).toEqual([]);
    });
  });
});
