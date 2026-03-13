// Mock firebase/firestore before any imports that use it
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { ProgressSyncService } from './progress-sync.service';

describe('ProgressSyncService', () => {
  let service: ProgressSyncService;
  let mockSetDoc: jest.Mock;
  let mockGetDoc: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();

    // Grab the mocked functions from the mocked module
    const firestoreMock = jest.requireMock('firebase/firestore');
    mockSetDoc = firestoreMock.setDoc;
    mockGetDoc = firestoreMock.getDoc;
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false });

    TestBed.configureTestingModule({ providers: [ProgressSyncService] });
    service = TestBed.inject(ProgressSyncService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('scheduleWrite()', () => {
    it('is a no-op when uid is null', () => {
      service.scheduleWrite('ep1', 10, 100, null);
      jest.runAllTimers();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('is a no-op when position is below minimum (< 2s)', () => {
      service.scheduleWrite('ep1', 1, 100, 'uid-1');
      jest.runAllTimers();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('is a no-op when episodeId is empty', () => {
      service.scheduleWrite('', 10, 100, 'uid-1');
      jest.runAllTimers();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('writes immediately when called for the first time', async () => {
      service.scheduleWrite('ep1', 30, 3600, 'uid-1');
      // flush microtasks (setDoc is async but the flush call is sync here via fake timers)
      await Promise.resolve();
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('does NOT write a second time within the throttle window', async () => {
      service.scheduleWrite('ep1', 30, 3600, 'uid-1');
      await Promise.resolve();
      service.scheduleWrite('ep1', 35, 3600, 'uid-1');
      // Still within 5s window — should not have triggered another write
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('writes again after the 5-second throttle window elapses', async () => {
      service.scheduleWrite('ep1', 30, 3600, 'uid-1');
      await Promise.resolve();
      jest.advanceTimersByTime(5000);
      service.scheduleWrite('ep1', 60, 3600, 'uid-1');
      await Promise.resolve();
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('flush()', () => {
    it('is a no-op when there is no pending write', async () => {
      await service.flush();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('immediately writes pending data and clears it', async () => {
      // Schedule something inside the throttle window so it is pending
      service.scheduleWrite('ep1', 30, 3600, 'uid-1');
      await Promise.resolve(); // first write (immediate)
      service.scheduleWrite('ep1', 35, 3600, 'uid-1'); // pending, within window
      await service.flush();
      // First call from scheduleWrite + second call from flush
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('markCompleted()', () => {
    it('is a no-op when uid is null', async () => {
      await service.markCompleted('ep1', 3600, null);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('writes completion data with completedAt timestamp', async () => {
      await service.markCompleted('ep1', 3600, 'uid-1');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const writeData = mockSetDoc.mock.calls[0][1];
      expect(writeData).toMatchObject({
        episodeId: 'ep1',
        position: 3600,
        duration: 3600,
      });
      expect(writeData.completedAt).toBeGreaterThan(0);
    });
  });

  describe('loadProgress()', () => {
    it('returns 0 when uid is null', async () => {
      const result = await service.loadProgress('ep1', null);
      expect(result).toBe(0);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('returns 0 when episodeId is empty', async () => {
      const result = await service.loadProgress('', 'uid-1');
      expect(result).toBe(0);
    });

    it('returns 0 when no snapshot exists', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });
      const result = await service.loadProgress('ep1', 'uid-1');
      expect(result).toBe(0);
    });

    it('returns saved position from snapshot', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ episodeId: 'ep1', position: 120, duration: 3600, completedAt: null, updatedAt: Date.now() }),
      });
      const result = await service.loadProgress('ep1', 'uid-1');
      expect(result).toBe(120);
    });

    it('returns 0 for a completed episode (completedAt is set)', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ episodeId: 'ep1', position: 3590, duration: 3600, completedAt: Date.now(), updatedAt: Date.now() }),
      });
      const result = await service.loadProgress('ep1', 'uid-1');
      expect(result).toBe(0);
    });
  });
});
