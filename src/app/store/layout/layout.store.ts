import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

interface LayoutState {
  sidebarCollapsed: boolean;
  queueFocused: boolean;
}

const initialState: LayoutState = {
  sidebarCollapsed: false,
  queueFocused: false,
};

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ sidebarCollapsed }) => ({
    sidebarWidth: computed(() =>
      sidebarCollapsed() ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    ),
  })),
  withMethods((store) => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    return {
      initFromStorage(): void {
        if (!isBrowser) return;
        try {
          const saved = localStorage.getItem('wavely-sidebar-collapsed');
          if (saved === 'true') patchState(store, { sidebarCollapsed: true });
        } catch {
          // localStorage unavailable (strict privacy mode / security policy) — use default state
        }
      },
      toggleSidebar(): void {
        const next = !store.sidebarCollapsed();
        patchState(store, { sidebarCollapsed: next });
        if (isBrowser) {
          try {
            localStorage.setItem('wavely-sidebar-collapsed', String(next));
          } catch {
            // localStorage unavailable — state still toggled in memory
          }
        }
      },
      toggleQueue(): void {
        patchState(store, { queueFocused: !store.queueFocused() });
      },
    };
  })
);
