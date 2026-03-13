import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, signInWithCustomToken } from '@angular/fire/auth';
import { IonContent } from '@ionic/angular/standalone';

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
    await signInWithCustomToken(this.auth, token);
    await this.router.navigate(['/tabs/home']);
  }
}
