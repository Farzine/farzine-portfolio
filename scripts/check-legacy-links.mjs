import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const { records } = JSON.parse(await readFile("data/legacy-seed.json", "utf8"));
const fields = {
  site_settings: ["canonical_url", "primary_cta_url", "secondary_cta_url"],
  projects: ["source_url", "demo_url", "download_url"],
  experiences: ["url"],
  education: ["url"],
  certifications: ["credential_url"],
  achievements: ["url"],
  skills: ["logo_url"],
  social_links: ["url"],
  document_links: ["url"],
};
const urls = [
  ...new Set(
    Object.entries(fields)
      .flatMap(([table, keys]) =>
        records[table].flatMap((row) => keys.map((key) => row[key])),
      )
      .filter(
        (value) => typeof value === "string" && /^https?:\/\//.test(value),
      ),
  ),
].sort();
assert.ok(urls.length > 20 && urls.length < 1000);
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      try {
        let response = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
        });
        if ([405, 501].includes(response.status))
          response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        await response.body?.cancel();
        results.push({
          url,
          status: response.status,
          finalUrl: response.url,
          outcome: response.ok
            ? "reachable"
            : [404, 410].includes(response.status)
              ? "unavailable"
              : "needs-owner-browser-review",
        });
      } catch (error) {
        results.push({ url, outcome: "unverified-network", error: error.name });
      }
    }
  }),
);
await mkdir("docs/qa/phase-8", { recursive: true });
await writeFile(
  "docs/qa/phase-8/legacy-links.json",
  `${JSON.stringify({ checkedAt: new Date().toISOString(), scope: "Read-only historical seed URLs, HEAD with GET fallback only for 405/501; private login/access or network errors do not prove a dead link. No source/CMS URLs changed.", results: results.sort((a, b) => a.url.localeCompare(b.url)) }, null, 2)}\n`,
);
console.log(
  JSON.stringify({
    checked: urls.length,
    outcomes: results.reduce((counts, row) => {
      counts[row.outcome] = (counts[row.outcome] || 0) + 1;
      return counts;
    }, {}),
  }),
);
