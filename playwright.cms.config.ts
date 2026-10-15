import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  testDir: "./tests/cms",
  workers: 1,
  fullyParallel: false,
  use: { ...base.use, baseURL: "http://127.0.0.1:3102" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node --import tsx scripts/cms-test-server.ts",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
