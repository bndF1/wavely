import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { PlayerStore } from '../../store/player/player.store';
import { LayoutStore } from '../../store/layout/layout.store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dispatch a keydown event to document.body (mirrors browser behaviour when
 *  no element has focus — the event target is always an Element, not Document). */
function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  document.body.dispatchEvent(event);
  return event;
}

function fireKeyOnElement(element: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  element.dispatchEvent(event);
  return event;
}

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

function makeMockPlayerStore(overrides: Partial<{
  isPlaying: boolean;
  currentEpisode: unknown;
}> = {}) {
  return {
    isPlaying: jest.fn().mockReturnValue(overrides.isPlaying ?? false),
    currentEpisode: jest.fn().mockReturnValue(overrides.currentEpisode ?? null),
    pause: jest.fn(),
    resume: jest.fn(),
    skipBack: jest.fn(),
    skipForward: jest.fn(),
  };
}

function makeMockLayoutStore() {
  return {
    toggleSidebar: jest.fn(),
    toggleQueue: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

function createService(
  playerStoreOverride = makeMockPlayerStore(),
  layoutStoreOverride = makeMockLayoutStore(),
): {
  service: KeyboardShortcutsService;
  playerStore: ReturnType<typeof makeMockPlayerStore>;
  layoutStore: ReturnType<typeof makeMockLayoutStore>;
} {
  TestBed.configureTestingModule({
    providers: [
      KeyboardShortcutsService,
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: PlayerStore, useValue: playerStoreOverride },
      { provide: LayoutStore, useValue: layoutStoreOverride },
    ],
  });
  const service = TestBed.inject(KeyboardShortcutsService);
  return { service, playerStore: playerStoreOverride, layoutStore: layoutStoreOverride };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KeyboardShortcutsService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // Instantiation
  // -------------------------------------------------------------------------

  it('creates without error on browser platform', () => {
    const { service } = createService();
    expect(service).toBeTruthy();
  });

  it('does not register listener on non-browser platform', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutsService,
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: PlayerStore, useValue: makeMockPlayerStore() },
        { provide: LayoutStore, useValue: makeMockLayoutStore() },
      ],
    });
    TestBed.inject(KeyboardShortcutsService);
    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    addSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Space — play/pause toggle
  // -------------------------------------------------------------------------

  it('Space calls pause() when isPlaying is true', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey(' ');
    expect(playerStore.pause).toHaveBeenCalledTimes(1);
    expect(playerStore.resume).not.toHaveBeenCalled();
  });

  it('Space calls resume() when isPlaying is false', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: false, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey(' ');
    expect(playerStore.resume).toHaveBeenCalledTimes(1);
    expect(playerStore.pause).not.toHaveBeenCalled();
  });

  it('Space does nothing when no currentEpisode', () => {
    const playerStore = makeMockPlayerStore({ currentEpisode: null });
    createService(playerStore);
    fireKey(' ');
    expect(playerStore.pause).not.toHaveBeenCalled();
    expect(playerStore.resume).not.toHaveBeenCalled();
  });

  it('Space calls event.preventDefault()', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    const preventSpy = jest.spyOn(event, 'preventDefault');
    document.body.dispatchEvent(event);
    expect(preventSpy).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // j / k — skip
  // -------------------------------------------------------------------------

  it('j calls skipBack(15) when episode is loaded', () => {
    const playerStore = makeMockPlayerStore({ currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey('j');
    expect(playerStore.skipBack).toHaveBeenCalledWith(15);
  });

  it('j does nothing when no currentEpisode', () => {
    const playerStore = makeMockPlayerStore({ currentEpisode: null });
    createService(playerStore);
    fireKey('j');
    expect(playerStore.skipBack).not.toHaveBeenCalled();
  });

  it('k calls skipForward(30) when episode is loaded', () => {
    const playerStore = makeMockPlayerStore({ currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey('k');
    expect(playerStore.skipForward).toHaveBeenCalledWith(30);
  });

  it('k does nothing when no currentEpisode', () => {
    const playerStore = makeMockPlayerStore({ currentEpisode: null });
    createService(playerStore);
    fireKey('k');
    expect(playerStore.skipForward).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // [ — sidebar toggle
  // -------------------------------------------------------------------------

  it('[ calls layoutStore.toggleSidebar()', () => {
    const layoutStore = makeMockLayoutStore();
    createService(makeMockPlayerStore(), layoutStore);
    fireKey('[');
    expect(layoutStore.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Input guard — focus inside a form element
  // -------------------------------------------------------------------------

  it('Space does nothing when focus is inside an <input>', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKeyOnElement(input, ' ');
    document.body.removeChild(input);

    expect(playerStore.pause).not.toHaveBeenCalled();
    expect(playerStore.resume).not.toHaveBeenCalled();
  });

  it('Space does nothing when focus is inside a <textarea>', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireKeyOnElement(textarea, ' ');
    document.body.removeChild(textarea);

    expect(playerStore.pause).not.toHaveBeenCalled();
  });

  it('Space does nothing when focus is inside a contenteditable element', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);

    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);
    fireKeyOnElement(div, ' ');
    document.body.removeChild(div);

    expect(playerStore.pause).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Modifier key guard
  // -------------------------------------------------------------------------

  it('Space does nothing when ctrlKey is true', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey(' ', { ctrlKey: true });
    expect(playerStore.pause).not.toHaveBeenCalled();
    expect(playerStore.resume).not.toHaveBeenCalled();
  });

  it('Space does nothing when metaKey is true', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey(' ', { metaKey: true });
    expect(playerStore.pause).not.toHaveBeenCalled();
  });

  it('Space does nothing when altKey is true', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    createService(playerStore);
    fireKey(' ', { altKey: true });
    expect(playerStore.pause).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // ngOnDestroy — listener cleanup
  // -------------------------------------------------------------------------

  it('ngOnDestroy removes the keydown event listener', () => {
    const playerStore = makeMockPlayerStore({ isPlaying: true, currentEpisode: { id: 'ep-1' } });
    const { service } = createService(playerStore);

    service.ngOnDestroy();

    fireKey(' ');
    expect(playerStore.pause).not.toHaveBeenCalled();
    expect(playerStore.resume).not.toHaveBeenCalled();
  });
});
