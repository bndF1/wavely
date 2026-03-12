import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import type { Observable } from 'rxjs';
import type { User } from '@angular/fire/auth';

/**
 * AuthService
 *
 * Wraps AngularFire Auth to provide Google Sign-In for both web and native
 * Capacitor platforms.
 *
 * SSR-safe: auth operations are guarded by isPlatformBrowser.
 *
 * Native Google Sign-In requires @codetrix-studio/capacitor-google-auth:
 *   1. bun add @codetrix-studio/capacitor-google-auth
 *   2. Configure GoogleAuth.initialize() in app bootstrapping
 *   3. Uncomment the native sign-in implementation below
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly platformId = inject(PLATFORM_ID);

  /** Emits the current Firebase user (or null when signed out). */
  readonly user$: Observable<User | null> = user(this.auth);

  /**
   * Sign in with Google. Uses native Capacitor plugin on mobile devices and
   * signInWithPopup on web.
   */
  async signInWithGoogle(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (Capacitor.isNativePlatform()) {
      await this.signInNative();
    } else {
      await this.signInWeb();
    }
  }

  /** Sign the current user out of Firebase. */
  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async signInWeb(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  /**
   * Native Google Sign-In via @codetrix-studio/capacitor-google-auth.
   *
   * To enable:
   *   1. bun add @codetrix-studio/capacitor-google-auth
   *   2. Follow the plugin setup guide for iOS/Android
   *   3. Replace the placeholder body below with the real implementation
   */
  private async signInNative(): Promise<void> {
    // TODO: Install @codetrix-studio/capacitor-google-auth then replace this
    // stub with the real implementation:
    //
    //   import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
    //   const googleUser = await GoogleAuth.signIn();
    //   const credential = GoogleAuthProvider.credential(
    //     googleUser.authentication.idToken,
    //     googleUser.authentication.accessToken,
    //   );
    //   await signInWithCredential(this.auth, credential);
    //
    throw new Error(
      'Native Google Sign-In requires @codetrix-studio/capacitor-google-auth. ' +
        'Run: bun add @codetrix-studio/capacitor-google-auth',
    );
  }
}
