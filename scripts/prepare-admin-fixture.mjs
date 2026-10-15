import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import accounts from "../tests/fixtures/admin-accounts.json" with {
  type: "json",
};

// Test-only provisioning. Never imported by application code or pointed at a hosted project.
const status = spawnSync("npx", ["supabase", "status", "--output", "json"], {
  encoding: "utf8",
});
if (status.status !== 0)
  throw new Error("Start the isolated local Supabase stack first.");
const config = JSON.parse(status.stdout);
if (config.API_URL !== "http://127.0.0.1:54321")
  throw new Error("Expected this repository's fixed local test API.");
const provider = createClient(
  config.API_URL,
  config.SECRET_KEY || config.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const existing = await provider.auth.admin.listUsers({ perPage: 1000 });
if (existing.error) throw new Error("Unable to inspect local test users.");
const ids = {};
for (const [role, credentials] of Object.entries(accounts)) {
  const user = existing.data.users.find(
    (item) => item.email === credentials.email,
  );
  const attributes = {
    ...credentials,
    email_confirm: true,
    user_metadata: { role: "admin", is_admin: true },
  };
  const result = user
    ? await provider.auth.admin.updateUserById(user.id, attributes)
    : await provider.auth.admin.createUser(attributes);
  if (result.error || !result.data.user)
    throw new Error("Unable to provision local test users.");
  ids[role] = result.data.user.id;
  if (!/^[a-f0-9-]{36}$/.test(ids[role]))
    throw new Error("Invalid local identity.");
}
const allowlist = spawnSync(
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
    input: `insert into private.admin_users(user_id) values ('${ids.admin}') on conflict do nothing; delete from private.admin_users where user_id = '${ids.nonAdmin}';`,
    encoding: "utf8",
  },
);
if (allowlist.status !== 0)
  throw new Error("Unable to configure local test allowlist.");
console.log(
  "Two dedicated local Auth fixtures ready: one allowlisted admin and one non-admin with forged user metadata. No email sent.",
);
