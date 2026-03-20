jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { PlayerModalService } from './player-modal.service';

describe('PlayerModalService', () => {
  let service: PlayerModalService;

  const mockModal = {
    present: jest.fn().mockResolvedValue(undefined),
    classList: { contains: jest.fn(() => false) },
  };
  const mockModalCtrl = {
    create: jest.fn().mockResolvedValue(mockModal),
    getTop: jest.fn().mockResolvedValue(null),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });

    TestBed.configureTestingModule({
      providers: [
        PlayerModalService,
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(PlayerModalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates', () => expect(service).toBeTruthy());

  it('creates and presents modal', async () => {
    await service.open();
    expect(mockModalCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({ cssClass: 'full-player-modal', showBackdrop: false }),
    );
    expect(mockModal.present).toHaveBeenCalled();
  });

  it('does not open when one is already open', async () => {
    const existing = { classList: { contains: jest.fn(() => true) } };
    mockModalCtrl.getTop.mockResolvedValueOnce(existing);
    await service.open();
    expect(mockModalCtrl.create).not.toHaveBeenCalled();
  });

  it('prevents concurrent opens', async () => {
    await Promise.all([service.open(), service.open()]);
    expect(mockModalCtrl.create).toHaveBeenCalledTimes(1);
  });

  describe('on desktop (>=1024px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    });

    it('does not open modal on desktop', async () => {
      await service.open();
      expect(mockModalCtrl.create).not.toHaveBeenCalled();
    });

    it('isDesktop returns true', () => {
      expect(service.isDesktop).toBe(true);
    });
  });
});
