import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LayoutStore } from './layout.store';

describe('LayoutStore', () => {
  let store: InstanceType<typeof LayoutStore>;

  function createStore(platformId = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        LayoutStore,
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });
    return TestBed.inject(LayoutStore);
  }

  beforeEach(() => {
    localStorage.clear();
    store = createStore();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('initial state', () => {
    it('has sidebarCollapsed false by default', () => {
      expect(store.sidebarCollapsed()).toBe(false);
    });

    it('has queueFocused false by default', () => {
      expect(store.queueFocused()).toBe(false);
    });

    it('sidebarWidth computed returns expanded width', () => {
      expect(store.sidebarWidth()).toBe('var(--sidebar-width)');
    });
  });

  describe('toggleSidebar()', () => {
    it('flips sidebarCollapsed to true', () => {
      store.toggleSidebar();
      expect(store.sidebarCollapsed()).toBe(true);
    });

    it('flips sidebarCollapsed back to false on second call', () => {
      store.toggleSidebar();
      store.toggleSidebar();
      expect(store.sidebarCollapsed()).toBe(false);
    });

    it('writes collapsed state to localStorage', () => {
      store.toggleSidebar();
      expect(localStorage.getItem('wavely-sidebar-collapsed')).toBe('true');
    });

    it('writes expanded state to localStorage after second toggle', () => {
      store.toggleSidebar();
      store.toggleSidebar();
      expect(localStorage.getItem('wavely-sidebar-collapsed')).toBe('false');
    });

    it('updates sidebarWidth computed to collapsed width', () => {
      store.toggleSidebar();
      expect(store.sidebarWidth()).toBe('var(--sidebar-collapsed-width)');
    });

    it('still toggles state when localStorage throws', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      store.toggleSidebar();
      expect(store.sidebarCollapsed()).toBe(true);
      jest.restoreAllMocks();
    });
  });

  describe('initFromStorage()', () => {
    it('sets sidebarCollapsed to true when localStorage has "true"', () => {
      localStorage.setItem('wavely-sidebar-collapsed', 'true');
      store.initFromStorage();
      expect(store.sidebarCollapsed()).toBe(true);
    });

    it('leaves sidebarCollapsed false when localStorage has "false"', () => {
      localStorage.setItem('wavely-sidebar-collapsed', 'false');
      store.initFromStorage();
      expect(store.sidebarCollapsed()).toBe(false);
    });

    it('leaves sidebarCollapsed false when localStorage key is absent', () => {
      store.initFromStorage();
      expect(store.sidebarCollapsed()).toBe(false);
    });

    it('does not throw when localStorage throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      expect(() => store.initFromStorage()).not.toThrow();
      jest.restoreAllMocks();
    });
  });

  describe('initFromStorage() on server platform', () => {
    it('is a no-op on server platform (does not access localStorage)', () => {
      TestBed.resetTestingModule();
      const serverStore = createStore('server');
      const spy = jest.spyOn(Storage.prototype, 'getItem');
      serverStore.initFromStorage();
      expect(spy).not.toHaveBeenCalled();
      expect(serverStore.sidebarCollapsed()).toBe(false);
      jest.restoreAllMocks();
    });
  });

  describe('toggleQueue()', () => {
    it('flips queueFocused to true', () => {
      store.toggleQueue();
      expect(store.queueFocused()).toBe(true);
    });

    it('flips queueFocused back to false on second call', () => {
      store.toggleQueue();
      store.toggleQueue();
      expect(store.queueFocused()).toBe(false);
    });
  });
});
