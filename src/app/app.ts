import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';
import { filter, take } from 'rxjs';
import { AudioService } from './core/services/audio.service';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './store/auth/auth.store';
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
        try {
          await getDocs(collection(firestore, 'users', user!.uid, 'subscriptions'));
        } catch { /* just needed to wait for Firestore auth propagation */ }
        (window as any)['__e2eAuthReady'] = true;
      });
    }
  }
}
