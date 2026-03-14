import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, signInWithCustomToken, user } from '@angular/fire/auth';
import { IonContent } from '@ionic/angular/standalone';
import { filter, firstValueFrom, timeout } from 'rxjs';

/**
 * E2E-only route: /e2e-auth/:token
 * Signs in with a Firebase custom token (minted by the Playwright global setup
 * via firebase-admin connected to the Auth Emulator), then redirects to /tabs/home.
 *
 * This component is tree-shaken from production builds because the route is only
 * registered when environment.useEmulators === true.
 */
@Component({
  selector: 'wavely-e2e-auth',
  standalone: true,
  imports: [IonContent],
  template: `<ion-content class="ion-padding"><p>Authenticating for E2E…</p></ion-content>`,
})
export class E2eAuthComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    console.log('[E2eAuth] starting sign-in, emulator:', this.auth.emulatorConfig);

    try {
      await signInWithCustomToken(this.auth, token);
      console.log('[E2eAuth] signInWithCustomToken OK, uid:', this.auth.currentUser?.uid);
    } catch (err) {
      console.error('[E2eAuth] signInWithCustomToken FAILED:', err);
      return;
    }

    try {
      // Wait for AngularFire's auth observable to emit the signed-in user.
      // 10s timeout prevents hanging if the auth state never propagates.
      await firstValueFrom(
        user(this.auth).pipe(
          filter((u) => u !== null),
          timeout(10_000),
        ),
      );
      console.log('[E2eAuth] auth state confirmed, navigating');
    } catch {
      // Timeout — try navigating anyway if currentUser is set
      console.warn('[E2eAuth] auth state timeout, currentUser:', this.auth.currentUser?.uid);
      if (!this.auth.currentUser) return;
    }

    await this.router.navigate(['/tabs/home']);
  }
}
