import { Component, effect, inject } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { AuthStore } from '../../store/auth/auth.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonSpinner],
  template: `
    <ion-content class="login-content">
      <div class="login-container">
        <div class="logo-section">
          <img src="icons/icon-192x192.png" alt="Wavely" class="app-logo" />
          <h1 class="app-name">Wavely</h1>
          <span class="early-access-badge">Early Access</span>
          <p class="app-tagline">Your podcasts, beautifully organized</p>
        </div>
        <div class="auth-section">
          @if (authStore.loading()) {
            <ion-spinner name="crescent" />
          } @else {
            <ion-button expand="block" class="google-btn" (click)="signIn()">
              <ion-icon name="logo-google" slot="start" />
              Continue with Google
            </ion-button>
          }
          @if (authStore.error()) {
            <p class="error-text">{{ authStore.error() }}</p>
          }
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./login.page.scss'],
  styles: [
    `
      .login-content {
        --background: var(--ion-background-color);
      }
      .login-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 2rem;
        gap: 3rem;
      }
      .logo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }
      .app-logo {
        width: 80px;
        height: 80px;
        border-radius: 20px;
      }
      .app-name {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
      }
      .early-access-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
      }
      .app-tagline {
        color: var(--ion-color-medium);
        text-align: center;
        margin: 0;
      }
      .auth-section {
        width: 100%;
        max-width: 320px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .google-btn {
        --border-radius: 12px;
        width: 100%;
      }
      .error-text {
        color: var(--ion-color-danger);
        font-size: 0.875rem;
        text-align: center;
      }
    `,
  ],
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  private router = inject(Router);

  constructor() {
    addIcons({ logoGoogle });
    // Navigate reactively when auth state resolves — signInWithPopup updates
    // user$ asynchronously, so checking isAuthenticated() right after await
    // always returns false. The effect fires when the signal actually changes.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/tabs/home']);
      }
    });
  }

  async signIn(): Promise<void> {
    await this.authStore.signInWithGoogle();
  }
}
