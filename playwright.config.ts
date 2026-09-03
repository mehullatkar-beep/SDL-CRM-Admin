import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      "DB_PROVIDER=pglite PGLITE_DATABASE_NAME=e2e npm run db:migrate && DB_PROVIDER=pglite PGLITE_DATABASE_NAME=e2e SEED_DEMO_USERS=true npm run db:seed && DB_PROVIDER=pglite PGLITE_DATABASE_NAME=e2e AUTH_SECRET=e2e-secret AUTH_TRUST_HOST=true LAB_MASTER_PROVIDER=mock npm run start -- -p 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
