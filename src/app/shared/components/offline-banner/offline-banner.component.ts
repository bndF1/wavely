import { Component, computed, effect, inject, signal } from '@angular/core';

import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, warningOutline } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { NetworkService } from '../../../core/services/network.service';

@Component({
  selector: 'wavely-offline-banner',
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss'],
  imports: [IonIcon, IonButton, TranslatePipe],
})
export class OfflineBannerComponent {
  private readonly network = inject(NetworkService);
  private readonly dismissed = signal(false);

  protected readonly isVisible = computed(() => !this.network.isOnline() && !this.dismissed());

  constructor() {
    addIcons({ warningOutline, closeOutline });

    effect(() => {
      if (this.network.isOnline()) {
        this.dismissed.set(false);
      }
    });
  }

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
