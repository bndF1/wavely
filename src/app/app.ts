import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AudioService } from './core/services/audio.service';

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
}
