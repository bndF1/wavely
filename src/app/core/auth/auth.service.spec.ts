jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Auth, signInWithPopup, signOut, user } from '@angular/fire/auth';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockAuth = { currentUser: { uid: 'current-uid' } };

  beforeEach(() => {
    (user as jest.Mock).mockReturnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('exposes user$ from AngularFire user(auth)', (done) => {
    const emittedUser = { uid: 'user-1' };
    (user as jest.Mock).mockReturnValueOnce(of(emittedUser));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Auth, useValue: mockAuth }],
    });
    service = TestBed.inject(AuthService);

    service.user$.subscribe((value) => {
      expect(value).toEqual(emittedUser);
      done();
    });
  });

  it('delegates signInWithGoogle to signInWithPopup', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValue(undefined);

    await service.signInWithGoogle();

    expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(Object));
  });

  it('delegates signOut to AngularFire signOut', async () => {
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await service.signOut();

    expect(signOut).toHaveBeenCalledWith(mockAuth);
  });

  it('returns current user via getCurrentUser', () => {
    expect(service.getCurrentUser()).toEqual({ uid: 'current-uid' });
  });
});
