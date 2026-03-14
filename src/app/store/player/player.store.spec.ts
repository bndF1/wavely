import { TestBed } from '@angular/core/testing';
import { PlayerStore } from './player.store';
import { mockEpisode } from '../../../testing/podcast-fixtures';

describe('PlayerStore', () => {
  let store: InstanceType<typeof PlayerStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlayerStore] });
    store = TestBed.inject(PlayerStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('initial state', () => {
    it('has correct defaults', () => {
      expect(store.currentEpisode()).toBeNull();
      expect(store.isPlaying()).toBe(false);
      expect(store.currentTime()).toBe(0);
      expect(store.duration()).toBe(0);
      expect(store.playbackRate()).toBe(1);
      expect(store.queue()).toEqual([]);
      expect(store.isMinimised()).toBe(true);
    });
  });

  describe('play()', () => {
    it('sets currentEpisode and starts playing', () => {
      const episode = mockEpisode();
      store.play(episode);
      expect(store.currentEpisode()).toEqual(episode);
      expect(store.isPlaying()).toBe(true);
      expect(store.currentTime()).toBe(0);
    });

    it('resets currentTime when starting a new episode', () => {
      const ep1 = mockEpisode();
      store.play(ep1);
      store.seek(60);
      const ep2 = mockEpisode();
      store.play(ep2);
      expect(store.currentTime()).toBe(0);
    });
  });

  describe('pause() / resume()', () => {
    it('pause() sets isPlaying to false', () => {
      store.play(mockEpisode());
      store.pause();
      expect(store.isPlaying()).toBe(false);
    });

    it('resume() sets isPlaying to true', () => {
      store.play(mockEpisode());
      store.pause();
      store.resume();
      expect(store.isPlaying()).toBe(true);
    });
  });

  describe('seek()', () => {
    it('updates currentTime to the given value', () => {
      store.play(mockEpisode());
      store.seek(45);
      expect(store.currentTime()).toBe(45);
    });
  });

  describe('setDuration()', () => {
    it('updates duration', () => {
      store.setDuration(3600);
      expect(store.duration()).toBe(3600);
    });
  });

  describe('setPlaybackRate()', () => {
    it('updates playbackRate', () => {
      store.setPlaybackRate(1.5);
      expect(store.playbackRate()).toBe(1.5);
    });
  });

  describe('updateProgress()', () => {
    it('updates both currentTime and duration', () => {
      store.updateProgress(30, 120);
      expect(store.currentTime()).toBe(30);
      expect(store.duration()).toBe(120);
    });
  });

  describe('skipBack()', () => {
    it('subtracts 15 seconds by default', () => {
      store.play(mockEpisode());
      store.updateProgress(60, 3600);
      store.skipBack();
      expect(store.currentTime()).toBe(45);
    });

    it('clamps to 0 if skipping before start', () => {
      store.play(mockEpisode());
      store.updateProgress(5, 3600);
      store.skipBack(30);
      expect(store.currentTime()).toBe(0);
    });

    it('accepts custom seconds', () => {
      store.play(mockEpisode());
      store.updateProgress(100, 3600);
      store.skipBack(30);
      expect(store.currentTime()).toBe(70);
    });
  });

  describe('skipForward()', () => {
    it('adds 30 seconds by default', () => {
      store.play(mockEpisode());
      store.updateProgress(60, 3600);
      store.skipForward();
      expect(store.currentTime()).toBe(90);
    });

    it('clamps to duration if skipping past end', () => {
      store.play(mockEpisode());
      store.updateProgress(3590, 3600);
      store.skipForward(30);
      expect(store.currentTime()).toBe(3600);
    });

    it('accepts custom seconds', () => {
      store.play(mockEpisode());
      store.updateProgress(60, 3600);
      store.skipForward(10);
      expect(store.currentTime()).toBe(70);
    });
  });

  describe('addToQueue() / clearQueue()', () => {
    it('addToQueue appends an episode', () => {
      const ep = mockEpisode();
      store.addToQueue(ep);
      expect(store.queue()).toHaveLength(1);
      expect(store.queue()[0]).toEqual(ep);
    });

    it('addToQueue can append multiple episodes', () => {
      store.addToQueue(mockEpisode());
      store.addToQueue(mockEpisode());
      expect(store.queue()).toHaveLength(2);
    });

    it('clearQueue empties the queue', () => {
      store.addToQueue(mockEpisode());
      store.addToQueue(mockEpisode());
      store.clearQueue();
      expect(store.queue()).toEqual([]);
    });
  });


  describe('removeFromQueue()', () => {
    it('removes only the matching episode id', () => {
      const keep = mockEpisode({ id: 'keep-1' });
      const remove = mockEpisode({ id: 'remove-1' });
      store.addToQueue(keep);
      store.addToQueue(remove);

      store.removeFromQueue('remove-1');

      expect(store.queue()).toEqual([keep]);
    });

    it('keeps other queued episodes after removal', () => {
      const ep1 = mockEpisode({ id: 'ep-1' });
      const ep2 = mockEpisode({ id: 'ep-2' });
      const ep3 = mockEpisode({ id: 'ep-3' });
      store.addToQueue(ep1);
      store.addToQueue(ep2);
      store.addToQueue(ep3);

      store.removeFromQueue('ep-2');

      expect(store.queue()).toHaveLength(2);
      expect(store.queue()).toEqual([ep1, ep3]);
    });
  });

  describe('playNext()', () => {
    it('advances to the next episode in the queue', () => {
      const ep1 = mockEpisode();
      const ep2 = mockEpisode();
      store.play(ep1);
      store.addToQueue(ep2);
      store.playNext();
      expect(store.currentEpisode()).toEqual(ep2);
      expect(store.isPlaying()).toBe(true);
      expect(store.currentTime()).toBe(0);
      expect(store.queue()).toEqual([]);
    });

    it('stops playback when queue is empty', () => {
      store.play(mockEpisode());
      store.playNext();
      expect(store.isPlaying()).toBe(false);
      expect(store.currentTime()).toBe(0);
    });

    it('preserves remaining queue items after advance', () => {
      const episodes = [mockEpisode(), mockEpisode(), mockEpisode()];
      store.play(episodes[0]);
      store.addToQueue(episodes[1]);
      store.addToQueue(episodes[2]);
      store.playNext();
      expect(store.currentEpisode()).toEqual(episodes[1]);
      expect(store.queue()).toHaveLength(1);
      expect(store.queue()[0]).toEqual(episodes[2]);
    });
  });

  describe('toggleMinimise()', () => {
    it('toggles isMinimised from true to false', () => {
      expect(store.isMinimised()).toBe(true);
      store.toggleMinimise();
      expect(store.isMinimised()).toBe(false);
    });

    it('toggles isMinimised back to true', () => {
      store.toggleMinimise();
      store.toggleMinimise();
      expect(store.isMinimised()).toBe(true);
    });
  });

  describe('close()', () => {
    it('clears episode, stops playback, resets time and duration', () => {
      const episode = mockEpisode();
      store.play(episode);
      store.updateProgress(30, 120);
      store.close();
      expect(store.currentEpisode()).toBeNull();
      expect(store.isPlaying()).toBe(false);
      expect(store.currentTime()).toBe(0);
      expect(store.duration()).toBe(0);
    });
  });
});
