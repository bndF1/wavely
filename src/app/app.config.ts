import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { PreloadAllModules, Router, provideRouter, withPreloading } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getApp } from 'firebase/app';
import {
  ScreenTrackingService,
  getAnalytics,
  provideAnalytics,
} from '@angular/fire/analytics';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  provideAuth,
} from '@angular/fire/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { provideIonicAngular } from '@ionic/angular/standalone';
import * as Sentry from '@sentry/angular';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideRouter(appRoutes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      if (environment.useEmulators) {
        // Force localStorage persistence so Playwright's storageState can capture auth
        const auth = initializeAuth(getApp(), { persistence: [browserLocalPersistence] });
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        return auth;
      }
      return getAuth();
    }),
    provideFirestore(() => {
      const store = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(store, 'localhost', 8080);
      }
      return store;
    }),
    ...(!environment.useEmulators
      ? [provideAnalytics(() => getAnalytics()), ScreenTrackingService]
      : []),
    provideIonicAngular({
      mode: 'md',
      animated: true,
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Sentry — no-op when sentryDsn is empty (dev/e2e), active in production
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler({ showDialog: false }) },
    { provide: Sentry.TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
