import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";

const origin = "http://127.0.0.1:3103";
const lighthouseVersion = "13.5.0";
assert.equal(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "http://127.0.0.1:54321",
  "Audit requires the isolated local provider.",
);
// Refuse reuse: never benchmark or terminate an unknown development server.
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(3103, "127.0.0.1", resolve);
});
await new Promise((resolve, reject) =>
  probe.close((error) => (error ? reject(error) : resolve())),
);
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3103",
  ],
  { stdio: "ignore" },
);
const stopped = new Promise((resolve) => app.on("exit", resolve));
const reports = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    assert.equal(app.exitCode, null, "Owned audit server exited.");
    try {
      const response = await fetch(origin);
      assert.equal(
        response.status,
        200,
        "Audit needs real published local content.",
      );
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  assert.ok(ready, "Local audit server unavailable.");
  await mkdir("test-results/lighthouse", { recursive: true });
  for (const mode of ["mobile", "desktop"]) {
    for (const [name, path] of [
      ["home", "/"],
      ["project", "/projects/gsa-sust"],
    ]) {
      const output = `test-results/lighthouse/${mode}-${name}.json`;
      const args = [
        "--yes",
        `lighthouse@${lighthouseVersion}`,
        `${origin}${path}`,
        "--quiet",
        "--output=json",
        `--output-path=${output}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
        ...(mode === "desktop" ? ["--preset=desktop"] : []),
      ];
      const child = spawn("npx", args, { stdio: "inherit", timeout: 120000 });
      const code = await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", resolve);
      });
      assert.equal(code, 0, "Lighthouse did not complete.");
      const report = JSON.parse(await readFile(output, "utf8"));
      assert.ok(!report.runtimeError, "Lighthouse reported a runtime error.");
      const { audits } = report;
      const requests = audits["network-requests"].details.items;
      reports.push({
        mode,
        path,
        lighthouseVersion: report.lighthouseVersion,
        fetchTime: report.fetchTime,
        userAgent: report.environment.hostUserAgent,
        throttling: report.configSettings.throttling,
        network: {
          transferBytes: audits["total-byte-weight"].numericValue,
          stylesheetTransferBytes: requests
            .filter((request) => request.resourceType === "Stylesheet")
            .reduce((total, request) => total + request.transferSize, 0),
          stylesheetRequests: requests.filter(
            (request) => request.resourceType === "Stylesheet",
          ).length,
        },
        scores: Object.fromEntries(
          Object.entries(report.categories).map(([key, category]) => [
            key,
            category.score === null ? null : Math.round(category.score * 100),
          ]),
        ),
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "speed-index",
            "total-blocking-time",
            "cumulative-layout-shift",
          ].map((key) => [
            key,
            { value: audits[key].numericValue, unit: audits[key].numericUnit },
          ]),
        ),
        warnings: report.runWarnings,
        actionable: Object.values(audits)
          .filter(
            (audit) =>
              audit.score !== null &&
              audit.score < 0.9 &&
              !["manual", "informative", "notApplicable"].includes(
                audit.scoreDisplayMode,
              ),
          )
          .map((audit) => ({
            id: audit.id,
            score: audit.score,
            title: audit.title,
            displayValue: audit.displayValue,
          })),
      });
      console.log(`${mode} ${name}: ${JSON.stringify(reports.at(-1).scores)}`);
    }
  }
  await mkdir("docs/qa/phase-8", { recursive: true });
  await writeFile(
    "docs/qa/phase-8/lighthouse-summary.json",
    `${JSON.stringify({ scope: "Single local production navigation per mode/route, warm server Data Cache, fresh Lighthouse browser storage; simulated throttling, not hosted CWV or physical phone evidence.", reports }, null, 2)}\n`,
  );
} finally {
  app.kill("SIGTERM");
  await stopped;
}
