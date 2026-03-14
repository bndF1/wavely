import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import path from 'path';

const isCI = !!process.env['CI'];
const useEmulators = !!process.env['USE_EMULATORS'];
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  // Global setup runs when USE_EMULATORS=true: creates a test user in the
  // Firebase Auth Emulator and saves browser auth state to e2e/.auth/user.json.
  globalSetup: useEmulators
    ? path.join(__dirname, 'global-setup.ts')
    : undefined,
  fullyParallel: !isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'html',
  webServer: isCI
    ? {
        // In CI: serve the pre-built e2e output (built with --configuration=e2e).
        // Use absolute path — playwright.config.ts runs from e2e/ so relative paths
        // would resolve to e2e/dist/... which doesn't exist.
        command: `bunx serve "${workspaceRoot}/dist/wavely/browser" -p 4200 --no-clipboard --single`,
        url: 'http://localhost:4200',
        reuseExistingServer: false,
        timeout: 60_000,
      }
    : {
        // Local dev: use nx serve with live reload.
        command: 'npx nx run wavely:serve',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        cwd: workspaceRoot,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit only run locally to keep CI fast.
    ...(isCI
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
          { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
        ]),
  ],
});
