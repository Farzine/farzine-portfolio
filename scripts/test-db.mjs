import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";

const container = "farzine-portfolio-phase2-db";
const inspected = spawnSync(
  "docker",
  ["inspect", "--format", "{{json .Config.Env}}", container],
  { encoding: "utf8" },
);
if (
  inspected.status !== 0 ||
  !JSON.parse(inspected.stdout).includes(
    "POSTGRES_PASSWORD=local-policy-test-only",
  )
) {
  throw new Error(
    "Refusing to run: expected the disposable policy-test container, not an arbitrary database.",
  );
}
function sql(input) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-X",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
    ],
    { input, encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error(
      result.stderr || result.error?.message || "Local SQL check failed",
    );
  return result.stdout.trim();
}
let ready = false;
for (let attempt = 0; attempt < 20; attempt++) {
  if (
    spawnSync("docker", ["exec", container, "pg_isready", "-U", "postgres"], {
      stdio: "ignore",
    }).status === 0
  ) {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
assert.ok(
  ready,
  "Disposable PostgreSQL did not become ready within 20 seconds",
);
const isInitialized =
  sql("select to_regclass('public.projects') is not null;") === "t";
if (!isInitialized) {
  sql(await readFile("supabase/tests/provider-fixture.sql", "utf8"));
  for (const file of (await readdir("supabase/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    sql(await readFile(`supabase/migrations/${file}`, "utf8"));
  }
}
const seed = await readFile("supabase/seed.sql", "utf8");
sql(seed);
const before = sql("select count(*) from public.projects;");
sql(seed);
assert.equal(sql("select count(*) from public.projects;"), before);
sql(await readFile("supabase/tests/policies.sql", "utf8"));
const result = sql(
  "begin; update public.site_settings set display_name='Owner edited' where id; " +
    seed.replace(/^begin;$/m, "").replace(/^commit;$/m, "") +
    " select display_name from public.site_settings where id; rollback;",
);
assert.ok(
  result.includes("Owner edited"),
  "Reseeding must not overwrite owner edits",
);
console.log(
  "PASS: migrations, repeatable non-destructive seed, RLS anon/non-admin/admin, draft/private/scheduled read boundaries, URL/slug/media constraints and Storage policies (local provider fixtures).",
);
