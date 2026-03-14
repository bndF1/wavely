import { chromium, type FullConfig } from '@playwright/test';
import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

const TEST_USER_ID = 'e2e-test-user';
const TEST_USER_EMAIL = 'e2e@wavely.app';
const TEST_USER_DISPLAY_NAME = 'E2E Test User';
const AUTH_STATE_FILE = path.join(__dirname, '.auth', 'user.json');
const EMULATOR_AUTH_HOST = process.env['FIREBASE_AUTH_EMULATOR_HOST'] ?? '127.0.0.1:9099';

async function globalSetup(config: FullConfig): Promise<void> {
  process.env['FIREBASE_AUTH_EMULATOR_HOST'] = EMULATOR_AUTH_HOST;

  const appName = 'e2e-global-setup';
  const existingApp = getApps().find((a) => a.name === appName);
  const adminApp = existingApp ?? initializeApp({ projectId: 'wavely-f659c' }, appName);
  const auth = getAuth(adminApp);

  // Create test user — idempotent
  try {
    await auth.createUser({
      uid: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      displayName: TEST_USER_DISPLAY_NAME,
      emailVerified: true,
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code !== 'auth/uid-already-exists') throw e;
  }

  const customToken = await auth.createCustomToken(TEST_USER_ID);

  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_STATE_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Sign in via the app's /e2e-auth/:token route and capture localStorage-based
  // auth state (the e2e build forces browserLocalPersistence so Playwright's
  // storageState — which captures localStorage — can persist the session).
  const baseURL =
    (config.projects[0]?.use?.baseURL as string | undefined) ?? 'http://localhost:4200';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture browser console and page errors so CI logs show what went wrong
  page.on('console', (msg) => console.log(`[browser:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => console.error('[browser:pageerror]', err.message));

  await page.goto(`${baseURL}/e2e-auth/${customToken}`, {
    waitUntil: 'load',
    timeout: 30_000,
  });
  console.log('[global-setup] URL after goto:', page.url());

  await page.waitForURL(/\/tabs\/home/, { timeout: 60_000 });
  await context.storageState({ path: AUTH_STATE_FILE });

  await browser.close();
  await deleteApp(adminApp);
}

export default globalSetup;
