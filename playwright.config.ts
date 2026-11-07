import { defineConfig, devices } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@local.dev";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "DevSetup#2026aa";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4000",
    trace: "retain-on-failure",
    launchOptions: { args: ["--no-sandbox"] },
  },
  webServer: {
    command: "npx next start -p 4000",
    url: "http://127.0.0.1:4000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  metadata: { adminEmail: ADMIN_EMAIL, adminPassword: ADMIN_PASSWORD },
});
