import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  testDir: "./tests/production",
  use: { ...base.use, baseURL: "http://127.0.0.1:3101" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: { PORTFOLIO_DEMO_MODE: "true" },
    timeout: 30000,
  },
});
