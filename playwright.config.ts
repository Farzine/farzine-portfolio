import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROME_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox"],
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node --import tsx scripts/public-test-server.ts",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: { PORTFOLIO_DEMO_MODE: "true" },
  },
});
