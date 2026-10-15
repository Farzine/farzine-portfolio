import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3101",
  ],
  {
    stdio: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORTFOLIO_USE_DEV_SEED: "true",
    },
  },
);
const exited = new Promise((resolve) => child.on("exit", resolve));
try {
  let response;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      response = await fetch("http://127.0.0.1:3101/");
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  assert.ok(response, "Production boundary test server did not become ready");
  assert.equal(response.status, 500);
  const html = await response.text();
  for (const value of [
    "02 January 2003",
    "PRIVATE_TEST_CANARY",
    "Historical preview",
    "Gaibandha Students Association Website",
  ])
    assert.ok(
      !html.includes(value),
      "Seed/private data leaked through production error path",
    );
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      (existsSync("/usr/bin/google-chrome")
        ? "/usr/bin/google-chrome"
        : undefined),
  });
  try {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:3101/");
    await page
      .getByRole("heading", { name: "Unable to load this page" })
      .waitFor();
    await page.getByRole("button", { name: "Try again" }).waitFor();
  } finally {
    await browser.close();
  }
  console.log(
    "PASS: production rejects development seed mode with HTTP 500, safe recovery UI and no seed/private output.",
  );
} finally {
  child.kill("SIGTERM");
  await exited;
}
