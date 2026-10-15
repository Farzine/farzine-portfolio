import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

function signatures(text) {
  const kinds = [];
  for (const [kind, pattern] of [
    ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["supabase-secret", /\bsb_secret_[A-Za-z0-9_-]{32,}/],
    [
      "github-token",
      /\b(?:gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{50,})/,
    ],
    ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["api-secret", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/],
  ])
    if (pattern.test(text)) kinds.push(kind);
  for (const match of text.matchAll(
    /\beyJ[A-Za-z0-9_-]{1,2048}\.[A-Za-z0-9_-]{10,4096}\.[A-Za-z0-9_-]{10,2048}\b/g,
  )) {
    try {
      if (
        JSON.parse(Buffer.from(match[0].split(".")[1], "base64url").toString())
          .role === "service_role"
      )
        kinds.push("service-role-jwt");
    } catch {
      /* Non-token text. */
    }
  }
  return [...new Set(kinds)];
}
const fakeJwt = (role) =>
  `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.${"signature".repeat(2)}`;
assert.deepEqual(signatures("sb_publishable_example"), []);
assert.deepEqual(signatures(fakeJwt("anon")), []);
assert.ok(signatures(fakeJwt("service_role")).includes("service-role-jwt"));
assert.ok(
  signatures(["sb_secret_", "x".repeat(40)].join("")).includes(
    "supabase-secret",
  ),
);
assert.deepEqual(signatures("a".repeat(200000)), []);
if (process.argv.includes("--self-test")) {
  console.log("PASS: secret-signature self-checks.");
  process.exit(0);
}

function git(args, input) {
  const result = spawnSync("git", args, {
    input,
    timeout: 15000,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw Error("Git security inventory failed; no credential output emitted.");
  return result.stdout;
}
const findings = [];
let textBlobs = 0;
function scan(bytes, source) {
  if (bytes.includes(0)) return;
  textBlobs++;
  const kinds = signatures(bytes.toString("utf8"));
  if (kinds.length) findings.push({ source, kinds });
}
const objects = git(["rev-list", "--objects", "--all"])
  .toString()
  .split("\n")
  .filter(Boolean)
  .map((line) => line.split(" ")[0]);
const listing = git(
  ["cat-file", "--batch-check=%(objectname) %(objecttype)"],
  `${objects.join("\n")}\n`,
)
  .toString()
  .trim()
  .split("\n");
const blobs = listing
  .filter((line) => line.endsWith(" blob"))
  .map((line) => line.split(" ")[0]);
const pack = git(["cat-file", "--batch"], `${blobs.join("\n")}\n`);
let offset = 0;
for (const blob of blobs) {
  const end = pack.indexOf(10, offset);
  const size = Number(pack.subarray(offset, end).toString().split(" ")[2]);
  assert.ok(Number.isSafeInteger(size) && size >= 0);
  scan(pack.subarray(end + 1, end + 1 + size), `git-blob:${blob}`);
  offset = end + 1 + size + 1;
}
for (const name of git([
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
])
  .toString()
  .split("\0")
  .filter(Boolean)) {
  if (/(?:^|\/)\.env(?:\.|$)/.test(name) && name !== ".env.example") continue;
  try {
    if (statSync(name).isFile())
      scan(
        readFileSync(name),
        `working-file-sha:${createHash("sha256").update(name).digest("hex").slice(0, 16)}`,
      );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const chunks = readdirSync(".next/static/chunks").filter((name) =>
  name.endsWith(".js"),
);
const accounts = JSON.parse(
  readFileSync("tests/fixtures/admin-accounts.json", "utf8"),
);
const privateValues = [
  accounts.admin.password,
  accounts.nonAdmin.password,
  "PRIVATE_TEST_CANARY",
  "legacy-inventory.json",
];
for (const name of chunks) {
  const bytes = readFileSync(`.next/static/chunks/${name}`);
  scan(bytes, `client:${name}`);
  if (privateValues.some((value) => bytes.toString().includes(value)))
    findings.push({
      source: `client:${name}`,
      kinds: ["private-fixture-or-seed"],
    });
}
const cacheDirectory = ".next/cache/fetch-cache";
const cacheFiles = existsSync(cacheDirectory)
  ? readdirSync(cacheDirectory).filter((name) =>
      statSync(`${cacheDirectory}/${name}`).isFile(),
    )
  : [];
for (const name of cacheFiles) {
  const bytes = readFileSync(`${cacheDirectory}/${name}`);
  scan(bytes, `data-cache:${name}`);
  if (privateValues.some((value) => bytes.toString().includes(value)))
    findings.push({
      source: `data-cache:${name}`,
      kinds: ["private-fixture-or-seed"],
    });
}
if (findings.length) {
  console.error(
    JSON.stringify({
      message:
        "Potential credentials/private client data found. Values are deliberately omitted; inspect identified blobs privately.",
      findings,
    }),
  );
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${blobs.length} reachable Git blobs, current nonignored files, ${chunks.length} client chunks and ${cacheFiles.length} Data Cache entries scanned (${textBlobs} text checks); no known secret signatures/private client/cache fixtures found. History shallow: ${git(["rev-parse", "--is-shallow-repository"]).toString().trim()}. Ignored environment files were not read. Pattern checks are not a guarantee of absence.`,
  );
