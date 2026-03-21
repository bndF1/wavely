import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { collection, deleteDoc, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { filter, take } from 'rxjs';
import { AudioService } from './core/services/audio.service';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './store/auth/auth.store';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { environment } from '../environments/environment';

@Component({
  imports: [IonApp, IonRouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'wavely';
  // Injecting AudioService here ensures it's instantiated at app start
  // so effects are registered before any playback is triggered.
  private readonly _audio = inject(AudioService);
  // Injecting ThemeService here ensures the saved theme is applied before
  // the first render, avoiding a flash of the wrong color scheme.
  private readonly _theme = inject(ThemeService);
  // Injecting LanguageService here ensures translate.use(lang) is called
  // at app startup so translations are loaded before any component renders.
  private readonly _lang = inject(LanguageService);
  // Injecting KeyboardShortcutsService here ensures the document keydown
  // listener is registered at app startup for desktop keyboard shortcuts.
  private readonly _keyboardShortcuts = inject(KeyboardShortcutsService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.authStore.init();

    if (environment.useEmulators && isPlatformBrowser(this.platformId)) {
      const authService = inject(AuthService);
      const firestore = inject(Firestore);

      // Expose SPA navigation helper for E2E tests. This allows Playwright to
      // navigate via Angular Router without triggering a full page reload,
      // preserving in-memory store state (PlayerStore, PodcastsStore).
      (window as any)['__e2eNavigate'] = (url: string) =>
        this.router.navigate([url]);

      // Signal to E2E tests when auth AND Firestore are fully ready.
      // After AuthStore processes auth state (clearSubscriptions + loadFromFirestore),
      // we verify Firestore has received the auth token by performing a test read.
      // Without this, clicking Subscribe before Firestore has the token causes
      // setDoc to fail with PERMISSION_DENIED, triggering a rollback.
      authService.user$.pipe(
        filter((u) => u !== null),
        take(1),
      ).subscribe(async (user) => {
        // Retry until Firestore auth token propagates for both READ and WRITE.
        // The probe validates both: a getDocs (read) and a test setDoc+deleteDoc
        // (write). Without the write probe, the first real setDoc (subscribe
        // action) can fail with PERMISSION_DENIED because the Firestore write
        // path (WebChannel) isn't ready yet even if reads succeed, triggering a
        // rollback that clears the in-memory store before the library renders.
        const probeDocRef = doc(
          firestore, 'users', user!.uid, 'subscriptions', '__e2e_probe',
        );
        const probeData = {
          id: '__e2e_probe',
          title: 'probe',
          author: '',
          description: '',
          artworkUrl: '',
          feedUrl: '',
          genres: [] as string[],
        };
        let attempts = 0;
        while (attempts < 10) {
          try {
            await getDocs(collection(firestore, 'users', user!.uid, 'subscriptions'));
            await setDoc(probeDocRef, probeData);
            await deleteDoc(probeDocRef);
            break;
          } catch {
            attempts++;
            await new Promise<void>((resolve) => setTimeout(resolve, 200));
          }
        }
        (window as any)['__e2eAuthReady'] = true;
      });
    }
  }
}
