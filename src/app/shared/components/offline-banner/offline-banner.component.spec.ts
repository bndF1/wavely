import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { NetworkService } from '../../../core/services/network.service';
import {
  loadTranslations,
  provideTranslateTesting,
} from '../../../../testing/translate-testing.helper';
import { OfflineBannerComponent } from './offline-banner.component';

describe('OfflineBannerComponent', () => {
  let fixture: ComponentFixture<OfflineBannerComponent>;
  const isOnline = signal(true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        { provide: NetworkService, useValue: { isOnline } },
        ...provideTranslateTesting(),
      ],
    }).compileComponents();

    loadTranslations(TestBed.inject(TranslateService));
    fixture = TestBed.createComponent(OfflineBannerComponent);
  });

  afterEach(() => {
    isOnline.set(true);
    TestBed.resetTestingModule();
  });

  it('shows banner when offline', () => {
    isOnline.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You are offline');
  });

  it('hides banner when dismissed and re-shows after reconnect cycle', () => {
    isOnline.set(false);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('ion-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('You are offline');

    isOnline.set(true);
    fixture.detectChanges();

    isOnline.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('You are offline');
  });
});
