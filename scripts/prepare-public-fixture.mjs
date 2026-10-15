import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

// Fixed local container only; intentionally no remote DB URL option.
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_farzine-portfolio-v3",
    "psql",
    "-X",
    "-U",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  {
    input: await readFile("supabase/tests/public-fixture.sql", "utf8"),
    encoding: "utf8",
  },
);
if (result.status !== 0)
  throw new Error(
    "Local public fixture failed. Confirm the isolated repository Supabase stack is running.",
  );
console.log(
  "Local rendering fixtures prepared: historical items public, personal facts private, draft canary private. No hosted database accessed.",
);
