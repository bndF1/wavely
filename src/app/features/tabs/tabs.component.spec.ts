jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { TabsComponent } from './tabs.component';
import { PlayerStore } from '../../store/player/player.store';

describe('TabsComponent', () => {
  let fixture: ComponentFixture<TabsComponent>;
  let component: TabsComponent;

  const mockModal = { present: jest.fn().mockResolvedValue(undefined), classList: { contains: jest.fn(() => false) } };
  const mockModalCtrl = {
    create: jest.fn().mockResolvedValue(mockModal),
    getTop: jest.fn().mockResolvedValue(null),
  };

  const mockPlayerStore = {
    currentEpisode: jest.fn(() => null),
    isPlaying: jest.fn(() => false),
    currentTime: jest.fn(() => 0),
    duration: jest.fn(() => 0),
    playbackRate: jest.fn(() => 1),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsComponent],
      providers: [
        { provide: PlayerStore, useValue: mockPlayerStore },
        { provide: ModalController, useValue: mockModalCtrl },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TabsComponent, { set: { template: '<div></div>', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('opens full player modal when an episode is playing', async () => {
    mockPlayerStore.currentEpisode.mockReturnValue({ id: 'ep-123', title: 'Test' });
    await component.openFullPlayer();
    expect(mockModalCtrl.create).toHaveBeenCalledWith(expect.objectContaining({ cssClass: 'full-player-modal' }));
    expect(mockModal.present).toHaveBeenCalled();
  });

  it('does not open a second modal if one is already open', async () => {
    const existingModal = { classList: { contains: jest.fn(() => true) } };
    mockModalCtrl.getTop.mockResolvedValueOnce(existingModal);
    await component.openFullPlayer();
    expect(mockModalCtrl.create).not.toHaveBeenCalled();
  });

  it('does not open concurrent modals on rapid taps', async () => {
    // Both calls start before either awaits getTop — re-entrancy guard must block second
    const [, second] = await Promise.all([
      component.openFullPlayer(),
      component.openFullPlayer(),
    ]);
    expect(mockModalCtrl.create).toHaveBeenCalledTimes(1);
  });
});
