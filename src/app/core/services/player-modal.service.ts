import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { FullPlayerComponent } from '../../features/player/full-player/full-player.component';

@Injectable({ providedIn: 'root' })
export class PlayerModalService {
  private readonly modalCtrl = inject(ModalController);
  private isOpening = false;

  async open(): Promise<void> {
    if (this.isOpening) return;
    this.isOpening = true;
    try {
      const existing = await this.modalCtrl.getTop();
      if (existing?.classList.contains('full-player-modal')) return;

      const modal = await this.modalCtrl.create({
        component: FullPlayerComponent,
        cssClass: 'full-player-modal',
        breakpoints: [0, 1],
        initialBreakpoint: 1,
        canDismiss: true,
        handle: false,
        showBackdrop: false,
      });
      await modal.present();
    } finally {
      this.isOpening = false;
    }
  }
}
