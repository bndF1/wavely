import { test as base, expect } from '@playwright/test';
import path from 'path';
import { existsSync } from 'fs';

const AUTH_STATE_FILE = path.join(__dirname, '../../.auth/user.json');

/**
 * Playwright fixture that pre-authenticates tests using the browser storage state
 * saved by the global setup (which signs in via the Firebase Auth Emulator).
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   test('my auth test', async ({ page }) => { ... });
 */
export const test = base.extend({
  context: async ({ browser }, use) => {
    const storageState = existsSync(AUTH_STATE_FILE) ? AUTH_STATE_FILE : undefined;
    const context = await browser.newContext({
      storageState: storageState as string,
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };
