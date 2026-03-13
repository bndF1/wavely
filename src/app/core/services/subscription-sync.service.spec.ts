// Mock @angular/fire/firestore before any imports that use it
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
import { SubscriptionSyncService } from './subscription-sync.service';
import { PodcastsStore } from '../../store/podcasts/podcasts.store';
import { mockPodcast } from '../../../testing/podcast-fixtures';

describe('SubscriptionSyncService', () => {
  let service: SubscriptionSyncService;
  let store: InstanceType<typeof PodcastsStore>;
  let mockSetDoc: jest.Mock;
  let mockDeleteDoc: jest.Mock;
  let mockGetDocs: jest.Mock;

  beforeEach(() => {
    const firestoreMock = jest.requireMock('@angular/fire/firestore');
    mockSetDoc = firestoreMock.setDoc;
    mockDeleteDoc = firestoreMock.deleteDoc;
    mockGetDocs = firestoreMock.getDocs;

    // Default happy-path Firestore responses
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ docs: [] });

    TestBed.configureTestingModule({
      providers: [
        SubscriptionSyncService,
        PodcastsStore,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(SubscriptionSyncService);
    store = TestBed.inject(PodcastsStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('addSubscription()', () => {
    it('adds podcast to store immediately (optimistic update)', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      await service.addSubscription(podcast, 'uid-1');
      expect(store.subscriptions()).toContainEqual(podcast);
    });

    it('writes to Firestore when uid is provided', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      await service.addSubscription(podcast, 'uid-1');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('does NOT write to Firestore when uid is null', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      await service.addSubscription(podcast, null);
      expect(store.subscriptions()).toContainEqual(podcast);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('rolls back store on Firestore failure', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore unavailable'));
      const podcast = mockPodcast({ id: 'pod-rollback' });
      await service.addSubscription(podcast, 'uid-1');
      expect(store.subscriptions()).not.toContainEqual(podcast);
    });
  });

  describe('removeSubscription()', () => {
    it('removes podcast from store immediately (optimistic update)', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      store.addSubscription(podcast);
      await service.removeSubscription('pod-1', 'uid-1');
      expect(store.subscriptions()).not.toContainEqual(podcast);
    });

    it('deletes from Firestore when uid is provided', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      store.addSubscription(podcast);
      await service.removeSubscription('pod-1', 'uid-1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('does NOT delete from Firestore when uid is null', async () => {
      const podcast = mockPodcast({ id: 'pod-1' });
      store.addSubscription(podcast);
      await service.removeSubscription('pod-1', null);
      expect(store.subscriptions()).not.toContainEqual(podcast);
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('rolls back store on Firestore failure', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Firestore unavailable'));
      const podcast = mockPodcast({ id: 'pod-rollback' });
      store.addSubscription(podcast);
      await service.removeSubscription('pod-rollback', 'uid-1');
      // Podcast should be restored since Firestore failed
      expect(store.subscriptions()).toContainEqual(podcast);
    });
  });

  describe('clearSubscriptions()', () => {
    it('empties the in-memory subscriptions list', () => {
      store.addSubscription(mockPodcast());
      store.addSubscription(mockPodcast());
      service.clearSubscriptions();
      expect(store.subscriptions()).toEqual([]);
    });
  });

  describe('loadFromFirestore()', () => {
    it('replaces store subscriptions with Firestore data', async () => {
      const podcast = mockPodcast({ id: 'firestore-pod' });
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => podcast }],
      });
      await service.loadFromFirestore('uid-1', () => true);
      expect(store.subscriptions()).toContainEqual(podcast);
    });

    it('discards result when isStillCurrentUser returns false (stale race)', async () => {
      const podcast = mockPodcast({ id: 'stale-pod' });
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => podcast }],
      });
      // Simulate user switching mid-flight
      await service.loadFromFirestore('uid-1', () => false);
      expect(store.subscriptions()).not.toContainEqual(podcast);
    });
  });
});
