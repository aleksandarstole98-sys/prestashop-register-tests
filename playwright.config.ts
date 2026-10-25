import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // The public demo creates a fresh store on every visit, which can take a while,
  // so the timeouts are more generous than Playwright's defaults.
  timeout: 120_000,
  expect: { timeout: 15_000 },

  // One worker: the demo is a shared public environment. Running tests one by one
  // keeps the load low and the results stable.
  fullyParallel: false,
  workers: 1,

  // Retry once on CI only, so flaky behaviour is visible locally.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'https://demo.prestashop.com',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,

    // Evidence that is kept only when a test fails.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
