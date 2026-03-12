import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'wavely-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonButton, IonIcon, IonText, IonSpinner],
})
export class LoginPage {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ logoGoogle });

    // Navigate to library once auth state reflects a signed-in user.
    // We use an effect rather than checking immediately after signIn()
    // to avoid a race where the Firebase auth state hasn't propagated yet.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/tabs/library']);
      }
    });
  }

  protected async signIn(): Promise<void> {
    await this.authStore.signInWithGoogle();
  }
}
