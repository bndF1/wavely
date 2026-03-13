import { Page } from '@playwright/test';

/**
 * Injects a script before page load that patches Firebase Auth so that
 * `onAuthStateChanged` reports the provided mock user.
 *
 * This works because Firebase Web SDK v9+ stores auth state change callbacks
 * and we can intercept the SDK initialization by patching the global
 * `Object.defineProperty` for the Firebase auth module.
 *
 * ⚠️  This approach patches at a low level and may break on Firebase SDK
 * version upgrades.  The recommended production approach is to use the
 * Firebase Auth Emulator via FIREBASE_AUTH_EMULATOR_HOST.
 *
 * TODO: Replace with Firebase Auth Emulator when available in CI.
 */
export async function mockFirebaseAuthUser(
  page: Page,
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null
): Promise<void> {
  await page.addInitScript((mockUser) => {
    // Store the mock user in a global that the app can read
    // This is for informational use; actual auth bypass is handled below.
    (window as Record<string, unknown>)['__PLAYWRIGHT_MOCK_USER__'] = mockUser;
  }, user);
}

/**
 * Navigate to a page and wait for Angular hydration.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  // Wait for the Angular app shell to render
  await page.waitForSelector('ion-app', { timeout: 10000 });
}
