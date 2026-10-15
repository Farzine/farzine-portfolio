import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const url = process.env.PORTFOLIO_TYPES_DB_URL;
if (!url)
  throw new Error(
    "Set PORTFOLIO_TYPES_DB_URL to the local/test database connection URL before generating types.",
  );
const result = spawnSync(
  "npx",
  [
    "supabase",
    "gen",
    "types",
    "typescript",
    "--db-url",
    url,
    "--schema",
    "public",
  ],
  { encoding: "utf8" },
);
if (result.status !== 0)
  throw new Error(
    "Database type generation failed; existing types have been preserved. Verify the local database connection.",
  );
assert.ok(
  result.stdout.includes("export type Database"),
  "Unexpected generator output; existing types preserved",
);
const formatted = spawnSync(
  "npx",
  ["biome", "format", "--stdin-file-path", "lib/types/database.ts"],
  { input: result.stdout, encoding: "utf8" },
);
if (formatted.status !== 0)
  throw new Error(
    "Generated types could not be formatted; existing types preserved.",
  );
await writeFile("lib/types/database.ts", formatted.stdout);
console.log(
  "Database types generated from schema public (official Supabase CLI).",
);
