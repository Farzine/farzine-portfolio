import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  testDir: "./tests/production",
  use: { ...base.use, baseURL: "http://127.0.0.1:3101" },
  webServer: {
    command: "node --import tsx scripts/production-test-server.ts",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
