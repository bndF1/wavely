import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
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

  constructor() {
    this.authStore.init();

    if (environment.useEmulators) {
      // Expose SPA navigation helper for E2E tests. This allows Playwright to
      // navigate via Angular Router without triggering a full page reload,
      // preserving in-memory store state (PlayerStore, PodcastsStore).
      (window as any)['__e2eNavigate'] = (url: string) =>
        this.router.navigate([url]);

      // Signal to E2E tests when auth state has been fully resolved.
      // AuthStore.init() subscribes to user$ first, so by the time this
      // callback fires, clearSubscriptions() + loadFromFirestore() kick-off
      // have already executed. Without this guard, tests that click Subscribe
      // before auth restores hit a race: the subscription is added locally,
      // then clearSubscriptions() wipes it when auth resolves.
      inject(AuthService).user$.pipe(
        filter((u) => u !== null),
        take(1),
      ).subscribe(() => {
        (window as any)['__e2eAuthReady'] = true;
      });
    }
  }
}
