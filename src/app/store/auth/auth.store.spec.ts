jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import type { User } from 'firebase/auth';

import { AuthStore } from './auth.store';
import { AuthService } from '../../core/auth/auth.service';
import { SubscriptionSyncService } from '../../core/services/subscription-sync.service';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let userSubject: BehaviorSubject<User | null>;

  const authServiceMock = {
    user$: new BehaviorSubject<User | null>(null),
    signInWithGoogle: jest.fn<() => Promise<void>>(),
    signOut: jest.fn<() => Promise<void>>(),
  };

  const syncServiceMock = {
    clearSubscriptions: jest.fn(),
    loadFromFirestore: jest.fn(),
  };

  const makeUser = (uid: string): User => ({
    uid,
    displayName: `User ${uid}`,
    email: `${uid}@wavely.test`,
    photoURL: `https://example.com/${uid}.png`,
  } as User);

  beforeEach(() => {
    userSubject = new BehaviorSubject<User | null>(null);
    authServiceMock.user$ = userSubject;
    authServiceMock.signInWithGoogle.mockResolvedValue();
    authServiceMock.signOut.mockResolvedValue();

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceMock },
        { provide: SubscriptionSyncService, useValue: syncServiceMock },
      ],
    });

    store = TestBed.inject(AuthStore);
    store.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('has expected initial state', () => {
    expect(store.user()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.displayName()).toBeNull();
    expect(store.photoURL()).toBeNull();
    expect(store.email()).toBeNull();
  });

  it('signInWithGoogle sets user via user$ subscription', async () => {
    const signedInUser = makeUser('uid-1');
    authServiceMock.signInWithGoogle.mockImplementation(async () => {
      userSubject.next(signedInUser);
    });

    await store.signInWithGoogle();

    expect(authServiceMock.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(store.user()).toEqual(signedInUser);
    expect(store.isAuthenticated()).toBe(true);
    expect(syncServiceMock.loadFromFirestore).toHaveBeenCalledWith('uid-1', expect.any(Function));
  });

  it('signOut clears user via user$ subscriber', async () => {
    userSubject.next(makeUser('uid-2'));
    authServiceMock.signOut.mockImplementation(async () => {
      userSubject.next(null);
    });

    await store.signOut();

    expect(authServiceMock.signOut).toHaveBeenCalledTimes(1);
    expect(store.user()).toBeNull();
    expect(syncServiceMock.clearSubscriptions).toHaveBeenCalled();
  });

  it('computed properties reflect current user values', () => {
    userSubject.next(makeUser('uid-3'));

    expect(store.displayName()).toBe('User uid-3');
    expect(store.photoURL()).toBe('https://example.com/uid-3.png');
    expect(store.email()).toBe('uid-3@wavely.test');
  });
});
