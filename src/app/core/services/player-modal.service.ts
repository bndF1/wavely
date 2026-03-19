import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class PlayerModalService {
  private readonly modalCtrl = inject(ModalController);
  private readonly platformId = inject(PLATFORM_ID);
  private isOpening = false;

  get isDesktop(): boolean {
    return isPlatformBrowser(this.platformId) && window.innerWidth >= 1024;
  }

  async open(): Promise<void> {
    if (this.isDesktop) return;
    if (this.isOpening) return;
    this.isOpening = true;
    try {
      const existing = await this.modalCtrl.getTop();
      if (existing?.classList.contains('full-player-modal')) return;

      const { FullPlayerComponent } = await import(
        '../../features/player/full-player/full-player.component'
      );
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
