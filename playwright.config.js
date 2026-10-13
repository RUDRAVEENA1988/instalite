// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',

  // Each test gets 30 seconds; the suite as a whole should finish fast.
  timeout: 30_000,
  expect: { timeout: 10_000 },

  // Re-run a flaky test once before marking it failed.
  retries: 1,

  // Single worker keeps resource usage low on the CI runner.
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',

    // Capture screenshot only on failure; saves a full trace for debugging.
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',

    // Headed mode is off in CI; locally you can pass --headed.
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
