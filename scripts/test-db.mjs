import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
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
if (!isInitialized)
  sql(await readFile("supabase/tests/provider-fixture.sql", "utf8"));
const migrations = (await readdir("supabase/migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const tracked =
  sql("select to_regclass('private.test_applied_migrations') is not null;") ===
  "t";
sql(
  "create table if not exists private.test_applied_migrations(name text primary key);",
);
if (isInitialized && !tracked)
  sql(
    "insert into private.test_applied_migrations values ('202610150001_portfolio.sql') on conflict do nothing;",
  );
for (const file of migrations) {
  const quoted = file.replaceAll("'", "''");
  if (
    sql(
      `select count(*) from private.test_applied_migrations where name='${quoted}';`,
    ) === "0"
  ) {
    sql(await readFile(`supabase/migrations/${file}`, "utf8"));
    sql(`insert into private.test_applied_migrations values ('${quoted}');`);
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

async function concurrentSql(query) {
  return new Promise((resolve, reject) => {
    const process = spawn(
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
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let output = "",
      error = "";
    process.stdout.on("data", (data) => {
      output += data;
    });
    process.stderr.on("data", (data) => {
      error += data;
    });
    process.on("error", reject);
    process.on("close", (status) => resolve({ status, output, error }));
    process.stdin.end(`set statement_timeout='5s'; ${query}`);
  });
}
const assetId = "60000000-0000-4000-8000-000000000001";
const projectId = "60000000-0000-4000-8000-000000000002";
const cleanRace = () =>
  sql(
    `delete from public.projects where id='${projectId}'; delete from public.media_assets where id='${assetId}';`,
  );
const insertReference = `insert into public.projects(id,title,slug,cover_media_id) values ('${projectId}','Local race fixture','local-media-race-fixture','${assetId}');`;
try {
  for (const referenceFirst of [true, false]) {
    cleanRace();
    sql(
      `insert into public.media_assets(id,label,kind,bucket,object_path,mime_type,size_bytes,is_public) values ('${assetId}','Local race fixture','image','portfolio-private','${assetId}/${assetId}.png','image/png',100,false);`,
    );
    const firstQuery = referenceFirst
      ? insertReference
      : `update public.media_assets set pending_delete=true where id='${assetId}';`;
    const first = concurrentSql(
      `set application_name='portfolio-media-race'; begin; ${firstQuery} select pg_sleep(1.5); commit;`,
    );
    let locked = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      if (
        sql(
          "select count(*) from pg_stat_activity where application_name='portfolio-media-race' and wait_event='PgSleep';",
        ) === "1"
      ) {
        locked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(
      locked,
      "Concurrent transaction did not acquire its reference/asset lock",
    );
    const second = await concurrentSql(
      referenceFirst
        ? `update public.media_assets set pending_delete=true where id='${assetId}';`
        : insertReference,
    );
    const committed = await first;
    assert.equal(committed.status, 0, "First concurrent transaction failed");
    assert.notEqual(
      second.status,
      0,
      "Reference creation and tombstone must never both commit",
    );
    assert.ok(
      second.error.includes(
        referenceFirst
          ? "Media is still referenced"
          : "Media unavailable for selection",
      ),
      "Concurrent mutation did not fail at the intended guard",
    );
  }
} finally {
  cleanRace();
}
console.log(
  "PASS: two-session reference/tombstone races denied in both orders.",
);
console.log(
  "PASS: migrations, repeatable non-destructive seed, RLS anon/non-admin/admin, draft/private/scheduled read boundaries, URL/slug/media constraints and Storage policies (local provider fixtures).",
);
