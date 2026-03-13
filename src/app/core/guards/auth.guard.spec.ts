// Mock @angular/fire/auth before any imports that use it
jest.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  user: jest.fn(),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { authGuard } from './auth.guard';

// Import after mock is set up
import { Auth } from '@angular/fire/auth';

describe('authGuard', () => {
  let mockRouter: { createUrlTree: jest.Mock };

  function setupGuard(mockUser: object | null): void {
    const { user } = jest.requireMock('@angular/fire/auth');
    user.mockReturnValue(of(mockUser));

    mockRouter = { createUrlTree: jest.fn().mockReturnValue('URL_TREE') };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: mockRouter },
      ],
    });
  }

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('returns true when user is authenticated', async () => {
    setupGuard({ uid: 'test-uid', email: 'test@test.com' });

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        authGuard({} as never, {} as never)
      ) as Observable<boolean | UrlTree>
    );

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /login when user is not authenticated', async () => {
    setupGuard(null);

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        authGuard({} as never, {} as never)
      ) as Observable<boolean | UrlTree>
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe('URL_TREE');
  });
});
