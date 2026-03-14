import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AudioService } from './core/services/audio.service';
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
    // Expose SPA navigation helper for E2E tests. This allows Playwright to
    // navigate via Angular Router without triggering a full page reload,
    // preserving in-memory store state (PlayerStore, PodcastsStore).
    if (environment.useEmulators) {
      (window as any)['__e2eNavigate'] = (url: string) =>
        this.router.navigate([url]);
    }
  }
}
