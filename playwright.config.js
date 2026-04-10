import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,     // sequentieel: vermijdt race conditions in SPA
  workers: 1,               // één worker: module1 audio-timeouts conflicteren bij parallel
  retries: 1,
  timeout: 60000,           // verhoogd vanwege audio-fallback timeouts (8s) in module1

  use: {
    baseURL: 'http://localhost:5175',

    // iPhone 14 formaat (mobiel-first app)
    ...devices['iPhone 14'],

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // Start de dev server automatisch voor E2E tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: true,   // hergebruik als al draait
    timeout: 15000,
    env: {
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-for-e2e-testing',
    },
  },

  reporter: [
    ['html', { outputFolder: 'tests/playwright-report', open: 'never' }],
    ['json', { outputFile: 'tests/results/playwright-results.json' }],
    ['list'],
  ],

  outputDir: 'tests/results/playwright-artifacts',
})
