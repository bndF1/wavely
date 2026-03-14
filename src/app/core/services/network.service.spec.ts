import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let mockOnline = true;

  beforeAll(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => mockOnline,
    });
  });

  afterEach(() => {
    mockOnline = true;
    TestBed.resetTestingModule();
  });

  it('keeps default online state on server platform', () => {
    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(NetworkService);

    expect(service.isOnline()).toBe(true);
  });

  it('reads browser online status and updates from window events', () => {
    mockOnline = false;

    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const service = TestBed.inject(NetworkService);
    expect(service.isOnline()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);
  });
});
