import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0,
        },
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
})
